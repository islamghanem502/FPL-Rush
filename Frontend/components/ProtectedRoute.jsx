import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';

const ProtectedRoute = ({ children, adminOnly = false, requireFplLink = false }) => {
  const { user, isAdmin, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-[#22c55e]"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-[#22c55e]" /></div>;
  }

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" replace />;

  // A linked FPL account is required to evaluate challenge eligibility and
  // scores.
  if (requireFplLink && (user.accountStatus !== 'fpl_linked' || !user.fpl_id)) {
    return <Navigate to="/register" replace />;
  }

  return children;
};

export default ProtectedRoute;
