
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getServices, searchProviders } from '../services/db';
import { Service, Provider } from '../types';
import { Wrench, Zap, SprayCan, BookOpen, Briefcase, Search, MapPin, Star, ArrowRight, ShieldCheck, Clock, UserCheck, X, Mail, Phone, Send, Hammer, Paintbrush, Smartphone, Car, Scissors, Truck, CheckCircle2, Award, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';

const IconMap: Record<string, React.FC<any>> = {
  Wrench, Zap, SprayCan, BookOpen, Briefcase,
  Hammer, Paintbrush, Smartphone, Car, Scissors, Truck
};

// Common Aurangabad Areas for Auto-complete
const POPULAR_AREAS = [
  "Cidco", "Hudco", "Garkheda", "Waluj", "Chikalthana", "Beed Bypass", "Pundlik Nagar", "Osmanpura", "Kranti Chowk"
];

export const Home = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Search State
  const [selectedService, setSelectedService] = useState<string>('');
  const [searchArea, setSearchArea] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Provider[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Contact Form State
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getServices();
        setServices(data);
      } catch (e) {
        toast.error('Failed to load services');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) {
      toast.error('Please select a service type');
      return;
    }
    if (!searchArea) {
      toast.error('Please enter your area or location');
      return;
    }

    setIsSearching(true);
    try {
      // searchProviders now handles fuzzy matching logic internally
      const results = await searchProviders(selectedService, searchArea);
      setSearchResults(results);
      if (results.length === 0) {
        toast('No providers found in this area. Showing nearest active providers.', { icon: '🔍' });
      }
    } catch (e: any) {
      console.error("Search Handler Error:", e);
      toast.error('Search failed: ' + (e.message || 'Unknown error'));
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchResults(null);
    setSelectedService('');
    setSearchArea('');
  };

  // ... (Contact Form Handler omitted for brevity, keeping existing logic) ...
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);

    const formData = new FormData();
    formData.append("access_key", "f4dc1e02-a136-4902-8b55-403c200e07c4"); 
    formData.append("name", contactForm.name);
    formData.append("email", contactForm.email);
    formData.append("message", contactForm.message);
    formData.append("subject", "New Contact from LocalBookr");

    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData
      });
      const data = await res.json();

      if (data.success) {
        toast.success("Message sent successfully!");
        setContactForm({ name: '', email: '', message: '' });
      } else {
        if (data.message && data.message.includes("Can only be used on")) {
          toast.error("API Key Domain Restricted.", { duration: 6000 });
        } else {
          toast.error(data.message || "Something went wrong.");
        }
      }
    } catch (error) {
      toast.error("Failed to send message.");
    } finally {
      setIsSending(false);
    }
  };


  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className="pb-10 bg-gray-50">
      {/* Hero Section */}
      <div className="relative mb-20">
        <section className="relative rounded-b-[3rem] shadow-lg bg-slate-900 text-white overflow-hidden pb-24 pt-20 px-4">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-[#0f172a] to-[#1e1b4b]"></div>
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff33_1px,transparent_1px)] [background-size:20px_20px]"></div>
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>

          <div className="relative z-10 text-center max-w-4xl mx-auto">
            <span className="inline-flex items-center py-1 px-3 rounded-full bg-white/5 border border-white/10 text-sm font-medium mb-6 text-indigo-200 backdrop-blur-sm animate-fade-in">
              <ShieldCheck size={14} className="mr-2 text-emerald-400"/> Trusted by 5000+ Homes
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl mb-6 animate-slide-up leading-tight">
              Expert Home Services,<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">Instant & Secure.</span>
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-slate-300 animate-fade-in font-light">
              Verified professionals for cleaning, repairs, and maintenance.
            </p>
          </div>
        </section>

        {/* Search Bar */}
        <div className="max-w-4xl mx-auto px-4 -mt-16 relative z-20">
          <div className="bg-white rounded-2xl p-4 shadow-xl shadow-slate-900/10 border border-slate-100 animate-slide-up">
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 bg-white rounded-xl px-4 py-3 flex flex-col justify-center group border border-gray-300 focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-100 transition-all cursor-pointer relative shadow-sm">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Select Service</label>
                <select 
                  className="w-full bg-transparent border-none p-0 text-gray-900 font-bold text-base focus:ring-0 cursor-pointer appearance-none z-10 relative outline-none"
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                >
                  <option value="" className="text-gray-400">What do you need?</option>
                  {services.map(s => (
                    <option key={s.id} value={s.name} className="text-gray-900">{s.name}</option>
                  ))}
                </select>
                <div className="absolute right-4 bottom-4 pointer-events-none text-gray-400"><Briefcase size={18} /></div>
              </div>
              
              <div className="flex-1 bg-white rounded-xl px-4 py-3 flex flex-col justify-center group border border-gray-300 focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-100 transition-all relative shadow-sm">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Location / Area</label>
                <div className="flex items-center">
                   <input 
                    type="text" 
                    list="areas"
                    placeholder="e.g. Cidco, Hudco" 
                    className="w-full bg-transparent border-none p-0 text-gray-900 font-bold text-base focus:ring-0 placeholder-gray-400 outline-none"
                    value={searchArea}
                    onChange={(e) => setSearchArea(e.target.value)}
                  />
                  <MapPin size={18} className="text-gray-400 ml-2" />
                  <datalist id="areas">
                    {POPULAR_AREAS.map(area => <option key={area} value={area} />)}
                  </datalist>
                </div>
              </div>

              <button 
                type="submit"
                disabled={isSearching}
                className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl transition-all transform hover:scale-[1.02] shadow-lg shadow-indigo-200 flex items-center justify-center disabled:opacity-70 disabled:scale-100 text-lg"
              >
                {isSearching ? <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div> : 'Search'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Search Results */}
      {searchResults && (
        <div className="animate-fade-in-up scroll-mt-24 px-4 mb-12" id="results">
          <div className="flex justify-between items-center mb-6 max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900">
              {searchResults.length} {selectedService} Pros in <span className="text-indigo-600 capitalize">{searchArea}</span>
            </h2>
            <button onClick={clearSearch} className="text-sm font-medium text-gray-500 hover:text-red-600 flex items-center bg-white px-3 py-1 rounded-full shadow-sm border border-gray-200">
              <X size={16} className="mr-1" /> Clear Search
            </button>
          </div>

          {searchResults.length === 0 ? (
             <div className="max-w-md mx-auto bg-white p-10 rounded-3xl text-center border border-gray-100 shadow-card">
               <div className="inline-flex bg-slate-50 p-4 rounded-full mb-4"><Search size={32} className="text-slate-300" /></div>
               <h3 className="text-lg font-bold text-gray-900">No professionals found</h3>
               <p className="text-gray-500 mt-2 text-sm">We couldn't find a provider in that specific area. Check spelling or try a broader area.</p>
               <button onClick={() => { setSearchResults(null); setSearchArea(''); }} className="mt-6 text-indigo-600 font-bold text-sm hover:underline">View all categories</button>
             </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
              {searchResults.map((provider) => {
                const serviceDetails = services.find(s => s.name === provider.skill);
                const hasPhotos = provider.photos && provider.photos.length > 0;
                
                return (
                  <div key={provider.id} className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col group">
                    <div className="h-24 bg-slate-100 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-slate-800 to-slate-900 opacity-90"></div>
                        <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500 rounded-full blur-xl opacity-20 transform translate-x-10 -translate-y-10"></div>
                       <div className="absolute top-3 right-3">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500 text-white shadow-sm">
                             <ShieldCheck size={12} className="mr-1" /> VERIFIED
                          </span>
                       </div>
                    </div>
                    
                    <div className="px-6 pb-6 flex-grow relative">
                       <div className="-mt-12 mb-3 inline-block relative">
                          <div className="h-20 w-20 rounded-2xl bg-white p-1 shadow-lg rotate-2 group-hover:rotate-0 transition-transform">
                             <div className="h-full w-full rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-2xl uppercase border border-slate-200 overflow-hidden">
                                {provider.user?.name.charAt(0)}
                             </div>
                          </div>
                          <div className="absolute bottom-0 right-0 h-4 w-4 bg-green-500 border-2 border-white rounded-full transform translate-x-1 translate-y-1"></div>
                       </div>

                       <div className="flex justify-between items-start mb-2">
                         <div>
                           <h3 className="text-xl font-bold text-gray-900 leading-tight group-hover:text-indigo-600 transition-colors">{provider.user?.name}</h3>
                           <p className="text-slate-500 font-medium text-sm flex items-center mt-1">
                              {provider.skill} Expert
                           </p>
                         </div>
                         <div className="text-right">
                            <div className="flex items-center bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                               <Star size={14} className="text-amber-500 fill-current" />
                               <span className="ml-1 font-bold text-gray-900 text-sm">{provider.rating > 0 ? provider.rating : 'New'}</span>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1">20+ Jobs Done</p>
                         </div>
                      </div>
                      
                      {hasPhotos && (
                        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-thin">
                          {provider.photos!.slice(0, 3).map((photo, i) => (
                             <img key={i} src={photo.url} alt="Work" className="h-16 w-16 rounded-lg object-cover border border-gray-100 shadow-sm flex-shrink-0" />
                          ))}
                        </div>
                      )}

                      <div className="flex items-center text-slate-500 text-sm mb-4 bg-slate-50 p-2 rounded-lg">
                        <MapPin size={14} className="mr-2 text-indigo-500" />
                        {provider.area}
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-4">
                         <div className="flex items-center text-xs text-gray-600 bg-gray-50 p-2 rounded-lg">
                            <CheckCircle2 size={14} className="mr-1.5 text-emerald-500"/> {provider.experienceYears || 2}+ Yrs Exp
                         </div>
                         <div className="flex items-center text-xs text-gray-600 bg-gray-50 p-2 rounded-lg">
                            <Award size={14} className="mr-1.5 text-orange-500"/> Top Rated
                         </div>
                      </div>
                    </div>

                    <div className="px-6 py-4 border-t border-gray-50 bg-gray-50/50 flex items-center justify-between">
                        <div>
                           <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Visit Charge</p>
                           <p className="text-lg font-bold text-gray-900">₹{serviceDetails?.basePrice}</p>
                        </div>
                        <Link 
                          to={`/book/${serviceDetails?.id}?providerId=${provider.id}&area=${searchArea}`}
                          className="bg-slate-900 text-white px-6 py-2.5 rounded-xl hover:bg-indigo-600 shadow-lg hover:shadow-indigo-200 text-sm font-bold transition-all"
                        >
                          Book Now
                        </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Default Service Grid & Contact Footer */}
      {!searchResults && (
        <>
        <div className="max-w-7xl mx-auto px-4 animate-slide-up" style={{animationDelay: '0.3s'}}>
          <div className="flex items-end justify-between mb-8 border-b border-gray-200 pb-4">
             <div><h2 className="text-2xl font-bold text-gray-900">Explore Services</h2></div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {services.map((service) => {
              const Icon = IconMap[service.icon] || Briefcase;
              return (
                <div key={service.id} className="group bg-white rounded-2xl p-5 shadow-sm hover:shadow-md border border-gray-100 transition-all duration-200 cursor-pointer flex flex-col items-center text-center relative overflow-hidden hover:-translate-y-1">
                  <div className="h-14 w-14 rounded-2xl bg-slate-50 text-slate-600 flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300 shadow-sm relative z-10"><Icon size={26} strokeWidth={1.5} /></div>
                  <h3 className="text-sm font-bold text-gray-900 mb-1 relative z-10">{service.name}</h3>
                  <p className="text-xs text-gray-400 relative z-10">Starts ₹{service.basePrice}</p>
                  <Link to={`/book/${service.id}`} className="absolute inset-0 z-20"></Link>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Contact Form */}
        <section className="max-w-5xl mx-auto px-4 mt-20 animate-slide-up">
        <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden flex flex-col md:flex-row border border-gray-100">
           <div className="md:w-1/2 pr-8">
              <h2 className="text-3xl font-bold mb-4 text-gray-900">Get in Touch</h2>
              <p className="text-gray-500 mb-8">Can't find what you're looking for?</p>
              <div className="space-y-4">
                 <div className="flex items-center text-gray-600"><Phone size={20} className="mr-3 text-indigo-600" /> +91 89206 36919</div>
                 <div className="flex items-center text-gray-600"><Mail size={20} className="mr-3 text-indigo-600" /> avinashkr502080@gmail.com</div>
                 <div className="flex items-center text-gray-600"><MapPin size={20} className="mr-3 text-indigo-600" /> Aurangabad, Bihar</div>
              </div>
           </div>
           <div className="md:w-1/2 mt-8 md:mt-0 bg-gray-50 p-6 rounded-2xl">
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <input type="text" placeholder="Your Name" required className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500" value={contactForm.name} onChange={(e) => setContactForm({...contactForm, name: e.target.value})} />
                <input type="email" placeholder="Your Email" required className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500" value={contactForm.email} onChange={(e) => setContactForm({...contactForm, email: e.target.value})} />
                <textarea placeholder="Message..." required rows={3} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 resize-none" value={contactForm.message} onChange={(e) => setContactForm({...contactForm, message: e.target.value})} />
                <button type="submit" disabled={isSending} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg disabled:opacity-70 flex items-center justify-center">{isSending ? 'Sending...' : 'Send Message'}</button>
              </form>
           </div>
        </div>
      </section>
      </>
      )}
    </div>
  );
};
