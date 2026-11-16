import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, LayoutDashboard, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PublicLayout } from '../components/layout/PublicLayout';

export function NotFoundPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleDashboardClick = () => {
    if (user?.role === 'superadmin') navigate('/superadmin');
    else if (user?.role === 'admin') navigate('/admin');
    else navigate('/dashboard');
  };

  return (
    <PublicLayout>
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-20 bg-[var(--paper)]">
        <div className="max-w-md w-full text-center">
          {/* Big Zen Dots 404 */}
          <div className="font-zen text-7xl sm:text-8xl font-black text-[#12A150] tracking-tighter drop-shadow-sm mb-4">
            404
          </div>

          <h1 className="font-sans font-bold text-2xl sm:text-3xl text-[var(--ink)] tracking-tight">
            Halaman Tidak Ditemukan
          </h1>

          <p className="mt-2 text-sm text-[var(--ink-2)] leading-relaxed">
            Halaman yang Anda tuju mungkin telah dipindahkan, dihapus, atau tautan yang Anda masukkan keliru.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-sans font-semibold text-sm shadow-xs transition-all cursor-pointer"
            >
              <Home className="w-4 h-4 text-slate-500" />
              <span>Ke Beranda</span>
            </Link>

            {user && (
              <button
                type="button"
                onClick={handleDashboardClick}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#12A150] to-[#0A803E] hover:from-[#0E9045] hover:to-[#086E34] text-white font-sans font-semibold text-sm shadow-sm hover:shadow-md transition-all cursor-pointer"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Buka Dashboard ({user.role?.toUpperCase()})</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}

export default NotFoundPage;
