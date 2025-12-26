import React, { useEffect, useState } from 'react';
import { getProviders, createProvider, createUser, updateProvider, getServices, deleteProvider, getPendingProviders } from '../../services/db';
import { Provider, Role, Service } from '../../types';
import toast from 'react-hot-toast';
import { Plus, X, Trash2, CheckCircle, XCircle, Edit2 } from 'lucide-react';

export const AdminProviders = () => {
  const [activeProviders, setActiveProviders] = useState<Provider[]>([]);
  const [pendingProviders, setPendingProviders] = useState<Provider[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  
  const [activeTab, setActiveTab] = useState<'active' | 'pending'>('active');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editProvider, setEditProvider] = useState<Provider | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    skill: '',
    area: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [allProvs, pending, s] = await Promise.all([getProviders(), getPendingProviders(), getServices()]);
      
      // Filter out pending from allProvs if they overlap (depending on getProviders impl)
      // getProviders typically returns Active or all non-deleted. 
      // Let's rely on status.
      setActiveProviders(allProvs.filter(p => p.approvalStatus === 'ACTIVE'));
      setPendingProviders(pending);
      
      setServices(s);
    } catch (e) {
      console.error(e);
      toast.error('Error loading data');
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await updateProvider(id, { isActive: !currentStatus });
      loadData();
      toast.success(`Provider ${!currentStatus ? 'activated' : 'deactivated'}`);
    } catch (e) {
      toast.error('Update failed');
    }
  };

  const handleApproval = async (id: string, status: 'ACTIVE' | 'REJECTED') => {
    try {
      await updateProvider(id, { approvalStatus: status, isActive: status === 'ACTIVE' });
      toast.success(`Provider ${status === 'ACTIVE' ? 'Approved' : 'Rejected'}`);
      loadData();
    } catch (e) {
      toast.error('Approval update failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this provider permanently? This action cannot be undone.')) {
      try {
        await deleteProvider(id);
        toast.success('Provider deleted');
        loadData();
      } catch (e: any) {
        // Show the specific error message from db.ts
        toast.error(e.message || 'Failed to delete');
      }
    }
  };

  const openAddModal = () => {
    setEditProvider(null);
    setFormData({ name: '', email: '', phone: '', skill: '', area: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (provider: Provider) => {
    setEditProvider(provider);
    setFormData({
      name: provider.user?.name || '',
      email: provider.user?.email || '',
      phone: provider.user?.phone || '',
      skill: provider.skill,
      area: provider.area
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const toastId = toast.loading('Saving...');
    try {
      if (editProvider) {
        // Edit Mode (Only updating provider details, not User details for now)
        await updateProvider(editProvider.id, {
          skill: formData.skill,
          area: formData.area
        });
        toast.success('Provider updated', { id: toastId });
      } else {
        // Create Mode
        const newUser = await createUser({
          name: formData.name,
          email: formData.email || `${formData.phone}@provider.local`,
          phone: formData.phone,
          passwordHash: 'PROVIDER_AUTH', 
          role: Role.PROVIDER,
        });
        await createProvider(newUser.id, formData.skill, formData.area);
        toast.success('Provider created successfully', { id: toastId });
      }
      
      setIsModalOpen(false);
      loadData();
    } catch (error: any) {
      toast.error('Operation failed.', { id: toastId });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Providers</h1>
        <button
          onClick={openAddModal}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="-ml-1 mr-2 h-5 w-5" />
          Add Provider
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('active')}
            className={`${activeTab === 'active' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm`}
          >
            Active / Approved ({activeProviders.length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`${activeTab === 'pending' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm relative`}
          >
            Pending Requests ({pendingProviders.length})
            {pendingProviders.length > 0 && <span className="absolute top-0 right-0 -mt-1 -mr-2 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">{pendingProviders.length}</span>}
          </button>
        </nav>
      </div>

      <div className="bg-white shadow overflow-hidden rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name / Contact</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Skill</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Area</th>
              {activeTab === 'active' && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {(activeTab === 'active' ? activeProviders : pendingProviders).map((provider) => (
              <tr key={provider.id}>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{provider.user?.name}</div>
                  <div className="text-xs text-gray-500">{provider.user?.phone}</div>
                  {provider.experienceYears ? <div className="text-xs text-gray-400 mt-1">{provider.experienceYears} Years Exp.</div> : null}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{provider.skill}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{provider.area}</td>
                
                {activeTab === 'active' && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button 
                      onClick={() => handleToggleActive(provider.id, provider.isActive)}
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full cursor-pointer hover:opacity-80 ${provider.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                    >
                      {provider.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                )}

                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex space-x-3 items-center">
                  {activeTab === 'pending' ? (
                    <>
                      <button onClick={() => handleApproval(provider.id, 'ACTIVE')} className="text-green-600 hover:text-green-900 bg-green-50 p-1 rounded" title="Approve">
                        <CheckCircle size={18} />
                      </button>
                      <button onClick={() => handleApproval(provider.id, 'REJECTED')} className="text-red-600 hover:text-red-900 bg-red-50 p-1 rounded" title="Reject">
                        <XCircle size={18} />
                      </button>
                    </>
                  ) : (
                    <button onClick={() => openEditModal(provider)} className="text-blue-600 hover:text-blue-900 bg-blue-50 p-1 rounded">
                      <Edit2 size={16} />
                    </button>
                  )}
                  
                  <button onClick={() => handleDelete(provider.id)} className="text-gray-400 hover:text-red-600 p-1">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {(activeTab === 'active' ? activeProviders : pendingProviders).length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                  No providers found in this list.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">{editProvider ? 'Edit Provider' : 'Add New Provider'}</h3>
              <button onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {!editProvider && (
                <>
                  <input type="text" placeholder="Full Name" required className="w-full border p-2 rounded" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  <input type="tel" placeholder="Phone Number" required className="w-full border p-2 rounded" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </>
              )}
              
              <select required className="w-full border p-2 rounded" value={formData.skill} onChange={e => setFormData({...formData, skill: e.target.value})}>
                <option value="">Select Skill</option>
                {services.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
              <input type="text" placeholder="Service Area" required className="w-full border p-2 rounded" value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} />
              
              <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700">
                {editProvider ? 'Update Provider' : 'Create Provider'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
