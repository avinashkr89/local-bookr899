
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../services/authContext';
import { getBookings, getProviders, updateBookingStatus, verifyAndCompleteJob, updateProvider, getWhatsAppLink, addProviderPhoto, deleteProviderPhoto } from '../../services/db';
import { getOneSignalPlayerId, requestNotificationPermission } from '../../services/push';
import { Booking, BookingStatus, Provider } from '../../types';
import toast from 'react-hot-toast';
import { Phone, MapPin, Calendar, PlayCircle, CheckCircle, Lock, X, Bell, MessageCircle, Image as ImageIcon, Trash2, PlusCircle } from 'lucide-react';

export const ProviderDashboard = () => {
  const { user } = useAuth();
  const [myJobs, setMyJobs] = useState<Booking[]>([]);
  const [providerProfile, setProviderProfile] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);
  
  // OTP Verification Modal
  const [otpModalJob, setOtpModalJob] = useState<string | null>(null);
  const [completionPin, setCompletionPin] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Photo Upload State
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  useEffect(() => {
    const initData = async () => {
      await loadJobs();
      
      // Initialize OneSignal for this provider
      try {
        const playerId = await getOneSignalPlayerId();
        if (playerId) {
           // Save to DB associated with this provider
           const providers = await getProviders();
           const me = providers.find(p => p.userId === user?.id);
           if (me && me.oneSignalId !== playerId) {
              await updateProvider(me.id, { oneSignalId: playerId });
              console.log("OneSignal ID Saved:", playerId);
           }
        } else {
           // If no ID yet, prompt might be needed
           console.log("OneSignal: No Player ID yet. Permission might be required.");
        }
      } catch (e) {
        console.error("Push Init Error", e);
      }
    };

    // Poll for auto-assignments every 30 seconds
    const interval = setInterval(() => {
      loadJobs();
    }, 30000);
    
    if (user) initData();
    return () => clearInterval(interval);
  }, [user]);

  const loadJobs = async () => {
    if (user) {
      try {
        const providers = await getProviders();
        const me = providers.find(p => p.userId === user.id); 
        const meByPhone = providers.find(p => p.user?.phone === user.phone); 
        const providerData = me || meByPhone;
        
        if (providerData) {
          setProviderProfile(providerData);
          const allBookings = await getBookings();
          const jobs = allBookings.filter(b => b.providerId === providerData.id && b.status !== BookingStatus.CANCELLED);
          setMyJobs(jobs.reverse());
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleStatusUpdate = async (id: string, status: BookingStatus) => {
    if (status === BookingStatus.COMPLETED) {
      setOtpModalJob(id);
      setCompletionPin('');
    } else {
      try {
        await updateBookingStatus(id, status);
        toast.success('Job status updated');
        loadJobs();
      } catch (e) {
        toast.error('Update failed');
      }
    }
  };

  const handleVerifyAndComplete = async () => {
    if (!otpModalJob) return;
    if (completionPin.length !== 6) {
      toast.error('Please enter a 6-digit PIN');
      return;
    }

    setIsVerifying(true);
    try {
      const isValid = await verifyAndCompleteJob(otpModalJob, completionPin);
      
      if (isValid) {
        toast.success('PIN Verified! Job Completed.');
        setOtpModalJob(null);
        loadJobs();
      } else {
        toast.error('Incorrect PIN. Please check with customer.');
      }
    } catch (e) {
      toast.error('Verification system error.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleAddPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!providerProfile || !newPhotoUrl) return;
    
    setIsUploadingPhoto(true);
    try {
       await addProviderPhoto(providerProfile.id, newPhotoUrl);
       toast.success('Photo added to portfolio');
       setNewPhotoUrl('');
       loadJobs(); // Reload to fetch new photos
    } catch (e) {
       toast.error('Failed to add photo');
    } finally {
       setIsUploadingPhoto(false);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
     if(confirm('Delete this photo?')) {
        try {
           await deleteProviderPhoto(photoId);
           toast.success('Photo deleted');
           loadJobs();
        } catch(e) {
           toast.error('Delete failed');
        }
     }
  };

  if (loading) return <div className="p-4">Loading portal...</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Provider Portal</h1>
        <button 
          onClick={requestNotificationPermission}
          className="flex items-center text-sm bg-indigo-50 text-indigo-600 px-3 py-1 rounded hover:bg-indigo-100 transition-colors"
        >
          <Bell size={16} className="mr-2" /> Enable Notifications
        </button>
      </div>

      {/* Portfolio Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center"><ImageIcon className="mr-2 text-indigo-500" /> My Portfolio</h2>
        <div className="flex gap-4 overflow-x-auto pb-4 mb-4">
           {providerProfile?.photos && providerProfile.photos.length > 0 ? (
              providerProfile.photos.map(p => (
                 <div key={p.id} className="relative group flex-shrink-0">
                    <img src={p.url} alt="Portfolio" className="h-24 w-24 object-cover rounded-lg border border-gray-200" />
                    <button onClick={() => handleDeletePhoto(p.id)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12} /></button>
                 </div>
              ))
           ) : (
              <p className="text-sm text-gray-400 italic">No photos uploaded. Add photos to attract more customers.</p>
           )}
        </div>
        <form onSubmit={handleAddPhoto} className="flex gap-2">
           <input 
             type="url" 
             placeholder="Paste Image URL (e.g. https://imgur.com/...)" 
             className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
             value={newPhotoUrl}
             onChange={e => setNewPhotoUrl(e.target.value)}
             required
           />
           <button type="submit" disabled={isUploadingPhoto} className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-bold hover:bg-indigo-700 disabled:opacity-50">
             {isUploadingPhoto ? '...' : <PlusCircle size={18} />}
           </button>
        </form>
      </div>

      {myJobs.length === 0 ? (
         <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
           No jobs assigned yet. Auto-assignment system is active...
         </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {myJobs.map(job => (
            <div key={job.id} className="bg-white shadow rounded-lg p-6 border-l-4 border-indigo-500">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{job.service?.name}</h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2
                    ${job.status === 'IN_PROGRESS' ? 'bg-purple-100 text-purple-800' : 
                      job.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                    {job.status}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">₹{job.amount}</div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 text-gray-400 mt-1 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{job.customer?.name}</p>
                    <p className="text-sm text-gray-500">{job.address}</p>
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mt-1">{job.area}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                   <div className="flex items-center text-sm text-gray-500">
                     <Phone className="h-4 w-4 mr-2" />
                     <a href={`tel:${job.customer?.phone}`} className="hover:underline">{job.customer?.phone}</a>
                   </div>
                   <div className="flex items-center text-sm text-gray-500">
                     <Calendar className="h-4 w-4 mr-2" />
                     {job.date} at {job.time}
                   </div>
                </div>
              </div>
              
              {/* WhatsApp Button for Provider */}
              {job.customer?.phone && (
                 <div className="mt-3">
                    <a 
                      href={getWhatsAppLink(job.customer.phone, `Hi ${job.customer.name}, I'm your provider from LocalBookr. Reaching out about the job.`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm text-green-700 bg-green-50 px-3 py-2 rounded-md hover:bg-green-100 border border-green-200 transition-colors"
                    >
                      <MessageCircle size={16} className="mr-2" /> Contact Customer (WhatsApp)
                    </a>
                 </div>
              )}

              <div className="mt-4 bg-gray-50 p-3 rounded text-sm text-gray-700">
                <span className="font-semibold">Problem:</span> {job.description}
              </div>

              <div className="mt-6 flex space-x-3 border-t pt-4">
                {job.status === BookingStatus.ASSIGNED && (
                  <button 
                    onClick={() => handleStatusUpdate(job.id, BookingStatus.IN_PROGRESS)}
                    className="flex-1 flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                  >
                    <PlayCircle className="mr-2 h-4 w-4" /> Start Job
                  </button>
                )}
                {job.status === BookingStatus.IN_PROGRESS && (
                  <button 
                    onClick={() => handleStatusUpdate(job.id, BookingStatus.COMPLETED)}
                    className="flex-1 flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-colors"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" /> Complete Job
                  </button>
                )}
                {job.status === BookingStatus.COMPLETED && (
                  <p className="w-full text-center text-green-600 font-medium text-sm py-2 bg-green-50 rounded">Job Completed</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* OTP Verification Modal */}
      {otpModalJob && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full animate-slide-up relative">
            <button 
              onClick={() => setOtpModalJob(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
            <div className="text-center mb-6">
              <div className="mx-auto h-14 w-14 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                <Lock size={28} className="text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Job Verification</h3>
              <p className="text-sm text-gray-500 mt-2">
                Ask the customer for the 6-digit PIN visible in their app to confirm completion.
              </p>
            </div>
            <input 
              type="text" 
              maxLength={6}
              autoFocus
              className="w-full text-center text-3xl tracking-[0.5em] font-bold border-2 border-gray-200 rounded-xl py-3 mb-6 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all placeholder-gray-200"
              placeholder="••••••"
              value={completionPin}
              onChange={(e) => {
                if (/^\d*$/.test(e.target.value)) setCompletionPin(e.target.value);
              }}
            />
            <button 
              onClick={handleVerifyAndComplete}
              disabled={isVerifying || completionPin.length !== 6}
              className="w-full py-3.5 text-white bg-indigo-600 rounded-xl font-bold hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 flex items-center justify-center"
            >
              {isVerifying ? (
                 <span className="flex items-center"><div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div> Verifying...</span>
              ) : 'Verify & Complete'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
