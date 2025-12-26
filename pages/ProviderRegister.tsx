import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUser, createProvider, getServices } from '../services/db';
import { Role, Service } from '../types';
import toast from 'react-hot-toast';
import { Briefcase, User, MapPin, Mail, Lock, Phone } from 'lucide-react';

export const ProviderRegister = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [services, setServices] = useState<Service[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    skill: '',
    area: '',
    experience: 0,
    bio: ''
  });

  useEffect(() => {
    getServices().then(setServices);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const toastId = toast.loading('Submitting application...');
    
    try {
      // 1. Create Account
      const newUser = await createUser({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        passwordHash: formData.password,
        role: Role.PROVIDER
      });

      // 2. Create Profile
      await createProvider(newUser.id, formData.skill, formData.area, formData.bio, formData.experience);

      toast.success('Application Submitted! Please wait for Admin Approval.', { id: toastId });
      navigate('/login');
    } catch (e: any) {
      toast.error('Registration failed: ' + e.message, { id: toastId });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mx-auto h-12 w-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
           <Briefcase size={24} />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Become a Partner</h2>
        <p className="mt-2 text-center text-sm text-gray-600">Join LocalBookr and grow your business</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            
            {/* Personal Details */}
            <div>
               <label className="block text-sm font-medium text-gray-700">Full Name</label>
               <div className="mt-1 relative rounded-md shadow-sm">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><User size={16} className="text-gray-400"/></div>
                 <input type="text" required className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md p-2 border" 
                   value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
               </div>
            </div>

            <div>
               <label className="block text-sm font-medium text-gray-700">Email Address</label>
               <div className="mt-1 relative rounded-md shadow-sm">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Mail size={16} className="text-gray-400"/></div>
                 <input type="email" required className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md p-2 border" 
                   value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
               </div>
            </div>

            <div>
               <label className="block text-sm font-medium text-gray-700">Password</label>
               <div className="mt-1 relative rounded-md shadow-sm">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Lock size={16} className="text-gray-400"/></div>
                 <input type="password" required className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md p-2 border" 
                   value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
               </div>
            </div>

            <div>
               <label className="block text-sm font-medium text-gray-700">Phone Number</label>
               <div className="mt-1 relative rounded-md shadow-sm">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Phone size={16} className="text-gray-400"/></div>
                 <input type="tel" required className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md p-2 border" 
                   value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
               </div>
            </div>

            {/* Professional Details */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Select Service Category</label>
              <select required className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border"
                value={formData.skill} onChange={e => setFormData({...formData, skill: e.target.value})}>
                <option value="">Choose a skill...</option>
                {services.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>

            <div>
               <label className="block text-sm font-medium text-gray-700">Service Area / City</label>
               <div className="mt-1 relative rounded-md shadow-sm">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><MapPin size={16} className="text-gray-400"/></div>
                 <input type="text" required placeholder="e.g. Aurangabad, Cidco" className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md p-2 border" 
                   value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} />
               </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Years of Experience</label>
              <input type="number" required className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border" 
                value={formData.experience} onChange={e => setFormData({...formData, experience: Number(e.target.value)})} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Short Bio</label>
              <textarea required rows={3} placeholder="Tell us about your work..." className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border" 
                value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} />
            </div>

            <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Submit Application
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
