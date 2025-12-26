
import { supabase } from './supabase';
import { User, Service, Provider, Booking, Role, BookingStatus, Notification, ProviderPhoto } from '../types';
import { sendProviderAssignmentEmail } from './email';
import { sendPushNotification } from './push';

// --- DATA MAPPERS ---

const mapUser = (row: any): User => {
  if (!row) return { id: '', name: 'Unknown', email: '', phone: '', passwordHash: '', role: Role.CUSTOMER, createdAt: '' };
  return {
    id: row.id,
    name: row.name || 'User',
    email: row.email || '',
    passwordHash: row.password_hash || '',
    phone: row.phone || '',
    role: (row.role as Role) || Role.CUSTOMER,
    createdAt: row.created_at,
  };
};

const mapService = (row: any): Service => ({
  id: row.id,
  name: row.name,
  description: row.description,
  basePrice: row.base_price,
  maxPrice: row.max_price,
  icon: row.icon,
  createdAt: row.created_at,
});

const mapProviderPhoto = (row: any): ProviderPhoto => ({
  id: row.id,
  providerId: row.provider_id,
  url: row.url,
  caption: row.caption,
  createdAt: row.created_at
});

const mapProvider = (row: any): Provider => ({
  id: row.id,
  userId: row.user_id,
  skill: row.skill,
  area: row.area,
  rating: row.rating,
  isActive: row.is_active,
  approvalStatus: row.approval_status || 'ACTIVE', 
  experienceYears: row.experience_years,
  bio: row.bio,
  isDeleted: row.is_deleted || false, 
  oneSignalId: row.one_signal_id, 
  user: row.users ? (Array.isArray(row.users) ? mapUser(row.users[0]) : mapUser(row.users)) : undefined,
  photos: row.provider_photos ? row.provider_photos.map(mapProviderPhoto) : [],
});

const mapBooking = (row: any): Booking => ({
  id: row.id,
  customerId: row.customer_id,
  serviceId: row.service_id,
  providerId: row.provider_id,
  description: row.description,
  address: row.address,
  area: row.area,
  date: row.date,
  time: row.time,
  amount: row.amount,
  status: row.status as BookingStatus,
  rating: row.rating,
  review: row.review,
  createdAt: row.created_at,
  customer: row.customer ? mapUser(row.customer) : undefined,
  service: row.service ? mapService(row.service) : undefined,
  provider: row.provider ? mapProvider(row.provider) : undefined,
});

const mapNotification = (row: any): Notification => ({
  id: row.id,
  userId: row.user_id,
  message: row.message,
  isRead: row.is_read,
  type: row.type,
  createdAt: row.created_at,
});

// --- HELPER: LOCATION NORMALIZATION ---
const normalizeLocation = (input: string): string => {
  if (!input) return '';
  const lower = input.toLowerCase().trim();
  // Alias Map for common misspellings in Aurangabad/Bihar region
  const aliases: Record<string, string> = {
    'aurngabad': 'aurangabad',
    'orangabad': 'aurangabad',
    'abad': 'aurangabad',
    'sambhajinagar': 'aurangabad',
    'cidco': 'cidco',
    'n1': 'cidco', 'n2': 'cidco', 'n3': 'cidco', 'n4': 'cidco', // Map sectors to main area
    'hudco': 'hudco',
    'tv center': 'hudco',
    'beed bypass': 'beed bypass',
    'waluj': 'waluj',
    'pandharpur': 'waluj',
    'chikalthana': 'chikalthana',
    'garkheda': 'garkheda',
  };
  
  // Check strict alias match or partial match
  for (const key in aliases) {
    if (lower.includes(key)) return aliases[key];
  }
  return lower;
};

// --- HELPER: PIN GENERATION ---
export const generateCompletionPin = (bookingId: string, createdAt: string): string => {
  return getStaticBookingPin(bookingId);
};

export const getStaticBookingPin = (bookingId: string): string => {
  if (!bookingId) return '123456';
  try {
    const hexFragment = bookingId.replace(/-/g, '').slice(-6);
    const num = parseInt(hexFragment, 16);
    if (isNaN(num)) return '849201'; 
    
    const pin = (num * 7 + 13) % 1000000;
    return pin.toString().padStart(6, '0');
  } catch (e) {
    return '123456';
  }
}

