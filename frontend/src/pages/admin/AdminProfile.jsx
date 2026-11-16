import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { PageHeader } from '../../components/layout/PageHeader';
import { adminMenuItems } from './adminMenu';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api';
import { getErrorMessage } from '../../utils/errorMessage';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { User, Mail, Phone, Lock, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';

export function AdminProfile() {
  const { user, updateUser } = useAuth();

  const [name, setName] = useState(user?.name || user?.full_name || '');
  const [whatsapp, setWhatsapp] = useState(user?.whatsapp || user?.phone || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [pwdError, setPwdError] = useState('');

  useEffect(() => {
    if (user) {
      if (!name) setName(user.name || user.full_name || '');
      if (!whatsapp) setWhatsapp(user.whatsapp || user.phone || '');
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    const cleanWhatsapp = (whatsapp || '').trim().replace(/\D/g, '');
    if (!cleanWhatsapp) {
      setProfileError('Nomor WhatsApp wajib diisi.');
      return;
    }
    if (!/^(08|628)[0-9]{8,12}$/.test(cleanWhatsapp)) {
      setProfileError('Nomor WhatsApp tidak valid. Format: 08xx atau 628xx (10-14 digit angka).');
      return;
    }

    setProfileLoading(true);

    try {
      await apiClient.auth.updateProfile({
        name: name.trim(),
        full_name: name.trim(),
        whatsapp: cleanWhatsapp,
        phone: cleanWhatsapp,
      });
      updateUser({
        name: name.trim(),
        full_name: name.trim(),
        whatsapp: cleanWhatsapp,
        phone: cleanWhatsapp,
      });
      setProfileSuccess('Profil admin berhasil disimpan.');
      setTimeout(() => setProfileSuccess(''), 3000);
    } catch (err) {
      setProfileError(getErrorMessage(err));
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');

    if (newPassword !== confirmNewPassword) {
      setPwdError('Konfirmasi kata sandi baru tidak cocok.');
      return;
    }

    setPwdLoading(true);

    try {
      await apiClient.auth.changePassword({ currentPassword, newPassword });
      setPwdSuccess('Kata sandi admin berhasil diperbarui.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setTimeout(() => setPwdSuccess(''), 3000);
    } catch (err) {
      setPwdError(getErrorMessage(err));
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <DashboardLayout
      role={user?.role === 'superadmin' ? 'superadmin' : 'admin'}
      menuItems={adminMenuItems}
    >
      <PageHeader
        title="Profil Administrator"
        highlightWord="Administrator"
        subtitle="Kelola data kontak pengelola dan keamanan akses sistem operasional"
        breadcrumbs={[
          { label: 'BERANDA', path: '/' },
          { label: 'ADMINISTRATOR', path: '/admin' },
          { label: 'PROFIL' }
        ]}
      />

      <div className="-mt-6 space-y-6 max-w-3xl">
        {/* Profile Card */}
        <form onSubmit={handleUpdateProfile} className="bg-[var(--surface)] p-6 sm:p-8 rounded-[24px] border border-[var(--line)] shadow-sm space-y-5">
          <div>
            <h3 className="font-sans font-bold text-lg text-[var(--ink)]">
              Informasi Akun Pengelola
            </h3>
            <p className="text-xs text-[var(--ink-2)] mt-0.5">
              Data diri dan kontak resmi pengawas lapangan Mini Soccer Polinela.
            </p>
          </div>

          {profileSuccess && (
            <div className="p-3.5 rounded-[12px] bg-emerald-50 border border-emerald-200 text-[var(--accent-strong)] text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{profileSuccess}</span>
            </div>
          )}

          {profileError && (
            <div className="p-3.5 rounded-[12px] bg-rose-50 border border-rose-200 text-[var(--danger)] text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{profileError}</span>
            </div>
          )}

          <div className="space-y-4">
            <Input
              label="Nama Lengkap"
              type="text"
              required
              icon={User}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <Input
              label="Alamat Email (Akun)"
              type="email"
              disabled
              icon={Mail}
              value={user?.email || ''}
            />

            <Input
              label="Nomor WhatsApp"
              type="tel"
              required
              icon={Phone}
              placeholder="081234567890"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, ''))}
              hint="Format 08xx atau 628xx (10-14 digit angka)"
            />
          </div>

          <div className="flex justify-end pt-3 border-t border-[var(--line)]">
            <Button
              type="submit"
              variant="accent"
              loading={profileLoading}
            >
              Simpan Profil
            </Button>
          </div>
        </form>

        {/* Change Password Card */}
        <form onSubmit={handleChangePassword} className="bg-[var(--surface)] p-6 sm:p-8 rounded-[24px] border border-[var(--line)] shadow-sm space-y-5">
          <div>
            <h3 className="font-sans font-bold text-lg text-[var(--ink)]">
              Ganti Kata Sandi
            </h3>
            <p className="text-xs text-[var(--ink-2)] mt-0.5">
              Gunakan kata sandi kuat untuk menjaga keamanan akses pengelola sistem.
            </p>
          </div>

          {pwdSuccess && (
            <div className="p-3.5 rounded-[12px] bg-emerald-50 border border-emerald-200 text-[var(--accent-strong)] text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{pwdSuccess}</span>
            </div>
          )}

          {pwdError && (
            <div className="p-3.5 rounded-[12px] bg-rose-50 border border-rose-200 text-[var(--danger)] text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{pwdError}</span>
            </div>
          )}

          <div className="space-y-4">
            <Input
              label="Kata Sandi Sekarang"
              type="password"
              required
              icon={Lock}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />

            <Input
              label="Kata Sandi Baru"
              type="password"
              required
              icon={Lock}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />

            <Input
              label="Ulangi Kata Sandi Baru"
              type="password"
              required
              icon={Lock}
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
            />
          </div>

          <div className="flex justify-end pt-3 border-t border-[var(--line)]">
            <Button
              type="submit"
              variant="accent"
              loading={pwdLoading}
            >
              Perbarui Kata Sandi
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

export default AdminProfile;
