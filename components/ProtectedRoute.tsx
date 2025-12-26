import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../services/authContext';
import { Role } from '../types';

interface Props {
  allowedRoles?: Role[];
}

export const ProtectedRoute = ({ children, allowedRoles }: React.PropsWithChildren<Props>) => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their appropriate dashboard if trying to access unauthorized area
    if (user.role === Role.ADMIN) return <Navigate to="/admin" replace />;
    if (user.role === Role.PROVIDER) return <Navigate to="/provider" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};