// --- HELPER: WHATSAPP ---
export const getWhatsAppLink = (phone: string | undefined, message: string) => {
  if (!phone) return '#';
  const cleanPhone = phone.replace(/\D/g, ''); 
  const finalPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  return `https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`;
};

// --- HELPER: SAFE EXTRACTION ---
const getSafeUserFromRelation = (relationData: any) => {
  if (!relationData) return null;
  if (Array.isArray(relationData)) return relationData.length > 0 ? relationData[0] : null;
  return relationData;
};

// --- HELPER: AUTO ASSIGNMENT ---
export const checkAndTriggerAutoAssignment = async () => {
  try {
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    
    const { data: staleBookings } = await supabase
      .from('bookings')
      .select('*, service:services(name)')
      .eq('status', 'PENDING')
      .lt('created_at', twoMinutesAgo);

    if (!staleBookings || staleBookings.length === 0) return;

    for (const booking of staleBookings) {
      const { data: candidates } = await supabase
        .from('providers')
        .select('id, user_id, rating, is_active, approval_status, skill, area, one_signal_id')
        .eq('skill', booking.service.name)
        .ilike('area', `%${booking.area}%`); 

      if (candidates && candidates.length > 0) {
        const activeCandidates = candidates.filter(p => 
          p.is_active === true && 
          (p.approval_status === 'ACTIVE' || !p.approval_status)
        );

        if (activeCandidates.length > 0) {
          const bestProvider = activeCandidates.sort((a, b) => b.rating - a.rating)[0];
          await updateBookingStatus(booking.id, BookingStatus.ASSIGNED, bestProvider.id);
          await createNotification(bestProvider.user_id, `Auto-assigned new job: ${booking.service.name}`, 'INFO');
          await createNotification(booking.customer_id, `Provider auto-assigned to your booking!`, 'SUCCESS');
        } else {
           await updateBookingStatus(booking.id, BookingStatus.WAITING);
        }
      } else {
        await updateBookingStatus(booking.id, BookingStatus.WAITING);
      }
    }
  } catch (e) { }
};

// --- AUTH ---
export const authenticateUser = async (email: string, passwordHash: string): Promise<User | null> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .eq('password_hash', passwordHash)
    .single();

  if (error || !data) return null;
  return mapUser(data);
};

export const initializeDB = async () => {};

// --- USERS ---
export const getUsers = async (): Promise<User[]> => {
  const { data, error } = await supabase.from('users').select('*');
  if (error) throw error;
  return data.map(mapUser);
};

export const createUser = async (user: Omit<User, 'id' | 'createdAt'>): Promise<User> => {
  const { data, error } = await supabase.from('users').insert({
    name: user.name,
    email: user.email,
    phone: user.phone,
    password_hash: user.passwordHash,
    role: user.role
  }).select().single();
  
  if (error) throw error;
  return mapUser(data);
};

// --- SERVICES ---
export const getServices = async (): Promise<Service[]> => {
  const { data, error } = await supabase.from('services').select('*').order('name');
  if (error) {
    console.error("getServices Error:", error);
    return [];
  }
  return data ? data.map(mapService) : [];
};

export const createService = async (service: Omit<Service, 'id' | 'createdAt'>): Promise<Service> => {
  const { data, error } = await supabase.from('services').insert({
    name: service.name,
    description: service.description,
    base_price: service.basePrice,
    max_price: service.maxPrice,
    icon: service.icon
  }).select().single();
  if (error) throw error;
  return mapService(data);
};

export const updateService = async (id: string, updates: Partial<Service>) => {
  const dbUpdates: any = {};
  if (updates.name) dbUpdates.name = updates.name;
  if (updates.description) dbUpdates.description = updates.description;
  if (updates.basePrice !== undefined) dbUpdates.base_price = updates.basePrice;
  if (updates.maxPrice !== undefined) dbUpdates.max_price = updates.maxPrice;
  if (updates.icon) dbUpdates.icon = updates.icon;
  const { error } = await supabase.from('services').update(dbUpdates).eq('id', id);
  if (error) throw error;
};

export const deleteService = async (id: string) => {
  const { error } = await supabase.from('services').delete().eq('id', id);
  if (error) throw error;
};

