
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../services/authContext';
import { getNotifications, markNotificationRead } from '../services/db';
import { Role, Notification } from '../types';
import { LogOut, User as UserIcon, Menu, X, ChevronRight, Bell, Home, Instagram } from 'lucide-react';

export const Layout = ({ children }: React.PropsWithChildren<{}>) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  
  // Notification State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);

  useEffect(() => {
    if (user) {
      const fetchNotifs = async () => {
        const data = await getNotifications(user.id);
        setNotifications(data);
      };
      fetchNotifs();
      const interval = setInterval(fetchNotifs, 10000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleNotifClick = async (id: string) => {
    await markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const NavLink = ({ to, label, icon: Icon }: { to: string, label: string, icon?: any }) => {
    const isActive = location.pathname === to;
    return (
      <Link
        to={to}
        className={`flex items-center px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
          isActive 
            ? 'bg-primary/10 text-primary' 
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`}
      >
        {Icon && <Icon size={16} className="mr-2" />}
        {label}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans selection:bg-primary/20">
      <nav className="sticky top-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-9 h-9 bg-gradient-to-br from-primary to-indigo-700 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/20">
                L
              </div>
              <span className="ml-2 text-xl font-bold tracking-tight text-gray-900">
                LocalBookr
              </span>
            </div>
            
            {/* Desktop Nav */}
            <div className="hidden md:flex ml-10 space-x-1">
                <NavLink to="/" label="Home" />
                {user?.role === Role.CUSTOMER && <NavLink to="/dashboard" label="My Bookings" />}
                {user?.role === Role.ADMIN && (
                  <>
                    <NavLink to="/admin" label="Dashboard" />
                    <NavLink to="/admin/bookings" label="Bookings" />
                    <NavLink to="/admin/providers" label="Providers" />
                    <NavLink to="/admin/services" label="Services" />
                  </>
                )}
                {user?.role === Role.PROVIDER && <NavLink to="/provider" label="Portal" />}
            </div>
            
            {/* Desktop Auth */}
            <div className="hidden md:block ml-auto">
              <div className="flex items-center space-x-4">
                {user ? (
                  <>
                    {/* Notification Bell */}
                    <div className="relative">
                      <button 
                        onClick={() => setShowNotifs(!showNotifs)}
                        className="p-2 text-gray-500 hover:text-primary relative transition-colors rounded-full hover:bg-gray-100"
                      >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
                        )}
                      </button>
                      
                      {showNotifs && (
                        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-card ring-1 ring-black ring-opacity-5 py-1 z-50 max-h-96 overflow-y-auto border border-gray-100">
                           <div className="px-4 py-3 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">Notifications</div>
                           {notifications.length === 0 ? (
                             <div className="px-4 py-8 text-sm text-gray-500 text-center">No new notifications</div>
                           ) : (
                             notifications.map(n => (
                               <div 
                                 key={n.id} 
                                 onClick={() => handleNotifClick(n.id)}
                                 className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 ${!n.isRead ? 'bg-blue-50/60' : ''}`}
                               >
                                  <p className="text-sm text-gray-800 font-medium">{n.message}</p>
                                  <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                               </div>
                             ))
                           )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center pl-4 border-l border-gray-200">
                      <div className="flex flex-col items-end mr-3">
                         <span className="text-gray-900 text-sm font-bold leading-none">{user.name}</span>
                         <span className="text-xs text-gray-500 font-medium uppercase tracking-wider mt-0.5">{user.role}</span>
                      </div>
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-600 font-bold border-2 border-white shadow-sm">
                        {user.name.charAt(0)}
                      </div>
                      <button
                        onClick={handleLogout}
                        className="ml-2 p-2 text-gray-400 hover:text-red-500 transition-colors"
                        title="Logout"
                      >
                        <LogOut size={18} />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center space-x-3">
                     <Link to="/login" className="text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors">Login</Link>
                     <Link to="/register" className="bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-medium shadow-lg shadow-gray-900/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 flex items-center">
                        Sign Up
                     </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="-mr-2 flex md:hidden">
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="inline-flex items-center justify-center p-2 rounded-xl text-gray-500 hover:text-primary hover:bg-gray-100 focus:outline-none">
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 absolute w-full shadow-xl animate-slide-up z-50">
             <div className="px-4 pt-4 pb-6 space-y-2">
                 <NavLink to="/" label="Home" icon={Home} />
                 {user?.role === Role.CUSTOMER && <NavLink to="/dashboard" label="My Bookings" />}
                 {user?.role === Role.ADMIN && <NavLink to="/admin" label="Admin Dashboard" />}
                 {user?.role === Role.PROVIDER && <NavLink to="/provider" label="Provider Portal" />}
                 
                 {!user && (
                   <div className="pt-4 mt-4 border-t border-gray-100 grid grid-cols-2 gap-3">
                      <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block w-full text-center px-4 py-3 border border-gray-200 rounded-xl text-base font-medium text-gray-700 bg-white">Login</Link>
                      <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="block w-full text-center px-4 py-3 rounded-xl text-base font-medium text-white bg-primary">Sign Up</Link>
                   </div>
                 )}
                 
                 {user && (
                   <div className="pt-4 mt-4 border-t border-gray-100">
                      <div className="flex items-center mb-4 px-2">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold mr-3">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-base font-bold text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                      <button onClick={handleLogout} className="w-full flex items-center justify-center px-4 py-3 border border-red-100 text-red-600 bg-red-50 rounded-xl font-medium">
                        <LogOut size={18} className="mr-2" /> Logout
                      </button>
                   </div>
                 )}
             </div>
          </div>
        )}
      </nav>
      
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        {children}
      </main>

      <footer className="bg-white border-t border-gray-100 mt-auto">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
              {/* Brand Info */}
              <div className="text-center md:text-left">
                <span className="font-bold text-gray-900 text-xl tracking-tight">LocalBookr</span>
                <p className="text-gray-500 text-sm mt-2 max-w-xs mx-auto md:mx-0">
                  Aurangabad's most trusted partner for home services. Quality work, guaranteed.
                </p>
              </div>
              
              {/* Social Center */}
              <div className="flex flex-col items-center justify-center">
                 <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Follow Us</p>
                 <div className="flex space-x-4">
                    <a 
                      href="https://instagram.com/iamavi_89" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="h-12 w-12 rounded-2xl bg-gradient-to-br from-pink-50 to-orange-50 text-pink-600 flex items-center justify-center hover:scale-110 transition-all shadow-sm border border-pink-100"
                      title="Follow on Instagram"
                    >
                      <Instagram size={24} />
                    </a>
                 </div>
              </div>

              {/* Credits & Legal */}
              <div className="text-center md:text-right">
                <p className="text-gray-600 font-medium text-sm">
                  Developed with <span className="text-red-500 animate-pulse">❤️</span> by <span className="text-gray-900 font-bold uppercase tracking-tight">Avinash</span>
                </p>
                <a 
                  href="https://instagram.com/iamavi_89" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-indigo-600 hover:text-indigo-800 font-bold text-xs mt-1 inline-flex items-center transition-colors"
                >
                  <Instagram size={12} className="mr-1" /> iamavi_89
                </a>
                <p className="text-[10px] text-gray-400 mt-3 font-medium uppercase tracking-wider">© 2025 LocalBookr Inc. • Aurangabad, Bihar</p>
              </div>
           </div>
        </div>
      </footer>
    </div>
  );
};
