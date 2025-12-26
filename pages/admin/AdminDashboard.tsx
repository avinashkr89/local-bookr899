import React, { useEffect, useState } from 'react';
import { getBookings } from '../../services/db';
import { Booking, BookingStatus } from '../../types';
import { CheckCircle, Clock, DollarSign, TrendingUp } from 'lucide-react';

export const AdminDashboard = () => {
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    revenue: 0,
    commission: 0,
    pending: 0,
    assigned: 0,
    inProgress: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const bookings = await getBookings();
        const completedBookings = bookings.filter(b => b.status === BookingStatus.COMPLETED);
        const revenue = completedBookings.reduce((acc, curr) => acc + curr.amount, 0);

        setStats({
          total: bookings.length,
          completed: completedBookings.length,
          revenue: revenue,
          commission: revenue * 0.10,
          pending: bookings.filter(b => b.status === BookingStatus.PENDING).length,
          assigned: bookings.filter(b => b.status === BookingStatus.ASSIGNED).length,
          inProgress: bookings.filter(b => b.status === BookingStatus.IN_PROGRESS).length,
        });
      } catch(e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className={`flex-shrink-0 rounded-md p-3 ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="text-2xl font-semibold text-gray-900">{loading ? '...' : value}</dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Revenue" 
          value={`₹${stats.revenue.toFixed(2)}`} 
          icon={DollarSign} 
          color="bg-emerald-500" 
        />
        <StatCard 
          title="Total Commission (10%)" 
          value={`₹${stats.commission.toFixed(2)}`} 
          icon={TrendingUp} 
          color="bg-indigo-500" 
        />
        <StatCard 
          title="Total Bookings" 
          value={stats.total} 
          icon={Clock} 
          color="bg-blue-500" 
        />
        <StatCard 
          title="Completed Jobs" 
          value={stats.completed} 
          icon={CheckCircle} 
          color="bg-green-500" 
        />
      </div>

      <h2 className="text-lg font-medium text-gray-900 mt-8">Live Status</h2>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
         <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <span className="block text-3xl font-bold text-yellow-600">{loading ? '-' : stats.pending}</span>
            <span className="text-sm text-yellow-800">Pending Requests</span>
         </div>
         <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <span className="block text-3xl font-bold text-blue-600">{loading ? '-' : stats.assigned}</span>
            <span className="text-sm text-blue-800">Assigned to Provider</span>
         </div>
         <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 text-center">
            <span className="block text-3xl font-bold text-purple-600">{loading ? '-' : stats.inProgress}</span>
            <span className="text-sm text-purple-800">In Progress</span>
         </div>
      </div>
    </div>
  );
};