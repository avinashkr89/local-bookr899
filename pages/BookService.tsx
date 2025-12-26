
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getServices, createBooking, getProviders } from '../services/db';
import { useAuth } from '../services/authContext';
import { Service, Provider } from '../types';
import toast from 'react-hot-toast';
import { Calendar, Clock, MapPin, FileText, CheckCircle, ChevronRight, ChevronLeft, Shield, CreditCard, Lock } from 'lucide-react';

export const BookService = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const [service, setService] = useState<Service | undefined>();
  const [selectedProvider, setSelectedProvider] = useState<Provider | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [step, setStep] = useState(1); // 1: Schedule, 2: Location, 3: Review

  const searchParams = new URLSearchParams(location.search);
  const providerIdParam = searchParams.get('providerId');
  const areaParam = searchParams.get('area');
  
  const [formData, setFormData] = useState({
    address: '',
    area: areaParam || '',
    date: '',
    time: '',
    description: '',
  });

  useEffect(() => {
    if (!user) {
      toast.error('Please login to book a service');
      navigate('/login');
      return;
    }

    const loadData = async () => {
      try {
        const services = await getServices();
        const s = services.find(item => item.id === serviceId);
        if (s) setService(s);
        else { toast.error('Service not found'); navigate('/'); return; }

        if (providerIdParam) {
          const providers = await getProviders();
          const p = providers.find(prov => prov.id === providerIdParam);
          if (p) {
            setSelectedProvider(p);
            if (areaParam) setFormData(prev => ({...prev, area: areaParam}));
          }
        }
      } catch (e) {
        toast.error("Error loading details");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [serviceId, user, navigate]);

  const handleSubmit = async () => {
    if (!service || !user) return;

    const toastId = toast.loading('Creating your booking...');
    try {
      await createBooking({
        customerId: user.id,
        serviceId: service.id,
        providerId: selectedProvider ? selectedProvider.id : null,
        description: formData.description,
        address: formData.address,
        area: formData.area,
        date: formData.date,
        time: formData.time,
        amount: service.basePrice,
      });
      toast.success('Booking Confirmed! Redirecting...', { id: toastId });
      setTimeout(() => navigate('/dashboard'), 1000);
    } catch (error) {
      toast.error('Failed to create booking', { id: toastId });
    }
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(prev => prev + 1);
  };

  const handleBack = () => setStep(prev => prev - 1);

  if (isLoading || !service) return <div className="min-h-[60vh] flex justify-center items-center"><div className="animate-spin rounded-full h-12 w-12 border-2 border-indigo-600"></div></div>;

  // UI Components for Steps
  const StepIndicator = () => (
    <div className="flex items-center justify-between mb-8 relative">
      <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 -z-10 rounded-full"></div>
      <div className={`absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-indigo-600 transition-all duration-300 -z-10 rounded-full`} style={{width: `${(step-1) * 50}%`}}></div>
      
      {[1, 2, 3].map((s) => (
        <div key={s} className={`flex flex-col items-center ${step >= s ? 'text-indigo-600' : 'text-gray-400'}`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-4 transition-colors duration-300 bg-white ${step >= s ? 'border-indigo-600 text-indigo-600' : 'border-gray-200 text-gray-400'}`}>
            {step > s ? <CheckCircle size={20} /> : s}
          </div>
          <span className="text-xs font-medium mt-2 hidden sm:block">{s === 1 ? 'Time' : s === 2 ? 'Details' : 'Confirm'}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-12">
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 animate-fade-in-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-8 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-32 h-32 bg-white opacity-10 rounded-full"></div>
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-32 h-32 bg-white opacity-10 rounded-full"></div>
          
          <h1 className="text-2xl font-bold relative z-10">{selectedProvider ? `Book ${selectedProvider.user?.name}` : `Book ${service.name}`}</h1>
          <p className="text-indigo-100 mt-2 text-sm relative z-10">{selectedProvider ? 'Verified Expert Provider' : 'Best available professional'}</p>
        </div>

        <div className="p-6 sm:p-10">
          <StepIndicator />

          <form onSubmit={step === 3 ? (e) => { e.preventDefault(); handleSubmit(); } : handleNext}>
            
            {/* STEP 1: Date & Time */}
            {step === 1 && (
              <div className="space-y-6 animate-fade-in">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800">When do you need the service?</h2>
                  <p className="text-gray-500 text-sm">Select a date and time.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all hover:shadow-sm">
                    <label className="flex items-center text-sm font-bold text-gray-700 mb-3">
                      <Calendar size={18} className="mr-2 text-indigo-500" /> Pick Date
                    </label>
                    <input
                      type="date"
                      required
                      className="w-full bg-white border-gray-200 rounded-lg p-3 text-gray-700 focus:ring-0 focus:border-indigo-500 outline-none"
                      value={formData.date}
                      onChange={e => setFormData({...formData, date: e.target.value})}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all hover:shadow-sm">
                    <label className="flex items-center text-sm font-bold text-gray-700 mb-3">
                      <Clock size={18} className="mr-2 text-indigo-500" /> Pick Time
                    </label>
                    <input
                      type="time"
                      required
                      className="w-full bg-white border-gray-200 rounded-lg p-3 text-gray-700 focus:ring-0 focus:border-indigo-500 outline-none"
                      value={formData.time}
                      onChange={e => setFormData({...formData, time: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Location Details */}
            {step === 2 && (
              <div className="space-y-6 animate-fade-in">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800">Where should we come?</h2>
                  <p className="text-gray-500 text-sm">Provide your address details.</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                   <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Area / Locality</label>
                   <div className="flex items-center bg-white rounded-lg border border-gray-200 px-3 py-1 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
                      <MapPin size={18} className="text-gray-400 mr-2" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Cidco N-2"
                        className="w-full py-2 outline-none text-gray-800"
                        value={formData.area}
                        onChange={e => setFormData({...formData, area: e.target.value})}
                      />
                   </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                   <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Full Address</label>
                   <textarea
                      required
                      rows={2}
                      placeholder="House No, Building, Landmark..."
                      className="w-full bg-white rounded-lg border border-gray-200 p-3 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      value={formData.address}
                      onChange={e => setFormData({...formData, address: e.target.value})}
                   />
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                   <label className="text-xs font-bold uppercase text-gray-500 mb-1 block">Problem Description</label>
                   <div className="flex items-start bg-white rounded-lg border border-gray-200 px-3 py-2 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
                      <FileText size={18} className="text-gray-400 mr-2 mt-1" />
                      <textarea
                        required
                        rows={2}
                        placeholder="Describe the issue (e.g., Leaking tap in kitchen)"
                        className="w-full outline-none text-gray-800"
                        value={formData.description}
                        onChange={e => setFormData({...formData, description: e.target.value})}
                      />
                   </div>
                </div>
              </div>
            )}

            {/* STEP 3: Summary */}
            {step === 3 && (
              <div className="space-y-6 animate-fade-in">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800">Review & Confirm</h2>
                  <p className="text-gray-500 text-sm">Review your booking details.</p>
                </div>

                <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100 relative overflow-hidden">
                   <div className="relative z-10">
                      <div className="flex justify-between items-center mb-2">
                         <span className="text-indigo-800 font-medium">Service Cost</span>
                         <span className="text-2xl font-bold text-indigo-900">₹{service.basePrice}</span>
                      </div>
                      
                      {/* Token Breakdown Visual */}
                      <div className="bg-white/60 rounded-lg p-3 mb-4 text-xs">
                         <div className="flex justify-between text-indigo-700 mb-1">
                            <span>Booking Token (Refundable)</span>
                            <span className="font-bold">₹0 (Free)</span>
                         </div>
                         <div className="flex justify-between text-indigo-700">
                            <span>Pay after service</span>
                            <span className="font-bold">₹{service.basePrice}</span>
                         </div>
                      </div>

                      <div className="space-y-3 text-sm text-indigo-900">
                         <div className="flex items-center"><Calendar size={16} className="mr-2 opacity-70"/> {formData.date}</div>
                         <div className="flex items-center"><Clock size={16} className="mr-2 opacity-70"/> {formData.time}</div>
                         <div className="flex items-center"><MapPin size={16} className="mr-2 opacity-70"/> {formData.area}</div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-indigo-200 flex items-center text-xs text-indigo-700">
                         <Lock size={14} className="mr-1" /> Secure Booking • Pay Directly to Provider
                      </div>
                   </div>
                </div>

                {selectedProvider && (
                   <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center shadow-sm">
                      <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold mr-3">
                         {selectedProvider.user?.name.charAt(0)}
                      </div>
                      <div>
                         <p className="text-sm font-bold text-gray-900">{selectedProvider.user?.name}</p>
                         <p className="text-xs text-gray-500 flex items-center"><Shield size={12} className="mr-1 text-green-500"/> Verified Provider</p>
                      </div>
                   </div>
                )}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-8 flex justify-between pt-4">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center px-6 py-3 border border-gray-300 shadow-sm text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-colors"
                >
                  <ChevronLeft size={18} className="mr-1" /> Back
                </button>
              ) : <div></div>}

              <button
                type="submit"
                className="flex items-center px-8 py-3 border border-transparent text-sm font-bold rounded-xl text-white bg-indigo-600 shadow-lg hover:bg-indigo-700 focus:outline-none hover:scale-105 transition-transform"
              >
                {step === 3 ? 'Confirm Booking' : 'Next Step'} {step !== 3 && <ChevronRight size={18} className="ml-1" />}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
