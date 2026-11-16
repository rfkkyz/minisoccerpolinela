import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../utils/errorMessage';
import { 
  User, Mail, Phone, Lock, Eye, EyeOff, ArrowRight, 
  FileText, CheckCircle2 
} from 'lucide-react';
import { AuthLayout } from '../components/layout/AuthLayout';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { FileUpload } from '../components/ui/FileUpload';

export function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { register } = useAuth();

  const queryParams = new URLSearchParams(location.search);
  const redirectUrl = queryParams.get('redirect') || null;
  const initialCategory = queryParams.get('tier') || queryParams.get('category') || 'umum';

  // Form State
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [category, setCategory] = useState(
    ['umum', 'mahasiswa', 'karyawan'].includes(initialCategory) ? initialCategory : 'umum'
  );
  const [identityNumber, setIdentityNumber] = useState('');
  const [identityFile, setIdentityFile] = useState(null);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const categoryOptions = [
    { value: 'umum', label: 'Umum (Masyarakat Luas)' },
    { value: 'mahasiswa', label: 'Mahasiswa (Politeknik Negeri Lampung)' },
    { value: 'karyawan', label: 'Karyawan / Dosen (Politeknik Negeri Lampung)' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    const cleanPhone = (whatsapp || '').replace(/\D/g, '');
    if (!cleanPhone) {
      setError('Nomor WhatsApp wajib diisi.');
      return;
    }
    if (!/^(08|628)[0-9]{8,12}$/.test(cleanPhone)) {
      setError('Nomor WhatsApp tidak valid. Format: 08xx atau 628xx dengan panjang 10-14 digit angka.');
      return;
    }

    if (!agreeTerms) {
      setError('Anda harus menyetujui syarat & ketentuan reservasi.');
      return;
    }

    if (category !== 'umum') {
      const cleanId = (identityNumber || '').trim();
      if (!cleanId || !identityFile) {
        setError(`Kategori ${category === 'mahasiswa' ? 'Mahasiswa' : 'Karyawan'} wajib mengisi nomor identitas (NPM/NIP) dan mengunggah kartu.`);
        return;
      }
      if (category === 'mahasiswa' && !/^[0-9]{8,12}$/.test(cleanId)) {
        setError('NPM Mahasiswa harus berupa 8-12 digit angka.');
        return;
      }
      if (category === 'karyawan' && !/^[A-Za-z0-9\.\-\s]{6,20}$/.test(cleanId)) {
        setError('NIP/NIK Karyawan harus berupa 6-20 karakter.');
        return;
      }
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('username', username || email.split('@')[0]);
      formData.append('email', email);
      formData.append('whatsapp', cleanPhone);
      formData.append('category', category);
      formData.append('password', password);

      if (category !== 'umum') {
        formData.append('identity_number', identityNumber.trim());
        if (identityFile) {
          formData.append('identity_card', identityFile);
        }
      }

      await register(formData);

      if (redirectUrl) {
        navigate(redirectUrl);
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Daftar Akun Baru"
      subtitle="Lengkapi formulir untuk membuat akun reservasi resmi"
      badge="REGISTRASI AKUN"
      className="max-w-[560px]"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3.5 rounded-[12px] bg-rose-50 border border-rose-200 text-[var(--danger)] text-xs font-medium flex items-start gap-2">
            <span className="text-sm leading-none shrink-0">⚠</span>
            <span>{error}</span>
          </div>
        )}

        <Input
          label="Nama Lengkap"
          type="text"
          required
          placeholder="Rifki Rangga Saputra"
          icon={User}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Email"
            type="email"
            required
            placeholder="nama@email.com"
            icon={Mail}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            label="No. WhatsApp"
            type="tel"
            required
            placeholder="081234567890"
            icon={Phone}
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, ''))}
            hint="Format: 08xx / 628xx (10-14 digit)"
          />
        </div>

        <Select
          label="Kategori Akun"
          required
          options={categoryOptions}
          value={category}
          onChange={(val) => setCategory(val)}
        />

        {category !== 'umum' && (
          <div className="p-4 rounded-[16px] bg-[var(--surface-tint)] border border-[var(--line-strong)] space-y-3 animate-in fade-in duration-200">
            <div className="text-xs font-mono font-semibold text-[var(--accent-strong)] uppercase">
              Verifikasi {category === 'mahasiswa' ? 'Mahasiswa (KTM / NPM)' : 'Karyawan (ID Card / NIP)'}
            </div>

            <Input
              label={category === 'mahasiswa' ? 'NPM (Nomor Pokok Mahasiswa)' : 'NIP / NIK Karyawan'}
              type="text"
              required
              placeholder="Contoh: 21753000"
              icon={FileText}
              value={identityNumber}
              onChange={(e) => setIdentityNumber(e.target.value)}
            />

            <div>
              <label className="block font-mono text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-2)] mb-1.5">
                Unggah Foto Kartu Identitas (KTM / Kartu Pegawai) *
              </label>
              <FileUpload
                accept="image/*,application/pdf"
                maxSizeMB={3}
                selectedFile={identityFile}
                onFileSelected={(file) => setIdentityFile(file)}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Kata Sandi"
            type={showPassword ? 'text' : 'password'}
            required
            placeholder="Minimal 8 karakter"
            icon={Lock}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Input
            label="Konfirmasi Sandi"
            type={showPassword ? 'text' : 'password'}
            required
            placeholder="Ulangi kata sandi"
            icon={Lock}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            iconRight={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[var(--ink-3)] hover:text-[var(--ink)] cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />
        </div>

        <div className="pt-2 flex items-start gap-2.5">
          <input
            type="checkbox"
            id="agreeTerms"
            checked={agreeTerms}
            onChange={(e) => setAgreeTerms(e.target.checked)}
            className="mt-0.5 rounded border-[var(--line-strong)] text-[var(--accent-strong)] focus:ring-[var(--accent-strong)]"
          />
          <label htmlFor="agreeTerms" className="text-xs text-[var(--ink-2)] leading-relaxed cursor-pointer select-none">
            Saya menyetujui seluruh ketentuan sewa, jadwal operasional, dan peraturan lapangan Mini Soccer Politeknik Negeri Lampung.
          </label>
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            variant="accent"
            size="lg"
            block
            loading={loading}
            iconRight={<ArrowRight className="w-4 h-4" />}
          >
            Daftar Sekarang
          </Button>
        </div>

        <div className="pt-4 text-center border-t border-[var(--line)]">
          <p className="text-xs text-[var(--ink-2)]">
            Sudah memiliki akun?{' '}
            <Link
              to="/login"
              className="font-bold text-[var(--accent-strong)] hover:underline"
            >
              Masuk di sini
            </Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
}

export default RegisterPage;