// --- PROVIDERS ---
export const getProviders = async (): Promise<Provider[]> => {
  let data, error;

  // Try fetching with photos first
  const resultWithPhotos = await supabase
    .from('providers')
    .select('*, users(*), provider_photos(*)');
  
  if (resultWithPhotos.error) {
    console.warn("Fetching providers with photos failed, falling back to basic...", resultWithPhotos.error.message);
    // Fallback if provider_photos table missing
    const resultBasic = await supabase
      .from('providers')
      .select('*, users(*)');
    data = resultBasic.data;
    error = resultBasic.error;
  } else {
    data = resultWithPhotos.data;
    error = resultWithPhotos.error;
  }

  if (error) {
    console.error("getProviders Error:", error);
    return [];
  }
  return data ? data.map(mapProvider).filter((p: Provider) => !p.isDeleted) : [];
};

export const getPendingProviders = async (): Promise<Provider[]> => {
  const { data, error } = await supabase.from('providers').select('*, users(*)');
  if (error) return [];
  return data.map(mapProvider).filter(p => p.approvalStatus === 'PENDING' && !p.isDeleted);
};

export const createProvider = async (userId: string, skill: string, area: string, bio?: string, experience?: number): Promise<Provider> => {
  const fullPayload = {
    user_id: userId,
    skill,
    area,
    rating: 0,
    is_active: false,
    approval_status: 'PENDING',
    bio: bio || '',
    experience_years: experience || 0,
    is_deleted: false
  };
  try {
    const { data, error } = await supabase.from('providers').insert(fullPayload).select().single();
    if (error) throw error;
    return mapProvider(data);
  } catch (e: any) {
    const basicPayload = { user_id: userId, skill, area, rating: 0, is_active: false };
    const { data, error } = await supabase.from('providers').insert(basicPayload).select().single();
    if (error) throw error;
    return mapProvider(data);
  }
};

export const updateProvider = async (id: string, updates: Partial<Provider> & { oneSignalId?: string }) => {
  const dbUpdates: any = {};
  if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
  if (updates.approvalStatus) dbUpdates.approval_status = updates.approvalStatus;
  if (updates.skill) dbUpdates.skill = updates.skill;
  if (updates.area) dbUpdates.area = updates.area;
  if (updates.rating !== undefined) dbUpdates.rating = updates.rating;
  if (updates.oneSignalId) dbUpdates.one_signal_id = updates.oneSignalId;

  const { error } = await supabase.from('providers').update(dbUpdates).eq('id', id);
  if (error && error.message.includes('one_signal_id')) {
     delete dbUpdates.one_signal_id;
     if (Object.keys(dbUpdates).length > 0) {
        await supabase.from('providers').update(dbUpdates).eq('id', id);
     }
  } else if (error) {
     throw error;
  }
};

export const deleteProvider = async (id: string) => {
  try {
    const { error } = await supabase.from('providers').update({ is_deleted: true }).eq('id', id);
    if (error) throw error;
  } catch (e) {
     await supabase.from('providers').delete().eq('id', id);
  }
};

export const addProviderPhoto = async (providerId: string, url: string, caption?: string) => {
  try {
    const { data, error } = await supabase.from('provider_photos').insert({
      provider_id: providerId,
      url,
      caption
    }).select().single();
    
    if (error) throw error;
    return mapProviderPhoto(data);
  } catch (e) {
    console.error("Failed to add photo (table might be missing)", e);
    throw e;
  }
};

export const deleteProviderPhoto = async (photoId: string) => {
  const { error } = await supabase.from('provider_photos').delete().eq('id', photoId);
  if (error) throw error;
};

// --- SMART SEARCH PROVIDERS ---
export const searchProviders = async (serviceName: string, areaQuery: string): Promise<Provider[]> => {
  const normalizedArea = normalizeLocation(areaQuery);
  
  let data, error;

  // 1. Try Fetching with Photos
  const resultWithPhotos = await supabase
    .from('providers')
    .select('*, users(*), provider_photos(*)')
    .eq('skill', serviceName);

  if (resultWithPhotos.error) {
    console.warn("Search with photos failed (likely missing table), retrying basic search...", resultWithPhotos.error.message);
    // 2. Fallback: Fetch without photos
    const resultBasic = await supabase
      .from('providers')
      .select('*, users(*)')
      .eq('skill', serviceName);
    data = resultBasic.data;
    error = resultBasic.error;
  } else {
    data = resultWithPhotos.data;
    error = resultWithPhotos.error;
  }
    
  if (error) {
    console.error("Supabase Search Error:", error);
    throw error;
  }
  
  // Safely map and filter
  const allProviders = (data || []).map(mapProvider).filter(p => p.isActive && p.approvalStatus === 'ACTIVE' && !p.isDeleted);
  
  // Filter by normalized location using Includes check
  return allProviders.filter(p => {
    const providerAreaNormalized = normalizeLocation(p.area);
    return providerAreaNormalized.includes(normalizedArea) || normalizedArea.includes(providerAreaNormalized);
  });
};

