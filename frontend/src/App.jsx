import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AuthGuard, RoleGuard } from './routes/Guards';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Skeleton } from './components/ui/Skeleton';

// 1. HALAMAN 1: LANDING PAGE & PUBLIK
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import NewsDetailPage from './pages/NewsDetailPage';
import CheckStatusPage from './pages/CheckStatusPage';
import NotFoundPage from './pages/NotFoundPage';

// 2. HALAMAN 2: USER DASHBOARD
import UserDashboard from './pages/user/UserDashboard';
import UserBookingWizard from './pages/user/UserBookingWizard';
import UserBookings from './pages/user/UserBookings';
import UserHistory from './pages/user/UserHistory';
import UserProfile from './pages/user/UserProfile';

// 3. HALAMAN 3: ADMIN DASHBOARD
import AdminSummary from './pages/admin/AdminSummary';
import AdminReservations from './pages/admin/AdminReservations';
import AdminSchedule from './pages/admin/AdminSchedule';
import AdminNews from './pages/admin/AdminNews';
import AdminUsers from './pages/admin/AdminUsers';
import AdminProfile from './pages/admin/AdminProfile';
import AdminTicketScanner from './pages/admin/AdminTicketScanner';

// 4. HALAMAN 4: SUPERADMIN DASHBOARD
import SuperSummary from './pages/superadmin/SuperSummary';
import SuperAdmins from './pages/superadmin/SuperAdmins';
import SuperUsers from './pages/superadmin/SuperUsers';
import SuperActivity from './pages/superadmin/SuperActivity';
import SuperFields from './pages/superadmin/SuperFields';
import SuperReports from './pages/superadmin/SuperReports';
import SuperSettings from './pages/superadmin/SuperSettings';

