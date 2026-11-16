import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function AuthGuard({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--mint-50)] flex items-center justify-center text-[var(--accent-strong)] font-mono text-xs">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[var(--accent-strong)] border-t-transparent rounded-full animate-spin"></div>
          <span>MEMUAT SESI...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  return children;
}

export function RoleGuard({ children, allowedRoles = [] }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--mint-50)] flex items-center justify-center text-[var(--accent-strong)] font-mono text-xs">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[var(--accent-strong)] border-t-transparent rounded-full animate-spin"></div>
          <span>MEMVERIFIKASI AKSES...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const role = user.role;
  const isSuper = role === 'superadmin';
  const isAllowed = allowedRoles.includes(role) || (isSuper && allowedRoles.includes('admin'));

  if (!isAllowed) {
    // Redirect to legitimate dashboard for their role
    if (role === 'superadmin') return <Navigate to="/superadmin" replace />;
    if (role === 'admin') return <Navigate to="/admin" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default AuthGuard;
