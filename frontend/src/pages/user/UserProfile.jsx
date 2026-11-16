import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { PageHeader } from '../../components/layout/PageHeader';
import { userMenuItems } from './userMenu';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api';
import { getErrorMessage } from '../../utils/errorMessage';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { FileUpload } from '../../components/ui/FileUpload';
import { Tabs } from '../../components/ui/Tabs';
import { Chip } from '../../components/ui/Chip';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { 
  User, Mail, Phone, ShieldCheck, ShieldAlert, 
  Upload, Lock, CheckCircle2, AlertCircle, FileText 
} from 'lucide-react';

export function UserProfile() {
  const { user, updateUser, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'identity' | 'security'

  // Profile Form State
  const [name, setName] = useState(user?.name || user?.full_name || '');
  const [whatsapp, setWhatsapp] = useState(user?.whatsapp || user?.phone || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Identity Upload State
  const [identityNumber, setIdentityNumber] = useState(user?.identity_number || '');
  const [identityFile, setIdentityFile] = useState(null);
  const [identityLoading, setIdentityLoading] = useState(false);
  const [identitySuccess, setIdentitySuccess] = useState('');
  const [identityError, setIdentityError] = useState('');

  // Password Change State
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
      if (!identityNumber) setIdentityNumber(user.identity_number || '');
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
      setProfileSuccess('Profil akun berhasil disimpan.');
      setTimeout(() => setProfileSuccess(''), 3000);
    } catch (err) {
      setProfileError(getErrorMessage(err));
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUploadIdentity = async (e) => {
    e.preventDefault();
    setIdentityError('');
    setIdentitySuccess('');

    const cleanId = (identityNumber || '').trim();
    if (category === 'mahasiswa') {
      if (!/^[0-9]{8,12}$/.test(cleanId)) {
        setIdentityError('NPM Mahasiswa harus berupa 8-12 digit angka.');
        return;
      }
    } else if (category === 'karyawan') {
      if (!/^[A-Za-z0-9\.\-\s]{6,20}$/.test(cleanId)) {
        setIdentityError('NIP / NIK Karyawan harus berupa 6-20 karakter.');
        return;
      }
    }

    if (!identityFile) {
      setIdentityError('Harap pilih berkas foto kartu identitas.');
      return;
    }

    setIdentityLoading(true);

    try {
      const formData = new FormData();
      formData.append('identity_number', cleanId);
      formData.append('identity_card', identityFile);
      await apiClient.user.uploadIdentity(formData);
      await refreshUser();
      setIdentitySuccess('Dokumen identitas berhasil diunggah dan menunggu verifikasi admin.');
      setIdentityFile(null);
    } catch (err) {
      setIdentityError(getErrorMessage(err));
    } finally {
      setIdentityLoading(false);
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
      await apiClient.auth.changePassword({
        currentPassword,
        newPassword,
      });
      setPwdSuccess('Kata sandi akun Anda berhasil diperbarui.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      setPwdError(getErrorMessage(err));
    } finally {
      setPwdLoading(false);
    }
  };

  const category = user?.category || 'umum';
  const isVerified = (user?.identity_status || user?.identity_verification_status) === 'verified';

  return (
    <DashboardLayout
      role="user"
      menuItems={userMenuItems}
    >
      <PageHeader
        title="Pengaturan Akun & Identitas"
        highlightWord="Identitas"
        subtitle="Kelola informasi profil, kartu tanda mahasiswa/karyawan, dan keamanan sandi"
        breadcrumbs={[
          { label: 'BERANDA', path: '/' },
          { label: 'DASHBOARD', path: '/dashboard' },
          { label: 'PROFIL' }
        ]}
      />

      <div className="-mt-6 space-y-6 max-w-3xl">
        {/* Tabs */}
        <div className="flex items-center">
          <Tabs
            tabs={[
              { id: 'profile', label: 'Data Diri' },
              { id: 'identity', label: 'Identitas & Kategori' },
              { id: 'security', label: 'Keamanan Akun' }
            ]}
            activeTab={activeTab}
            onChange={(tabId) => setActiveTab(tabId)}
          />
        </div>

        {/* TAB 1: DATA DIRI */}
        {activeTab === 'profile' && (
          <form onSubmit={handleUpdateProfile} className="bg-[var(--surface)] p-6 sm:p-8 rounded-[24px] border border-[var(--line)] shadow-sm space-y-5 animate-in fade-in duration-150">
            <div>
              <h3 className="font-sans font-bold text-lg text-[var(--ink)]">
                Informasi Kontak & Profil
              </h3>
              <p className="text-xs text-[var(--ink-2)] mt-0.5">
                Pastikan nama dan nomor WhatsApp aktif untuk kemudahan konfirmasi reservasi lapangan.
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
                hint="Alamat email digunakan sebagai identitas akun utama dan tidak dapat diubah sendiri."
              />

              <Input
                label="Nomor WhatsApp"
                type="tel"
                required
                icon={Phone}
                placeholder="081234567890"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, ''))}
                hint="Petugas lapangan akan menghubungi nomor ini bila terdapat koordinasi pertandingan (10-14 digit)."
              />
            </div>

            <div className="flex justify-end pt-3 border-t border-[var(--line)]">
              <Button
                type="submit"
                variant="accent"
                loading={profileLoading}
              >
                Simpan Perubahan
              </Button>
            </div>
          </form>
        )}

        {/* TAB 2: IDENTITAS & KATEGORI */}
        {activeTab === 'identity' && (
          <div className="bg-[var(--surface)] p-6 sm:p-8 rounded-[24px] border border-[var(--line)] shadow-sm space-y-6 animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--line)]">
              <div>
                <h3 className="font-sans font-bold text-lg text-[var(--ink)]">
                  Status Kategori & Kartu Identitas
                </h3>
                <p className="text-xs text-[var(--ink-2)] mt-0.5">
                  Kategori Anda menentukan tarif sewa tetap resmi yang berlaku.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Chip tier={category} size="md" />
                <StatusBadge status={isVerified ? 'verified' : 'unverified'} />
              </div>
            </div>

            {category === 'umum' ? (
              <div className="p-4 rounded-[16px] bg-[var(--paper-2)] border border-[var(--line)] text-xs text-[var(--ink-2)] space-y-2">
                <p>
                  Akun Anda terdaftar sebagai <strong>Masyarakat Umum</strong> dengan tarif sewa standar resmi.
                </p>
                <p className="text-[var(--ink-3)]">
                  Jika Anda merupakan Mahasiswa aktif atau Dosen/Karyawan Politeknik Negeri Lampung, hubungi Administrator untuk penyesuaian kategori akun Anda.
                </p>
              </div>
            ) : (
              <form onSubmit={handleUploadIdentity} className="space-y-4">
                {identitySuccess && (
                  <div className="p-3.5 rounded-[12px] bg-emerald-50 border border-emerald-200 text-[var(--accent-strong)] text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{identitySuccess}</span>
                  </div>
                )}

                {identityError && (
                  <div className="p-3.5 rounded-[12px] bg-rose-50 border border-rose-200 text-[var(--danger)] text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    <span>{identityError}</span>
                  </div>
                )}

                <Input
                  label={category === 'mahasiswa' ? 'NPM (Nomor Pokok Mahasiswa)' : 'NIP / NIK Karyawan'}
                  type="text"
                  required
                  icon={FileText}
                  value={identityNumber}
                  onChange={(e) => setIdentityNumber(e.target.value)}
                />

                <div>
                  <label className="block font-mono text-xs font-semibold uppercase tracking-wider text-[var(--ink-2)] mb-1.5">
                    Perbarui Berkas Kartu Identitas (KTM / Kartu Pegawai)
                  </label>
                  <FileUpload
                    accept="image/*,application/pdf"
                    maxSizeMB={3}
                    selectedFile={identityFile}
                    onFileSelected={(file) => setIdentityFile(file)}
                  />
                </div>

                <div className="flex justify-end pt-3 border-t border-[var(--line)]">
                  <Button
                    type="submit"
                    variant="accent"
                    loading={identityLoading}
                    disabled={!identityFile}
                  >
                    Kirim untuk Diverifikasi
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* TAB 3: KEAMANAN KATA SANDI */}
        {activeTab === 'security' && (
          <form onSubmit={handleChangePassword} className="bg-[var(--surface)] p-6 sm:p-8 rounded-[24px] border border-[var(--line)] shadow-sm space-y-5 animate-in fade-in duration-150">
            <div>
              <h3 className="font-sans font-bold text-lg text-[var(--ink)]">
                Perbarui Kata Sandi
              </h3>
              <p className="text-xs text-[var(--ink-2)] mt-0.5">
                Pastikan menggunakan kombinasi huruf besar, angka, dan minimal 8 karakter.
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
                Ganti Kata Sandi
              </Button>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}

export default UserProfile;
