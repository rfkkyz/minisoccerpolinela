import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api';
import { useAuth } from '../../context/AuthContext';
import { DashboardSidebar } from './DashboardSidebar';
import { DashboardTopbar } from './DashboardTopbar';

export function DashboardLayout({
  role = 'user', // 'user' | 'admin' | 'superadmin'
  menuItems = [],
  children
}) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { user: authUser, logout: authLogout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await apiClient.auth.logout();
    } catch (e) {}
    authLogout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[var(--paper)] font-sans antialiased text-[var(--ink)] flex">
      {/* 1. Sidebar (Fixed 264px on lg+, drawer on mobile) */}
      <DashboardSidebar
        role={role}
        menuItems={menuItems}
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        onLogout={handleLogout}
      />

      {/* 2. Main Content Wrapper (offset by 264px on lg) */}
      <div className="flex-1 lg:pl-[264px] flex flex-col min-h-screen min-w-0">
        <div className="p-3 sm:p-6 lg:p-8 max-w-[1400px] w-full mx-auto">
          {/* Floating Topbar */}
          <DashboardTopbar
            user={authUser}
            role={role}
            onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
            onLogout={handleLogout}
          />

          {/* Main Page Area */}
          <main className="w-full">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

export default DashboardLayout;