function PageLoader() {
  return (
    <div className="min-h-screen bg-[var(--paper)] flex flex-col items-center justify-center p-6 space-y-4">
      <div className="w-10 h-10 rounded-xl bg-[var(--accent-soft)] border border-[var(--accent-strong)]/30 flex items-center justify-center font-bold text-lg text-[var(--accent-strong)] shadow-xs animate-bounce">
        ⚽
      </div>
      <div className="font-mono text-xs uppercase tracking-widest text-[var(--accent-strong)]">
        MEMUAT POLISOCCER...
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* ======================================================== */}
              {/* 1. HALAMAN 1: PUBLIK & LANDING PAGE                      */}
              {/* ======================================================== */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/daftar" element={<RegisterPage />} />
              <Route path="/berita/:id" element={<NewsDetailPage />} />
              <Route path="/berita" element={<Navigate to="/#berita" replace />} />
              <Route path="/berita-kegiatan" element={<Navigate to="/#berita" replace />} />
              <Route path="/jadwal" element={<Navigate to="/#jadwal" replace />} />
              <Route path="/jadwal-lapangan" element={<Navigate to="/#jadwal" replace />} />
              <Route path="/kalender" element={<Navigate to="/#jadwal" replace />} />
              <Route path="/tarif" element={<Navigate to="/#tarif" replace />} />
              <Route path="/tarif-lapangan" element={<Navigate to="/#tarif" replace />} />
              <Route path="/harga" element={<Navigate to="/#tarif" replace />} />
              <Route path="/biaya" element={<Navigate to="/#tarif" replace />} />
              <Route path="/tentang" element={<Navigate to="/#tentang" replace />} />
              <Route path="/tentang-kami" element={<Navigate to="/#tentang" replace />} />
              <Route path="/cara-booking" element={<Navigate to="/#tentang" replace />} />
              <Route path="/kontak" element={<Navigate to="/#kontak" replace />} />
              <Route path="/hubungi-kami" element={<Navigate to="/#kontak" replace />} />
              <Route path="/bantuan" element={<Navigate to="/#kontak" replace />} />
              <Route path="/cek-tiket" element={<CheckStatusPage />} />
              <Route path="/cek-status" element={<CheckStatusPage />} />
              <Route path="/tiket" element={<Navigate to="/cek-tiket" replace />} />
              <Route path="/status" element={<Navigate to="/cek-tiket" replace />} />
              <Route path="/ticket" element={<Navigate to="/cek-tiket" replace />} />
              <Route path="/check-ticket" element={<Navigate to="/cek-tiket" replace />} />
              <Route path="/booking" element={<Navigate to="/#jadwal" replace />} />
              <Route path="/pesan" element={<Navigate to="/#jadwal" replace />} />

              {/* ======================================================== */}
              {/* 2. HALAMAN 2: USER DASHBOARD (/dashboard/*)             */}
              {/* ======================================================== */}
              <Route path="/user" element={<Navigate to="/dashboard" replace />} />
              <Route path="/user/dashboard" element={<Navigate to="/dashboard" replace />} />
              <Route path="/user/booking" element={<Navigate to="/dashboard/booking" replace />} />
              <Route path="/user/bookings" element={<Navigate to="/dashboard/bookings" replace />} />
              <Route path="/user/pesan" element={<Navigate to="/dashboard/booking" replace />} />
              <Route path="/user/pesanan" element={<Navigate to="/dashboard/bookings" replace />} />
              <Route path="/user/riwayat" element={<Navigate to="/dashboard/riwayat" replace />} />
              <Route path="/user/history" element={<Navigate to="/dashboard/riwayat" replace />} />
              <Route path="/user/profil" element={<Navigate to="/dashboard/profil" replace />} />
              <Route path="/user/profile" element={<Navigate to="/dashboard/profil" replace />} />
              <Route path="/reservasi" element={<Navigate to="/dashboard/booking" replace />} />
              <Route path="/riwayat" element={<Navigate to="/dashboard/riwayat" replace />} />
              <Route path="/profil" element={<Navigate to="/dashboard/profil" replace />} />
              <Route path="/profile" element={<Navigate to="/dashboard/profil" replace />} />
              <Route path="/dashboard/wizard" element={<Navigate to="/dashboard/booking" replace />} />
              <Route path="/dashboard/pesan" element={<Navigate to="/dashboard/booking" replace />} />
              <Route path="/booking/baru" element={<Navigate to="/dashboard/booking" replace />} />
              <Route path="/booking-baru" element={<Navigate to="/dashboard/booking" replace />} />
              <Route path="/pesan-lapangan" element={<Navigate to="/dashboard/booking" replace />} />
              <Route
                path="/dashboard"
                element={
                  <AuthGuard>
                    <UserDashboard />
                  </AuthGuard>
                }
              />
              <Route
                path="/dashboard/booking"
                element={
                  <AuthGuard>
                    <UserBookingWizard />
                  </AuthGuard>
                }
              />
              <Route
                path="/dashboard/bookings"
                element={
                  <AuthGuard>
                    <UserBookings />
                  </AuthGuard>
                }
              />
              <Route
                path="/dashboard/riwayat"
                element={
                  <AuthGuard>
                    <UserHistory />
                  </AuthGuard>
                }
              />
              <Route
                path="/dashboard/profil"
                element={
                  <AuthGuard>
                    <UserProfile />
                  </AuthGuard>
                }
              />
              <Route
                path="/dashboard/profile"
                element={<Navigate to="/dashboard/profil" replace />}
              />

              {/* ======================================================== */}
              {/* 3. HALAMAN 3: ADMIN DASHBOARD (/admin/*)                 */}
              {/* ======================================================== */}
              <Route path="/admin/dashboard" element={<Navigate to="/admin" replace />} />
              <Route path="/admin/scanner" element={<Navigate to="/admin/scan" replace />} />
              <Route
                path="/admin/scan"
                element={
                  <RoleGuard allowedRoles={['admin', 'superadmin']}>
                    <AdminTicketScanner />
                  </RoleGuard>
                }
              />
              <Route
                path="/admin"
                element={
                  <RoleGuard allowedRoles={['admin']}>
                    <AdminSummary />
                  </RoleGuard>
                }
              />
              <Route
                path="/admin/reservasi"
                element={
                  <RoleGuard allowedRoles={['admin']}>
                    <AdminReservations />
                  </RoleGuard>
                }
              />
              <Route
                path="/admin/jadwal"
                element={
                  <RoleGuard allowedRoles={['admin']}>
                    <AdminSchedule />
                  </RoleGuard>
                }
              />
              <Route
                path="/admin/berita"
                element={
                  <RoleGuard allowedRoles={['admin']}>
                    <AdminNews />
                  </RoleGuard>
                }
              />
              <Route
                path="/admin/pengguna"
                element={
                  <RoleGuard allowedRoles={['admin']}>
                    <AdminUsers />
                  </RoleGuard>
                }
              />
              <Route path="/admin/users" element={<Navigate to="/admin/pengguna" replace />} />
              <Route path="/admin/schedule" element={<Navigate to="/admin/jadwal" replace />} />
              <Route path="/admin/bookings" element={<Navigate to="/admin/reservasi" replace />} />
              <Route path="/admin/booking" element={<Navigate to="/admin/reservasi" replace />} />
              <Route path="/admin/reservations" element={<Navigate to="/admin/reservasi" replace />} />
              <Route path="/admin/news" element={<Navigate to="/admin/berita" replace />} />
              <Route path="/admin/laporan" element={<Navigate to="/admin" replace />} />
              <Route path="/admin/settings" element={<Navigate to="/admin/profil" replace />} />
              <Route path="/admin/setting" element={<Navigate to="/admin/profil" replace />} />
              <Route
                path="/admin/profil"
                element={
                  <RoleGuard allowedRoles={['admin']}>
                    <AdminProfile />
                  </RoleGuard>
                }
              />
              <Route
                path="/admin/profile"
                element={<Navigate to="/admin/profil" replace />}
              />

              {/* ======================================================== */}
              {/* 4. HALAMAN 4: SUPERADMIN DASHBOARD (/superadmin/*)       */}
              {/* ======================================================== */}
              <Route path="/superadmin/dashboard" element={<Navigate to="/superadmin" replace />} />
              <Route path="/superadmin/admins" element={<Navigate to="/superadmin/admin" replace />} />
              <Route path="/superadmin/pengelola" element={<Navigate to="/superadmin/admin" replace />} />
              <Route path="/superadmin/audit-logs" element={<Navigate to="/superadmin/aktivitas" replace />} />
              <Route path="/superadmin/audit" element={<Navigate to="/superadmin/aktivitas" replace />} />
              <Route path="/superadmin/activity" element={<Navigate to="/superadmin/aktivitas" replace />} />
              <Route path="/superadmin/log" element={<Navigate to="/superadmin/aktivitas" replace />} />
              <Route path="/superadmin/logs" element={<Navigate to="/superadmin/aktivitas" replace />} />
              <Route path="/superadmin/fields" element={<Navigate to="/superadmin/lapangan" replace />} />
              <Route path="/superadmin/field" element={<Navigate to="/superadmin/lapangan" replace />} />
              <Route path="/superadmin/tarif" element={<Navigate to="/superadmin/lapangan" replace />} />
              <Route path="/superadmin/users" element={<Navigate to="/superadmin/pengguna" replace />} />
              <Route path="/superadmin/user" element={<Navigate to="/superadmin/pengguna" replace />} />
              <Route path="/superadmin/reports" element={<Navigate to="/superadmin/laporan" replace />} />
              <Route path="/superadmin/report" element={<Navigate to="/superadmin/laporan" replace />} />
              <Route path="/superadmin/keuangan" element={<Navigate to="/superadmin/laporan" replace />} />
              <Route path="/superadmin/settings" element={<Navigate to="/superadmin/pengaturan" replace />} />
              <Route path="/superadmin/setting" element={<Navigate to="/superadmin/pengaturan" replace />} />
              <Route path="/superadmin/profil" element={<Navigate to="/superadmin" replace />} />
              <Route path="/superadmin/profile" element={<Navigate to="/superadmin" replace />} />
              <Route
                path="/superadmin"
                element={
                  <RoleGuard allowedRoles={['superadmin']}>
                    <SuperSummary />
                  </RoleGuard>
                }
              />
              <Route
                path="/superadmin/admin"
                element={
                  <RoleGuard allowedRoles={['superadmin']}>
                    <SuperAdmins />
                  </RoleGuard>
                }
              />
              <Route
                path="/superadmin/pengguna"
                element={
                  <RoleGuard allowedRoles={['superadmin']}>
                    <SuperUsers />
                  </RoleGuard>
                }
              />
              <Route
                path="/superadmin/aktivitas"
                element={
                  <RoleGuard allowedRoles={['superadmin']}>
                    <SuperActivity />
                  </RoleGuard>
                }
              />
              <Route
                path="/superadmin/lapangan"
                element={
                  <RoleGuard allowedRoles={['superadmin']}>
                    <SuperFields />
                  </RoleGuard>
                }
              />
              <Route
                path="/superadmin/laporan"
                element={
                  <RoleGuard allowedRoles={['superadmin']}>
                    <SuperReports />
                  </RoleGuard>
                }
              />
              <Route
                path="/superadmin/pengaturan"
                element={
                  <RoleGuard allowedRoles={['superadmin']}>
                    <SuperSettings />
                  </RoleGuard>
                }
              />

              {/* Catch-all 404 */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
