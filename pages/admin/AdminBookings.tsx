
import React, { useEffect, useState } from 'react';
import { getBookings, getProviders, updateBookingStatus, deleteBooking, triggerManualEmailNotification } from '../../services/db';
import { Booking, BookingStatus, Provider } from '../../types';
import toast from 'react-hot-toast';
import { Filter, X, Download, Trash2, Mail } from 'lucide-react';

export const AdminBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [b, p] = await Promise.all([getBookings(), getProviders()]);
      setBookings(b);
      setProviders(p);
    } catch (e) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: BookingStatus) => {
    try {
      await updateBookingStatus(id, status);
      toast.success(`Status updated to ${status}`);
      loadData();
    } catch (e) {
      toast.error('Update failed');
    }
  };

  const handleDeleteBooking = async (id: string) => {
    if (window.confirm('Delete this booking permanently? This is useful for clearing test data.')) {
      try {
        await deleteBooking(id);
        toast.success('Booking deleted');
        loadData();
      } catch (e) {
        toast.error('Failed to delete booking');
      }
    }
  };

  const handleManualEmail = async (booking: Booking) => {
    if (!booking.provider) {
      toast.error('No provider assigned to send email to.');
      return;
    }
    
    const toastId = toast.loading('Sending email to provider...');
    try {
      await triggerManualEmailNotification(booking.id);
      toast.success('Email sent successfully!', { id: toastId });
    } catch (e) {
      console.error(e);
      toast.error('Failed to send email. Check console.', { id: toastId });
    }
  };

  const handleAssignClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setAssignModalOpen(true);
  };

  const handleAssignProvider = async (providerId: string) => {
    if (selectedBooking) {
      try {
        await updateBookingStatus(selectedBooking.id, BookingStatus.ASSIGNED, providerId);
        toast.success('Provider assigned successfully');
        setAssignModalOpen(false);
        loadData();
      } catch (e) {
        toast.error('Assignment failed');
      }
    }
  };

  const handleExportCSV = () => {
    if (filteredBookings.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = ['ID', 'Date', 'Time', 'Customer', 'Phone', 'Service', 'Provider', 'Area', 'Status', 'Amount'];
    const rows = filteredBookings.map(b => [
      b.id,
      b.date,
      b.time,
      b.customer?.name || '',
      b.customer?.phone || '',
      b.service?.name || '',
      b.provider?.user?.name || 'Unassigned',
      b.area,
      b.status,
      b.amount
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `localbookr-export-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Export downloaded');
  };

  // Filter Logic
  const filteredBookings = bookings.filter(b => 
    statusFilter === 'ALL' ? true : b.status === statusFilter
  );

  const eligibleProviders = selectedBooking 
    ? providers.filter(p => p.isActive && p.skill === selectedBooking.service?.name)
    : [];

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Booking Management</h1>
        <div className="flex items-center space-x-2">
          <button 
            onClick={handleExportCSV}
            className="flex items-center px-3 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 mr-4"
          >
            <Download size={16} className="mr-2" /> Export CSV
          </button>

          <Filter size={18} className="text-gray-500" />
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2"
          >
            <option value="ALL">All Statuses</option>
            {Object.values(BookingStatus).map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredBookings.map((booking) => (
              <tr key={booking.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{booking.customer?.name}</div>
                  <div className="text-sm text-gray-500">{booking.customer?.phone}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{booking.service?.name}</div>
                  <div className="text-sm text-gray-500">₹{booking.amount}</div>
                </td>
                <td className="px-6 py-4">
                   <div className="text-sm text-gray-900">{booking.date} @ {booking.time}</div>
                   <div className="text-xs text-gray-500">{booking.area}</div>
                   {booking.status === 'WAITING' && <span className="text-xs text-orange-500 font-bold">Auto-assigning...</span>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${booking.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 
                      booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 
                      booking.status === 'WAITING' ? 'bg-orange-100 text-orange-800' :
                      'bg-blue-100 text-blue-800'}`}>
                    {booking.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {booking.provider ? (
                    <span className="font-medium text-indigo-600">{booking.provider.user?.name}</span>
                  ) : (
                    <span className="text-red-400 italic">Unassigned</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex items-center space-x-2">
                  {booking.status === BookingStatus.PENDING && (
                    <button onClick={() => handleAssignClick(booking)} className="text-indigo-600 hover:text-indigo-900 border border-indigo-200 px-2 py-1 rounded bg-indigo-50">Assign</button>
                  )}
                  {booking.status === BookingStatus.WAITING && (
                     <button onClick={() => handleAssignClick(booking)} className="text-indigo-600 hover:text-indigo-900 border border-indigo-200 px-2 py-1 rounded bg-indigo-50">Force Assign</button>
                  )}
                  
                  {booking.provider && (
                    <button 
                      onClick={() => handleManualEmail(booking)}
                      className="text-blue-500 hover:text-blue-700 p-1.5 rounded hover:bg-blue-50"
                      title="Send Notification Email to Provider"
                    >
                      <Mail size={16} />
                    </button>
                  )}
                  
                  <button 
                    onClick={() => handleDeleteBooking(booking.id)} 
                    className="text-red-500 hover:text-red-700 p-1.5 rounded hover:bg-red-50"
                    title="Delete Booking (Clear Data)"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {assignModalOpen && selectedBooking && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Assign Provider</h3>
              <button onClick={() => setAssignModalOpen(false)}><X size={20} /></button>
            </div>
            <div className="p-6">
              <p className="mb-4 text-sm text-gray-500">Select an available professional.</p>
              
              {eligibleProviders.length === 0 ? (
                <div className="text-center py-4 text-red-500 bg-red-50 rounded">No active providers found with matching skill.</div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {eligibleProviders.map(p => (
                    <button
                      key={p.id}
                      onClick={() => handleAssignProvider(p.id)}
                      className="w-full flex justify-between items-center p-3 border rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition"
                    >
                      <div>
                        <div className="font-medium text-gray-900">{p.user?.name}</div>
                        <div className="text-xs text-gray-500">{p.area}</div>
                      </div>
                      <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                         {p.rating} ★
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
