import React, { useState } from 'react';
import { useAuth } from '../services/authContext';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Role } from '../types';
import { Lock, Mail, ArrowRight } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) {
      if (user.role === Role.ADMIN) navigate('/admin');
      else if (user.role === Role.PROVIDER) navigate('/provider');
      else navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const success = await login(email, password);
    setIsSubmitting(false);

    if (success) {
      toast.success('Login Successful');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden border border-gray-100">
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 mb-4">
              <Lock size={24} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
            <p className="text-gray-500 text-sm mt-2">Login to manage bookings</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Email Address</label>
              <div className="flex rounded-md shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  required
                  className="flex-1 min-w-0 block w-full px-3 py-3 border border-gray-300 rounded-r-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Password</label>
              <div className="flex rounded-md shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                  <Lock size={16} />
                </span>
                <input
                  type="password"
                  required
                  className="flex-1 min-w-0 block w-full px-3 py-3 border border-gray-300 rounded-r-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none transition-transform hover:scale-[1.02] disabled:opacity-70"
            >
              {isSubmitting ? 'Logging in...' : 'Login'} <ArrowRight size={16} className="ml-2" />
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center space-y-4">
             <p className="text-sm text-gray-600">
               Don't have an account? <Link to="/register" className="font-bold text-indigo-600 hover:text-indigo-800">Sign up</Link>
             </p>
             <Link to="/provider-register" className="block text-sm font-medium text-emerald-600 hover:text-emerald-800 border border-emerald-200 rounded-lg py-2 bg-emerald-50">
               Register as a Service Provider
             </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
