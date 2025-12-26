
import React, { useEffect, useState } from 'react';
import { getServices, createService, deleteService, updateService } from '../../services/db';
import { Service } from '../../types';
import toast from 'react-hot-toast';
import { Plus, Trash2, Edit2, X } from 'lucide-react';

export const AdminServices = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({ name: '', description: '', basePrice: '', maxPrice: '', icon: 'Wrench' });

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    const data = await getServices();
    setServices(data);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure? This might affect bookings linked to this service.')) {
      try {
        await deleteService(id);
        loadServices();
        toast.success('Service deleted');
      } catch (e) {
        toast.error('Failed to delete');
      }
    }
  };

  const handleEditClick = (service: Service) => {
    setEditingServiceId(service.id);
    setFormData({
      name: service.name,
      description: service.description,
      basePrice: service.basePrice.toString(),
      maxPrice: service.maxPrice ? service.maxPrice.toString() : '',
      icon: service.icon
    });
    setIsModalOpen(true);
  };

  const handleAddClick = () => {
    setEditingServiceId(null);
    setFormData({ name: '', description: '', basePrice: '', maxPrice: '', icon: 'Wrench' });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      description: formData.description,
      basePrice: Number(formData.basePrice),
      maxPrice: formData.maxPrice ? Number(formData.maxPrice) : undefined,
      icon: formData.icon
    };

    try {
      if (editingServiceId) {
        await updateService(editingServiceId, payload);
        toast.success('Service updated');
      } else {
        await createService(payload);
        toast.success('Service added');
      }
      
      loadServices();
      setIsModalOpen(false);
    } catch (e) {
      toast.error('Operation failed');
    }
  };

  const formatPrice = (base: number, max?: number) => {
    if (max && max > base) return `₹${base} - ₹${max}`;
    return `₹${base}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Services</h1>
        <button onClick={handleAddClick} className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 shadow-sm">
          <Plus size={18} className="mr-2" /> Add Service
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {services.map(service => (
          <div key={service.id} className="bg-white p-6 rounded-lg shadow border relative group">
            <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => handleEditClick(service)} 
                className="text-blue-500 hover:text-blue-700 p-1 bg-blue-50 rounded"
              >
                <Edit2 size={16} />
              </button>
              <button 
                onClick={() => handleDelete(service.id)} 
                className="text-red-500 hover:text-red-700 p-1 bg-red-50 rounded"
              >
                <Trash2 size={16} />
              </button>
            </div>
            
            <h3 className="font-bold text-lg text-gray-900">{service.name}</h3>
            <p className="text-sm text-gray-500 mt-1 min-h-[40px]">{service.description}</p>
            <p className="mt-4 text-xl font-bold text-indigo-600">{formatPrice(service.basePrice, service.maxPrice)}</p>
          </div>
        ))}
      </div>

      {isModalOpen && (
         <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">{editingServiceId ? 'Edit Service' : 'Add New Service'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
             </div>
             
             <form onSubmit={handleSubmit} className="space-y-4">
               <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Service Name</label>
                 <input className="w-full border p-2 rounded" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
               </div>
               <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description</label>
                 <textarea className="w-full border p-2 rounded resize-none" rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required />
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Base Price (₹)</label>
                    <input className="w-full border p-2 rounded" type="number" value={formData.basePrice} onChange={e => setFormData({...formData, basePrice: e.target.value})} required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Max Price (₹)</label>
                    <input className="w-full border p-2 rounded" type="number" placeholder="Optional" value={formData.maxPrice} onChange={e => setFormData({...formData, maxPrice: e.target.value})} />
                  </div>
               </div>
               
               <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Icon</label>
                 <select className="w-full border p-2 rounded" value={formData.icon} onChange={e => setFormData({...formData, icon: e.target.value})}>
                   <option value="Wrench">Wrench (Repair)</option>
                   <option value="Zap">Zap (Electrical)</option>
                   <option value="SprayCan">SprayCan (Cleaning)</option>
                   <option value="BookOpen">Book (Tuition)</option>
                   <option value="Briefcase">Briefcase (General)</option>
                   <option value="Hammer">Hammer (Carpentry)</option>
                   <option value="Paintbrush">Paintbrush (Painting)</option>
                   <option value="Smartphone">Smartphone (Tech Repair)</option>
                   <option value="Car">Car (Mechanic/Wash)</option>
                   <option value="Scissors">Scissors (Salon/Beauty)</option>
                   <option value="Truck">Truck (Movers)</option>
                 </select>
               </div>

               <button type="submit" className="w-full px-6 py-2 bg-indigo-600 text-white rounded font-bold hover:bg-indigo-700 shadow-lg mt-2">
                 {editingServiceId ? 'Update Service' : 'Save Service'}
               </button>
             </form>
          </div>
         </div>
      )}
    </div>
  );
};