// --- BOOKINGS ---
export const getBookings = async (): Promise<Booking[]> => {
  checkAndTriggerAutoAssignment();
  const { data, error } = await supabase.from('bookings').select(`
    *,
    customer:users!customer_id(*),
    service:services(*),
    provider:providers(*, users(*))
  `).order('created_at', { ascending: false });

  if (error) {
    console.error("getBookings Error:", error);
    return [];
  }
  return data ? data.map(mapBooking) : [];
};

export const createBooking = async (booking: Omit<Booking, 'id' | 'createdAt' | 'status'>): Promise<Booking> => {
  const basePayload = {
    customer_id: booking.customerId,
    service_id: booking.serviceId,
    provider_id: booking.providerId || null,
    description: booking.description,
    address: booking.address,
    area: booking.area,
    date: booking.date,
    time: booking.time,
    amount: booking.amount,
    status: booking.providerId ? 'ASSIGNED' : 'PENDING',
  };

  const { data, error } = await supabase.from('bookings').insert(basePayload).select().single();
  if (error) throw error;

  await notifyBookingCreated(booking.customerId, booking.providerId || null);
  
  if (booking.providerId) {
     const { data: prov } = await supabase.from('providers').select('*, users(*)').eq('id', booking.providerId).single();
     const { data: svc } = await supabase.from('services').select('*').eq('id', booking.serviceId).single();
     const { data: cust } = await supabase.from('users').select('*').eq('id', booking.customerId).single();
     
     const provUser = getSafeUserFromRelation(prov?.users);
     const custData = cust;

     if (provUser && svc && custData) {
        // Email
        await sendProviderAssignmentEmail({
          to_name: provUser.name,
          to_email: provUser.email,
          customer_name: custData.name,
          customer_phone: custData.phone,
          service_name: svc.name,
          booking_date: booking.date,
          booking_time: booking.time,
          booking_location: `${booking.address}, ${booking.area}`,
          amount: booking.amount.toString()
        });

        // Push
        if (prov.one_signal_id) {
           await sendPushNotification(
             [prov.one_signal_id], 
             "New Booking Assigned! 🚀", 
             `New ${svc.name} job in ${booking.area} for ₹${booking.amount}`
           );
        }
     }
  }

  return mapBooking(data);
};

const notifyBookingCreated = async (customerId: string, providerId: string | null) => {
  try {
    await createNotification(customerId, 'Booking created! Share PIN with provider when done.', 'SUCCESS');
    if (providerId) {
      const { data: prov } = await supabase.from('providers').select('user_id').eq('id', providerId).single();
      if (prov) await createNotification(prov.user_id, 'New Booking Assigned!', 'INFO');
    }
  } catch (e) { }
}

