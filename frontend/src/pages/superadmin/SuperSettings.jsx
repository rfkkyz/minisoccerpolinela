import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { PageHeader } from '../../components/layout/PageHeader';
import { superMenuItems } from './superMenu';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api';
import { getErrorMessage } from '../../utils/errorMessage';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Settings, Save, CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react';

export function SuperSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    admin_whatsapp: '6282188997766',
    bank_name: 'BANK SYARIAH INDONESIA (BSI)',
    bank_account_number: '7144-8899-0011',
    bank_account_holder: 'BPU POLITEKNIK NEGERI LAMPUNG',
    lock_duration_minutes: '5',
    hold_duration_minutes: '60',
    cancel_min_hours_before: '24',
    operating_hours_start: '6',
    operating_hours_end: '23',
    system_maintenance_mode: '0',
    app_name: 'POLISOCCER POLINELA',
  });
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    setLoading(true);
    apiClient.superadmin.getSettings()
      .then((res) => {
        if (res.data) {
          const d = res.data;
          setSettings((prev) => ({
            ...prev,
            ...d,
            // Map uppercase backend keys to form fields
            admin_whatsapp: d.ADMIN_WHATSAPP || d.admin_whatsapp || prev.admin_whatsapp,
            bank_name: d.BANK_NAME || d.bank_name || prev.bank_name,
            bank_account_number: d.BANK_ACCOUNT_NO || d.bank_account_number || prev.bank_account_number,
            bank_account_holder: d.BANK_ACCOUNT_NAME || d.bank_account_holder || prev.bank_account_holder,
            lock_duration_minutes: d.LOCK_MINUTES || d.lock_duration_minutes || prev.lock_duration_minutes,
            hold_duration_minutes: d.HOLD_MINUTES || d.hold_duration_minutes || prev.hold_duration_minutes,
            cancel_min_hours_before: d.CANCEL_BEFORE_HOURS || d.cancel_min_hours_before || prev.cancel_min_hours_before,
            operating_hours_start: d.OPEN_HOUR || d.operating_hours_start || prev.operating_hours_start,
            operating_hours_end: d.CLOSE_HOUR || d.operating_hours_end || prev.operating_hours_end,
          }));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (key, val) => {
    setSettings(prev => ({ ...prev, [key]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');
    setSaveLoading(true);

    try {
      // Map form fields to backend uppercase config keys + keep lowercase
      const payload = {
        ...settings,
        ADMIN_WHATSAPP: settings.admin_whatsapp,
        BANK_NAME: settings.bank_name,
        BANK_ACCOUNT_NO: settings.bank_account_number,
        BANK_ACCOUNT_NAME: settings.bank_account_holder,
        LOCK_MINUTES: settings.lock_duration_minutes,
        HOLD_MINUTES: settings.hold_duration_minutes,
        CANCEL_BEFORE_HOURS: settings.cancel_min_hours_before,
        OPEN_HOUR: settings.operating_hours_start,
        CLOSE_HOUR: settings.operating_hours_end,
      };
      await apiClient.superadmin.updateSettings(payload);
      setSuccessMsg('Konfigurasi sistem berhasil disimpan dan sinkron dengan mesin booking.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <DashboardLayout
      role="superadmin"
      menuItems={superMenuItems}
    >
      <PageHeader
        title="Konfigurasi Parameter Sistem"
        highlightWord="Parameter"
        subtitle="Atur durasi lock slot atomik, rekening pembayaran resmi, dan jam operasional lapangan"
        breadcrumbs={[
          { label: 'BERANDA', path: '/' },
          { label: 'SUPER ADMIN', path: '/superadmin' },
          { label: 'PENGATURAN' }
        ]}
      />

      <div className="-mt-6 space-y-6 max-w-4xl">
        {successMsg && (
          <div className="p-3.5 rounded-[12px] bg-emerald-50 border border-emerald-200 text-[var(--accent-strong)] text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3.5 rounded-[12px] bg-rose-50 border border-rose-200 text-[var(--danger)] text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. Rekening Bank & Kontak BPU */}
          <div className="bg-[var(--surface)] p-6 sm:p-8 rounded-[24px] border border-[var(--line)] shadow-sm space-y-4">
            <div className="border-b border-[var(--line)] pb-3">
              <h3 className="font-sans font-bold text-base text-[var(--ink)]">
                Rekening Pembayaran & Kontak Resmi
              </h3>
              <p className="text-xs text-[var(--ink-2)] mt-0.5">
                Rekening resmi tujuan transfer DP / pelunasan yang tampil pada halaman reservasi pengguna.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Nama Bank"
                value={settings.bank_name}
                onChange={(e) => handleChange('bank_name', e.target.value)}
                required
              />

              <Input
                label="Nomor Rekening"
                value={settings.bank_account_number}
                onChange={(e) => handleChange('bank_account_number', e.target.value)}
                required
              />

              <Input
                label="Nama Pemilik Rekening"
                value={settings.bank_account_holder}
                onChange={(e) => handleChange('bank_account_holder', e.target.value)}
                required
              />

              <Input
                label="Nomor WhatsApp Admin BPU"
                value={settings.admin_whatsapp}
                onChange={(e) => handleChange('admin_whatsapp', e.target.value)}
                required
              />
            </div>
          </div>

          {/* 2. Parameter Waktu & Operasional */}
          <div className="bg-[var(--surface)] p-6 sm:p-8 rounded-[24px] border border-[var(--line)] shadow-sm space-y-4">
            <div className="border-b border-[var(--line)] pb-3">
              <h3 className="font-sans font-bold text-base text-[var(--ink)]">
                Parameter Jadwal & Durasi Kunci (Atomik)
              </h3>
              <p className="text-xs text-[var(--ink-2)] mt-0.5">
                Konfigurasi durasi penahanan slot saat user berada di tahap pembayaran.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Durasi Lock Slot (Menit)"
                type="number"
                value={settings.lock_duration_minutes}
                onChange={(e) => handleChange('lock_duration_minutes', e.target.value)}
                required
              />

              <Input
                label="Batas Bayar Hold (Menit)"
                type="number"
                value={settings.hold_duration_minutes}
                onChange={(e) => handleChange('hold_duration_minutes', e.target.value)}
                required
              />

              <Input
                label="Min. Batalkan Sebelum (Jam)"
                type="number"
                value={settings.cancel_min_hours_before}
                onChange={(e) => handleChange('cancel_min_hours_before', e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <Input
                label="Jam Buka Operasional (06:00)"
                type="number"
                min={0}
                max={23}
                value={settings.operating_hours_start}
                onChange={(e) => handleChange('operating_hours_start', e.target.value)}
                required
              />

              <Input
                label="Jam Tutup Operasional (23:00)"
                type="number"
                min={1}
                max={24}
                value={settings.operating_hours_end}
                onChange={(e) => handleChange('operating_hours_end', e.target.value)}
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="accent"
              size="lg"
              loading={saveLoading}
              icon={<Save className="w-4 h-4" />}
            >
              Simpan Pengaturan Sistem
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

export default SuperSettings;
