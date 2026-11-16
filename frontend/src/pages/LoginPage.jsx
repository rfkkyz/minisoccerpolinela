import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../utils/errorMessage';
import { Mail, Lock, Eye, EyeOff, ArrowRight, KeyRound, Sparkles } from 'lucide-react';
import { AuthLayout } from '../components/layout/AuthLayout';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const queryParams = new URLSearchParams(location.search);
  const redirectUrl = queryParams.get('redirect') || null;

  const demoAccounts = [
    { label: 'Mahasiswa', email: 'mahasiswa@polinela.ac.id', pass: 'User12345' },
    { label: 'Karyawan', email: 'karyawan@polinela.ac.id', pass: 'User12345' },
    { label: 'Admin', email: 'admin@polinela.ac.id', pass: 'admin123' },
    { label: 'Superadmin', email: 'superadmin@polinela.ac.id', pass: 'superadmin123' },
  ];

  const handleQuickFill = (acc) => {
    setIdentifier(acc.email);
    setPassword(acc.pass);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login({
        emailOrUsername: identifier,
        password,
      });

      const user = res?.user || res?.data?.user;
      const userRole = user?.role;

      // Validate redirectUrl to avoid landing on 404
      const isValidRedirect = redirectUrl && 
        redirectUrl.startsWith('/') && 
        !redirectUrl.startsWith('/login') && 
        !redirectUrl.startsWith('/daftar') &&
        redirectUrl !== '/undefined' &&
        redirectUrl !== '/null';

      if (isValidRedirect) {
        navigate(redirectUrl);
      } else if (userRole === 'superadmin') {
        navigate('/superadmin');
      } else if (userRole === 'admin') {
        navigate('/admin');
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
      title="Masuk ke Akun"
      subtitle="Gunakan email atau username terdaftar Anda"
      badge="PORTAL MASUK"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3.5 rounded-[12px] bg-rose-50 border border-rose-200 text-[var(--danger)] text-xs font-medium flex items-start gap-2">
            <span className="text-sm leading-none shrink-0">⚠</span>
            <span>{error}</span>
          </div>
        )}

        {/* Quick Fill Demo Accounts */}
        <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-500/20 space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#0A803E] uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-[#12A150]" />
            <span>Pilih Akun Cepat (Uji Coba):</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {demoAccounts.map((acc) => (
              <button
                key={acc.label}
                type="button"
                onClick={() => handleQuickFill(acc)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border text-center truncate ${
                  identifier === acc.email
                    ? 'bg-[#12A150] text-white border-[#12A150] shadow-xs'
                    : 'bg-white hover:bg-emerald-100/60 text-[#0E2A20] border-emerald-200/80'
                }`}
              >
                {acc.label}
              </button>
            ))}
          </div>
        </div>

        <Input
          label="Email atau Username"
          type="text"
          required
          placeholder="Contoh: mahasiswa@polinela.ac.id"
          icon={Mail}
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
        />

        <Input
          label="Kata Sandi"
          type={showPassword ? 'text' : 'password'}
          required
          placeholder="••••••••"
          icon={Lock}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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

        <div className="pt-2">
          <Button
            type="submit"
            variant="accent"
            size="lg"
            block
            loading={loading}
            iconRight={<ArrowRight className="w-4 h-4" />}
          >
            Masuk Sekarang
          </Button>
        </div>

        <div className="pt-4 text-center border-t border-[var(--line)]">
          <p className="text-xs text-[var(--ink-2)]">
            Belum memiliki akun?{' '}
            <Link
              to="/daftar"
              className="font-bold text-[var(--accent-strong)] hover:underline"
            >
              Daftar di sini
            </Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
}
