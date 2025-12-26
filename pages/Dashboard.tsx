
import React, { useEffect, useState } from 'react';
import { useAuth } from '../services/authContext';
import { getBookings, addBookingRating, getStaticBookingPin, getWhatsAppLink } from '../services/db';
import { Booking, BookingStatus } from '../types';
import { Calendar, MapPin, Clock, AlertCircle, Star, X, ShieldCheck, Eye, EyeOff, Copy, MessageCircle, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

export const Dashboard = () => {
  const { user } = useAuth();
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [selectedBookingForRating, setSelectedBookingForRating] = useState<Booking | null>(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [reviewText, setReviewText] = useState('');

  const [revealedPins, setRevealedPins] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadBookings();
    const interval = setInterval(loadBookings, 15000); 
    return () => clearInterval(interval);
  }, [user]);

  const loadBookings = async () => {
    if (user) {
      try {
        const allBookings = await getBookings();
        const filtered = allBookings.filter(b => b.customerId === user.id);
        setMyBookings(filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      } catch (e) {
        toast.error('Could not load bookings');
      } finally {
        setLoading(false);
      }
    }
  };

  const togglePin = (id: string) => {
    setRevealedPins(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyPin = (pin: string) => {
    navigator.clipboard.writeText(pin);
    toast.success('PIN Copied!');
  };

  const openRatingModal = (booking: Booking) => {
    setSelectedBookingForRating(booking);
    setRatingValue(5);
    setReviewText('');
    setIsRatingModalOpen(true);
  };

  const submitRating = async () => {
    if (!selectedBookingForRating) return;
    const toastId = toast.loading('Submitting feedback...');
    try {
      await addBookingRating(
        selectedBookingForRating.id,
        ratingValue,
        reviewText,
        selectedBookingForRating.providerId || undefined
      );
      toast.success('Feedback submitted!', { id: toastId });
      setIsRatingModalOpen(false);
      loadBookings(); 
    } catch (e: any) {
      toast.error('Failed to submit feedback', { id: toastId });
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'CONFIRMED': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ASSIGNED': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case 'IN_PROGRESS': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'COMPLETED': return 'bg-green-100 text-green-800 border-green-200';
      case 'CANCELLED': return 'bg-red-50 text-red-700 border-red-100';
      case 'WAITING': return 'bg-orange-50 text-orange-700 border-orange-100';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) return <div className="p-10 text-center"><div className="animate-spin rounded-full h-8 w-8 border-2 border-primary mx-auto"></div></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-end justify-between">
        <div>
           <h1 className="text-3xl font-bold text-gray-900 tracking-tight">My Bookings</h1>
           <p className="text-gray-500 mt-1">Track your active services and history</p>
        </div>
      </div>

      {myBookings.length === 0 ? (
        <div className="bg-white p-16 rounded-3xl shadow-sm text-center border border-dashed border-gray-300">
          <div className="inline-flex bg-gray-50 p-4 rounded-full mb-4">
             <Clock className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="mt-2 text-lg font-bold text-gray-900">No bookings yet</h3>
          <p className="mt-1 text-gray-500 max-w-xs mx-auto">Looks like you haven't booked any services. Explore our categories to get started.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {myBookings.map((booking) => {
               const pin = getStaticBookingPin(booking.id);
               const isRevealed = revealedPins[booking.id];
               const isCompleted = booking.status === BookingStatus.COMPLETED;

               return (
                <div key={booking.id} className="bg-white rounded-3xl p-6 shadow-card border border-gray-100 transition-all hover:shadow-lg">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-gray-50 pb-4">
                       <div className="flex items-center">
                          <div className="h-12 w-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-600 mr-4 font-bold text-lg">
                             {booking.service?.name.charAt(0)}
                          </div>
                          <div>
                             <h3 className="text-lg font-bold text-gray-900">{booking.service?.name || 'Service'}</h3>
                             <div className="flex items-center text-xs text-gray-500 mt-0.5">
                                <Calendar size={12} className="mr-1" /> {booking.date} at {booking.time}
                             </div>
                          </div>
                       </div>
                       
                       <div className="flex items-center gap-3">
                          <span className="font-bold text-gray-900 bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">₹{booking.amount}</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusStyle(booking.status)}`}>
                            {booking.status}
                          </span>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       {/* Left: Details */}
                       <div className="space-y-3">
                          <div className="flex items-start">
                             <MapPin size={16} className="text-gray-400 mt-0.5 mr-2" />
                             <div>
                                <p className="text-sm font-medium text-gray-900">Service Location</p>
                                <p className="text-xs text-gray-500">{booking.address}, {booking.area}</p>
                             </div>
                          </div>
                          {booking.provider ? (
                             <div className="flex items-start">
                                <div className="mt-0.5 mr-2 h-4 w-4 rounded-full bg-green-100 flex items-center justify-center text-[10px] font-bold text-green-700">
                                   {booking.provider.user?.name.charAt(0)}
                                </div>
                                <div>
                                   <p className="text-sm font-medium text-gray-900">Provider Assigned</p>
                                   <p className="text-xs text-gray-500">{booking.provider.user?.name}</p>
                                   {booking.provider.user?.phone && (
                                      <a href={getWhatsAppLink(booking.provider.user.phone, 'Hi')} target="_blank" className="text-[10px] text-green-600 font-bold flex items-center mt-1 hover:underline">
                                         <MessageCircle size={10} className="mr-1"/> Chat on WhatsApp
                                      </a>
                                   )}
                                </div>
                             </div>
                          ) : (
                             <div className="flex items-center text-xs text-orange-500 bg-orange-50 p-2 rounded-lg w-fit">
                                <AlertCircle size={14} className="mr-1" /> Waiting for provider assignment
                             </div>
                          )}
                       </div>

                       {/* Right: Actions */}
                       <div className="flex flex-col justify-center items-end gap-3">
                          {/* PIN Card */}
                          {(booking.status === BookingStatus.ASSIGNED || booking.status === BookingStatus.IN_PROGRESS) && (
                             <div className="w-full bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-3 border border-indigo-100 flex items-center justify-between">
                                <div className="flex items-center">
                                   <div className="bg-white p-1.5 rounded-lg text-indigo-600 shadow-sm mr-3">
                                      <ShieldCheck size={16} />
                                   </div>
                                   <div>
                                      <p className="text-xs font-bold text-indigo-900">Job PIN</p>
                                      <p className="text-[10px] text-indigo-700">Share when job is done</p>
                                   </div>
                                </div>
                                <div className="flex items-center gap-1">
                                   <span className={`font-mono font-bold text-lg text-indigo-700 tracking-widest ${!isRevealed ? 'blur-sm' : ''}`}>{pin}</span>
                                   <button onClick={() => togglePin(booking.id)} className="p-1.5 hover:bg-indigo-100 rounded-lg text-indigo-500 ml-2"><Eye size={14}/></button>
                                </div>
                             </div>
                          )}

                          {isCompleted && !booking.rating && (
                             <button onClick={() => openRatingModal(booking)} className="w-full py-2 bg-gray-900 text-white rounded-xl text-sm font-bold shadow-lg hover:bg-black transition-colors flex items-center justify-center">
                                <Star size={14} className="mr-2" /> Rate Service
                             </button>
                          )}

                          {booking.rating && (
                             <div className="flex items-center text-sm font-bold text-gray-900 bg-yellow-50 px-3 py-1.5 rounded-xl border border-yellow-100">
                                <Star size={14} className="text-yellow-500 fill-current mr-1.5" /> You rated: {booking.rating}/5
                             </div>
                          )}
                       </div>
                    </div>
                </div>
               );
            })}
        </div>
      )}

      {/* Rating Modal */}
      {isRatingModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 animate-slide-up relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-br from-indigo-500 to-purple-600"></div>
            <button onClick={() => setIsRatingModalOpen(false)} className="absolute top-4 right-4 text-white/80 hover:text-white z-10"><X size={24}/></button>
            
            <div className="relative pt-8 text-center">
               <div className="h-16 w-16 bg-white rounded-2xl mx-auto shadow-lg flex items-center justify-center text-3xl mb-4 font-bold text-indigo-600">
                  {selectedBookingForRating?.service?.name.charAt(0)}
               </div>
               <h3 className="text-xl font-bold text-gray-900">Rate your Experience</h3>
               <p className="text-sm text-gray-500 mt-1">How was the {selectedBookingForRating?.service?.name} service?</p>
               
               <div className="flex justify-center space-x-2 my-6">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRatingValue(star)}
                    className={`transform transition-all hover:scale-110 focus:outline-none ${star <= ratingValue ? 'text-yellow-400 scale-110' : 'text-gray-200'}`}
                  >
                    <Star size={36} fill="currentColor" />
                  </button>
                ))}
              </div>

              <textarea 
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none resize-none transition-all"
                rows={3}
                placeholder="Write a short review (optional)..."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
              ></textarea>

              <button 
                onClick={submitRating}
                className="w-full mt-4 bg-gray-900 text-white font-bold py-3.5 rounded-xl hover:bg-black shadow-lg hover:shadow-xl transition-all"
              >
                Submit Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
