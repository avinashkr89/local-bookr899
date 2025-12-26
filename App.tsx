import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './services/authContext';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Role } from './types';

// Pages
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ProviderRegister } from './pages/ProviderRegister';
import { Dashboard } from './pages/Dashboard';
import { BookService } from './pages/BookService';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminBookings } from './pages/admin/AdminBookings';
import { AdminProviders } from './pages/admin/AdminProviders';
import { AdminServices } from './pages/admin/AdminServices';
import { ProviderDashboard } from './pages/provider/ProviderDashboard';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/provider-register" element={<ProviderRegister />} />
            
            {/* Customer Routes */}
            <Route path="/book/:serviceId" element={
              <ProtectedRoute allowedRoles={[Role.CUSTOMER]}>
                <BookService />
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute allowedRoles={[Role.CUSTOMER]}>
                <Dashboard />
              </ProtectedRoute>
            } />

            {/* Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={[Role.ADMIN]}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/bookings" element={
              <ProtectedRoute allowedRoles={[Role.ADMIN]}>
                <AdminBookings />
              </ProtectedRoute>
            } />
            <Route path="/admin/providers" element={
              <ProtectedRoute allowedRoles={[Role.ADMIN]}>
                <AdminProviders />
              </ProtectedRoute>
            } />
            <Route path="/admin/services" element={
              <ProtectedRoute allowedRoles={[Role.ADMIN]}>
                <AdminServices />
              </ProtectedRoute>
            } />

            {/* Provider Routes */}
            <Route path="/provider" element={
              <ProtectedRoute allowedRoles={[Role.PROVIDER]}>
                <ProviderDashboard />
              </ProtectedRoute>
            } />
          </Routes>
        </Layout>
        <Toaster position="top-right" />
      </Router>
    </AuthProvider>
  );
}

export default App;
