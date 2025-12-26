
export enum Role {
  CUSTOMER = 'CUSTOMER',
  ADMIN = 'ADMIN',
  PROVIDER = 'PROVIDER',
}

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  WAITING = 'WAITING', // Added for auto-assign timeout
}

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string; // Kept for legacy compatibility, though using OTP now
  phone: string;
  role: Role;
  createdAt: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  maxPrice?: number; // Added max price
  icon: string;
  createdAt: string;
}

export interface ProviderPhoto {
  id: string;
  providerId: string;
  url: string;
  caption?: string;
  createdAt: string;
}

export interface Provider {
  id: string;
  userId: string;
  user?: User;
  skill: string;
  area: string;
  rating: number;
  isActive: boolean;
  approvalStatus: string;
  experienceYears?: number;
  bio?: string;
  isDeleted?: boolean;
  oneSignalId?: string; // For Web Push Notifications
  photos?: ProviderPhoto[]; // Added Portfolio Photos
}

export interface Booking {
  id: string;
  customerId: string;
  customer?: User;
  serviceId: string;
  service?: Service;
  providerId: string | null;
  provider?: Provider;
  description: string;
  address: string;
  area: string;
  date: string;
  time: string;
  amount: number;
  status: BookingStatus;
  rating?: number;
  review?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  isRead: boolean;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  createdAt: string;
}