export const updateBookingStatus = async (id: string, status: BookingStatus, providerId?: string) => {
  const updates: any = { status };
  if (providerId) updates.provider_id = providerId;
  
  const { error } = await supabase.from('bookings').update(updates).eq('id', id);
  if (error) throw error;

  try {
    const { data: booking } = await supabase
      .from('bookings')
      .select('*, customer:users!customer_id(*), service:services(*), provider:providers(*, users(*))')
      .eq('id', id)
      .single();

    if (booking) {
      if (status === 'COMPLETED') await createNotification(booking.customer_id, 'Service completed. Please rate!', 'SUCCESS');
      if (status === 'ASSIGNED') {
         await createNotification(booking.customer_id, 'Provider assigned.', 'INFO');
         const finalProvId = providerId || booking.provider_id;
         if (finalProvId) {
            const { data: prov } = await supabase.from('providers').select('*, users(*)').eq('id', finalProvId).single();
            const provUser = getSafeUserFromRelation(prov?.users);
            const customerUser = getSafeUserFromRelation(booking.customer);

            if (provUser && customerUser && booking.service) {
               // Email
               await sendProviderAssignmentEmail({
                  to_name: provUser.name,
                  to_email: provUser.email,
                  customer_name: customerUser.name,
                  customer_phone: customerUser.phone,
                  service_name: booking.service.name,
                  booking_date: booking.date,
                  booking_time: booking.time,
                  booking_location: `${booking.address}, ${booking.area}`,
                  amount: booking.amount.toString()
               });

               // Push
               if (prov.one_signal_id) {
                  await sendPushNotification(
                    [prov.one_signal_id],
                    "New Job Assigned! 🚀",
                    `${booking.service.name} job at ${booking.area}. Click to view details.`
                  );
               }
            }
         }
      }
    }
  } catch (e: any) {
    console.error("Notify error", e.message || e);
  }
};

export const triggerManualEmailNotification = async (bookingId: string) => {
  try {
    const { data: booking } = await supabase
      .from('bookings')
      .select('*, customer:users!customer_id(*), service:services(*), provider:providers(*, users(*))')
      .eq('id', bookingId)
      .single();

    if (!booking || !booking.provider) throw new Error("Missing provider data");

    const provUser = getSafeUserFromRelation(booking.provider.users);
    const custUser = getSafeUserFromRelation(booking.customer);

    if (!provUser || !custUser) throw new Error("User details missing");
    
    await sendProviderAssignmentEmail({
        to_name: provUser.name,
        to_email: provUser.email,
        customer_name: custUser.name,
        customer_phone: custUser.phone,
        service_name: booking.service?.name || 'Service',
        booking_date: booking.date,
        booking_time: booking.time,
        booking_location: `${booking.address}, ${booking.area}`,
        amount: booking.amount.toString()
     });

    // Also try Push
    if (booking.provider.one_signal_id) {
        await sendPushNotification(
            [booking.provider.one_signal_id],
            "Reminder: New Job Assigned",
            `Check your dashboard for details.`
        );
    }
  } catch (e: any) {
    console.error("Manual Email Error:", e);
    throw e;
  }
};

export const verifyAndCompleteJob = async (bookingId: string, inputPin: string): Promise<boolean> => {
  try {
    const expectedPin = getStaticBookingPin(bookingId);
    if (expectedPin === inputPin) {
      await updateBookingStatus(bookingId, BookingStatus.COMPLETED);
      return true;
    }
    return false;
  } catch (e) { return false; }
};

export const addBookingRating = async (bookingId: string, rating: number, review: string, providerId: string | undefined) => {
  try {
    // 1. Double check if rating exists (Safety)
    const { data: existing } = await supabase.from('bookings').select('rating').eq('id', bookingId).single();
    if (existing && existing.rating) {
      throw new Error("You have already rated this service.");
    }

    // 2. Update Booking
    const { error } = await supabase.from('bookings').update({ rating, review }).eq('id', bookingId);
    if (error && !error.message.includes('column')) throw error;
    
    // 3. Update Provider Stats
    if (providerId) {
       const { data: providerBookings } = await supabase.from('bookings').select('rating').eq('provider_id', providerId).not('rating', 'is', null);
       if (providerBookings && providerBookings.length > 0) {
          const total = providerBookings.reduce((sum: number, b: any) => sum + Number(b.rating), 0);
          const avgRating = Number((total / providerBookings.length).toFixed(1));
          await supabase.from('providers').update({ rating: avgRating }).eq('id', providerId);
       }
    }
  } catch (err: any) { throw new Error(err.message); }
};

export const deleteBooking = async (id: string) => {
  const { error } = await supabase.from('bookings').delete().eq('id', id);
  if (error) throw error;
};

export const getNotifications = async (userId: string): Promise<Notification[]> => {
  const { data, error } = await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) return [];
  return data.map(mapNotification);
};

export const createNotification = async (userId: string, message: string, type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR') => {
  try {
    await supabase.from('notifications').insert({ user_id: userId, message, type, is_read: false });
  } catch (e) { }
};

export const markNotificationRead = async (id: string) => {
  try {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  } catch (e) { }
};
