import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { superMenuItems } from './superMenu';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api';
import { formatDate } from '../../utils/format';
import { getErrorMessage } from '../../utils/errorMessage';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { 
  UserPlus, KeyRound, Power, ShieldAlert, 
  ShieldCheck, RefreshCw, CheckCircle2, User 
} from 'lucide-react';

export function SuperAdmins() {
  const { user } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create Admin Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    role: 'admin',
  });
  const [createLoading, setCreateLoading] = useState(false);

  // Reset Password State
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const fetchAdmins = () => {
    setLoading(true);
    apiClient.superadmin.getAdmins()
      .then((res) => {
        const items = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.admins)
            ? res.data.admins
            : Array.isArray(res.data?.data)
              ? res.data.data
              : [];
        setAdmins(items);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleGeneratePassword = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%';
    let pwd = '';
    for (let i = 0; i < 12; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setForm({ ...form, password: pwd });
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateLoading(true);

    try {
      await apiClient.superadmin.createAdmin(form);
      setCreateModalOpen(false);
      setForm({ name: '', username: '', email: '', password: '', role: 'admin' });
      fetchAdmins();
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setCreateLoading(false);
    }
  };

  const handleToggleStatus = async (targetAdmin) => {
    if (targetAdmin.id === user.id) {
      alert('Anda tidak dapat menonaktifkan akun Anda sendiri!');
      return;
    }

    try {
      await apiClient.superadmin.toggleAdminStatus(targetAdmin.id);
      fetchAdmins();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAdmin || !newPassword) return;
    setResetLoading(true);

    try {
      await apiClient.superadmin.resetPassword(selectedAdmin.id, { newPassword });
      setResetModalOpen(false);
      setNewPassword('');
      alert(`Password untuk ${selectedAdmin.username} berhasil direset.`);
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setResetLoading(false);
    }
  };

  const columns = [
    {
      header: 'ADMIN',
      accessor: 'name',
      render: (row) => (
        <div className="text-xs font-mono">
          <div className="font-bold text-[var(--text)]">{row.name || row.username}</div>
          <div className="text-slate-400">{row.email}</div>
        </div>
      ),
    },
    {
      header: 'USERNAME',
      accessor: 'username',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-slate-700">@{row.username}</span>
      ),
    },
    {
      header: 'PERAN / ROLE',
      accessor: 'role',
      render: (row) => (
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase ${
          row.role === 'superadmin' ? 'bg-purple-100 text-purple-800' : 'bg-emerald-100 text-emerald-800'
        }`}>
          {row.role}
        </span>
      ),
    },
    {
      header: 'STATUS',
      accessor: 'is_active',
      render: (row) => (
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase ${
          row.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
        }`}>
          {row.is_active ? 'AKTIF' : 'NONAKTIF'}
        </span>
      ),
    },
    {
      header: 'AKSI',
      accessor: 'id',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSelectedAdmin(row);
              setResetModalOpen(true);
            }}
            title="Reset Password"
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5" />
          </button>

          {row.id !== user.id && (
            <button
              onClick={() => handleToggleStatus(row)}
              title={row.is_active ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
              className={`p-1.5 rounded-lg border cursor-pointer ${
                row.is_active ? 'border-amber-200 text-amber-600 hover:bg-amber-50' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout
      role="superadmin"
      menuItems={superMenuItems}
      title="Kelola Administrator"
      user={user}
    >
      <PageHeader
        title="Manajemen Akun Administrator"
        highlightWord="Administrator"
        subtitle="Tambah admin pengelola baru, atur status keaktifan akses, dan reset kata sandi"
        breadcrumbs={[
          { label: 'BERANDA', path: '/' },
          { label: 'SUPER ADMIN', path: '/superadmin' },
          { label: 'ADMINISTRATOR' }
        ]}
        actions={
          <Button
            variant="accent"
            size="md"
            icon={<UserPlus className="w-4 h-4" />}
            onClick={() => {
              setForm({ name: '', username: '', email: '', password: '', role: 'admin' });
              setCreateModalOpen(true);
            }}
          >
            Tambah Admin Baru
          </Button>
        }
      />

      <div className="-mt-6 space-y-6">
        {/* Table View */}
        <Table
          columns={columns}
          data={admins}
          loading={loading}
          emptyMessage="Tidak ada data akun administrator."
        />
      </div>

      {/* Create Admin Modal */}
      {createModalOpen && (
        <Modal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          title="Tambah Akun Pengelola / Admin Baru"
        >
          <form onSubmit={handleCreateSubmit} className="space-y-4 font-mono text-xs">
            <div className="space-y-1">
              <label className="text-slate-500 uppercase font-semibold">Nama Lengkap</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nama admin baru"
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-slate-500 uppercase font-semibold">Username</label>
                <input
                  type="text"
                  required
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  placeholder="admin.upt"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 uppercase font-semibold">Peran Akses</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                >
                  <option value="admin">Admin Operasional</option>
                  <option value="superadmin">Super Administrator</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-slate-500 uppercase font-semibold">Email Polinela</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="admin@polinela.ac.id"
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-slate-500 uppercase font-semibold">Kata Sandi Awal</label>
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="text-[10px] text-[var(--accent-strong)] font-bold hover:underline"
                >
                  Generate Acak
                </button>
              </div>
              <input
                type="text"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Password minimal 8 karakter"
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="py-2 px-4 rounded-xl border border-slate-200"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={createLoading}
                className="py-2 px-5 rounded-xl bg-[var(--text)] text-white font-bold uppercase"
              >
                {createLoading ? 'Menyimpan...' : 'Buat Akun'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Reset Password Modal */}
      {resetModalOpen && selectedAdmin && (
        <Modal
          isOpen={resetModalOpen}
          onClose={() => setResetModalOpen(false)}
          title={`Reset Kata Sandi: ${selectedAdmin.username}`}
        >
          <form onSubmit={handleResetSubmit} className="space-y-4 font-mono text-xs">
            <p className="text-slate-600">
              Masukkan kata sandi baru untuk akun administrator ini.
            </p>
            <div className="space-y-1">
              <label className="text-slate-500 uppercase font-semibold">Kata Sandi Baru</label>
              <input
                type="text"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimal 8 karakter"
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setResetModalOpen(false)}
                className="py-2 px-4 rounded-xl border border-slate-200"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={resetLoading}
                className="py-2 px-5 rounded-xl bg-[var(--text)] text-white font-bold uppercase"
              >
                {resetLoading ? 'Menyimpan...' : 'Reset Sandi'}
              </button>
            </div>
          </form>
        </Modal>
      )}

    </DashboardLayout>
  );
}

export default SuperAdmins;

