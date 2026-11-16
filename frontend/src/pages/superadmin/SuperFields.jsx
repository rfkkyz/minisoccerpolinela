import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { superMenuItems } from './superMenu';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api';
import { formatRupiah } from '../../utils/format';
import { getErrorMessage } from '../../utils/errorMessage';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { PageHeader } from '../../components/layout/PageHeader';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Edit2, ShieldCheck, CheckCircle2 } from 'lucide-react';

export function SuperFields() {
  const { user } = useAuth();
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit Tariff Modal State
  const [selectedField, setSelectedField] = useState(null);
  const [form, setForm] = useState({
    name: '',
    price_umum: 150000,
    price_mahasiswa: 100000,
    price_karyawan: 120000,
    status: 'active',
  });
  const [saveLoading, setSaveLoading] = useState(false);

  const fetchFields = () => {
    setLoading(true);
    apiClient.superadmin.getFields()
      .then((res) => {
        const items = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.fields)
            ? res.data.fields
            : Array.isArray(res.data?.data)
              ? res.data.data
              : [];
        setFields(items);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchFields();
  }, []);

  const handleOpenEdit = (field) => {
    setSelectedField(field);
    setForm({
      name: field.name,
      price_umum: field.price_umum || field.prices?.umum || 150000,
      price_mahasiswa: field.price_mahasiswa || field.prices?.mahasiswa || 100000,
      price_karyawan: field.price_karyawan || field.prices?.karyawan || 120000,
      status: field.status || 'active',
    });
  };

  const handleSaveTariff = async (e) => {
    e.preventDefault();
    if (!selectedField) return;
    setSaveLoading(true);

    try {
      await apiClient.superadmin.updateFieldTariff(selectedField.id, {
        name: form.name,
        price_umum: Number(form.price_umum),
        price_mahasiswa: Number(form.price_mahasiswa),
        price_karyawan: Number(form.price_karyawan),
        status: form.status,
      });
      setSelectedField(null);
      fetchFields();
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setSaveLoading(false);
    }
  };

  const columns = [
    {
      header: 'NAMA ARENA',
      accessor: 'name',
      render: (row) => (
        <span className="font-mono font-bold text-xs text-[var(--ink)]">{row.name}</span>
      ),
    },
    {
      header: 'TARIF UMUM / JAM',
      accessor: 'price_umum',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-slate-800">
          {formatRupiah(row.price_umum || row.prices?.umum || 150000)}
        </span>
      ),
    },
    {
      header: 'TARIF MAHASISWA / JAM',
      accessor: 'price_mahasiswa',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-[var(--accent-strong)]">
          {formatRupiah(row.price_mahasiswa || row.prices?.mahasiswa || 100000)}
        </span>
      ),
    },
    {
      header: 'TARIF KARYAWAN / JAM',
      accessor: 'price_karyawan',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-emerald-700">
          {formatRupiah(row.price_karyawan || row.prices?.karyawan || 120000)}
        </span>
      ),
    },
    {
      header: 'STATUS',
      accessor: 'status',
      render: (row) => (
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase ${
          row.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
        }`}>
          {row.status}
        </span>
      ),
    },
    {
      header: 'AKSI',
      accessor: 'id',
      render: (row) => (
        <button
          onClick={() => handleOpenEdit(row)}
          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
          aria-label="Ubah Tarif"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
      ),
    },
  ];

  return (
    <DashboardLayout
      role="superadmin"
      menuItems={superMenuItems}
      title="Lapangan & Kebijakan Tarif"
      user={user}
    >
      <PageHeader
        title="Pengaturan Lapangan & Skema Tarif"
        highlightWord="Tarif"
        subtitle="Kelola 3 tingkat tarif tetap per jam (Umum, Mahasiswa, Karyawan) dan status operasional lapangan"
        breadcrumbs={[
          { label: 'BERANDA', path: '/' },
          { label: 'SUPER ADMIN', path: '/superadmin' },
          { label: 'LAPANGAN & TARIF' }
        ]}
      />

      <div className="-mt-6 space-y-6">
        {/* Table View */}
        <Table
          columns={columns}
          data={fields}
          loading={loading}
          emptyMessage="Tidak ada data lapangan."
        />
      </div>

      {/* Edit Tariff Modal */}
      {selectedField && (
        <Modal
          isOpen={!!selectedField}
          onClose={() => setSelectedField(null)}
          title={`Ubah Tarif: ${selectedField.name}`}
        >
          <form onSubmit={handleSaveTariff} className="space-y-4 font-mono text-xs">
            <div className="space-y-1">
              <label className="text-slate-500 uppercase font-semibold">Nama Lapangan</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-500 uppercase font-semibold">Tarif Umum per Jam (Rp)</label>
              <input
                type="number"
                required
                min={0}
                step={5000}
                value={form.price_umum}
                onChange={(e) => setForm({ ...form, price_umum: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-slate-500 uppercase font-semibold">Tarif Mahasiswa per Jam (Rp)</label>
                <input
                  type="number"
                  required
                  min={0}
                  step={5000}
                  value={form.price_mahasiswa}
                  onChange={(e) => setForm({ ...form, price_mahasiswa: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 uppercase font-semibold">Tarif Karyawan per Jam (Rp)</label>
                <input
                  type="number"
                  required
                  min={0}
                  step={5000}
                  value={form.price_karyawan}
                  onChange={(e) => setForm({ ...form, price_karyawan: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
            </div>

            {/* Live Preview Card */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Preview Tarif Jam:</span>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-lg bg-white border border-slate-200">
                  <div className="text-[10px] text-slate-500">Umum</div>
                  <div className="font-bold text-xs">{formatRupiah(form.price_umum)}</div>
                </div>
                <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-[var(--accent-strong)]">
                  <div className="text-[10px]">Mahasiswa</div>
                  <div className="font-bold text-xs">{formatRupiah(form.price_mahasiswa)}</div>
                </div>
                <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700">
                  <div className="text-[10px]">Karyawan</div>
                  <div className="font-bold text-xs">{formatRupiah(form.price_karyawan)}</div>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-slate-500 uppercase font-semibold">Status Lapangan</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              >
                <option value="active">Active (Siap Disewa)</option>
                <option value="maintenance">Maintenance (Perawatan Rutin)</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedField(null)}
                className="py-2 px-4 rounded-xl border border-slate-200 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saveLoading}
                className="py-2 px-5 rounded-xl bg-[var(--text)] hover:bg-black text-white font-bold uppercase cursor-pointer"
              >
                {saveLoading ? 'Menyimpan...' : 'Simpan Tarif'}
              </button>
            </div>
          </form>
        </Modal>
      )}

    </DashboardLayout>
  );
}

export default SuperFields;
