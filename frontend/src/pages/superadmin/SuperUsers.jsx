import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { superMenuItems } from './superMenu';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api';
import { formatDate } from '../../utils/format';
import { getErrorMessage } from '../../utils/errorMessage';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { PageHeader } from '../../components/layout/PageHeader';
import { Chip } from '../../components/ui/Chip';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Users, Search, Power, ShieldCheck, Edit2 } from 'lucide-react';

export function SuperUsers() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Edit Category Modal State
  const [editUser, setEditUser] = useState(null);
  const [newCategory, setNewCategory] = useState('umum');
  const [editLoading, setEditLoading] = useState(false);

  const fetchUsers = () => {
    setLoading(true);
    apiClient.superadmin.getUsers()
      .then((res) => {
        const items = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.users)
            ? res.data.users
            : Array.isArray(res.data?.data)
              ? res.data.data
              : [];
        setUsers(items);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (targetUser) => {
    try {
      await apiClient.superadmin.toggleUserStatus(targetUser.id);
      fetchUsers();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    if (!editUser) return;
    setEditLoading(true);

    try {
      await apiClient.superadmin.updateUserCategory(editUser.id, { category: newCategory });
      setEditUser(null);
      fetchUsers();
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setEditLoading(false);
    }
  };

  const safeUsers = Array.isArray(users) ? users : [];

  const filteredUsers = safeUsers.filter((u) => {
    const matchSearch = (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.whatsapp || '').includes(searchTerm);
    const matchCat = categoryFilter === 'all' || u.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const columns = [
    {
      header: 'PENGGUNA',
      accessor: 'name',
      render: (row) => (
        <div className="text-xs font-mono">
          <div className="font-bold text-[var(--text)]">{row.name || row.username}</div>
          <div className="text-slate-400">{row.email} • {row.whatsapp}</div>
        </div>
      ),
    },
    {
      header: 'KATEGORI',
      accessor: 'category',
      render: (row) => (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase bg-slate-100 text-slate-700">
          {row.category}
        </span>
      ),
    },
    {
      header: 'VERIFIKASI KTM/KTA',
      accessor: 'identity_verification_status',
      render: (row) => (
        <span className="text-[11px] font-mono uppercase text-slate-600">
          {row.identity_verification_status || 'unverified'}
        </span>
      ),
    },
    {
      header: 'STATUS AKUN',
      accessor: 'is_active',
      render: (row) => (
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase ${
          row.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
        }`}>
          {row.is_active ? 'AKTIF' : 'SUSPENDED'}
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
              setEditUser(row);
              setNewCategory(row.category || 'umum');
            }}
            title="Ubah Kategori"
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => handleToggleStatus(row)}
            title={row.is_active ? 'Suspend Pengguna' : 'Aktifkan Pengguna'}
            className={`p-1.5 rounded-lg border cursor-pointer ${
              row.is_active ? 'border-rose-200 text-rose-600 hover:bg-rose-50' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout
      role="superadmin"
      menuItems={superMenuItems}
      title="Semua Pengguna"
      user={user}
    >
      <PageHeader
        title="Manajemen Seluruh Pengguna"
        highlightWord="Pengguna"
        subtitle="Ubah kategori tarif akun pengguna (Umum, Mahasiswa, Karyawan) dan kelola status suspensi akun"
        breadcrumbs={[
          { label: 'BERANDA', path: '/' },
          { label: 'SUPER ADMIN', path: '/superadmin' },
          { label: 'PENGGUNA' }
        ]}
      />

      <div className="-mt-6 space-y-6">
        {/* Filters */}
        <div className="bg-[var(--surface)] p-4 sm:p-5 rounded-[20px] border border-[var(--line)] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="w-full sm:w-80">
            <Input
              placeholder="Cari nama, email, WA..."
              icon={Search}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="w-full sm:w-56">
            <Select
              options={[
                { value: 'all', label: 'Semua Kategori' },
                { value: 'mahasiswa', label: 'Mahasiswa' },
                { value: 'karyawan', label: 'Karyawan' },
                { value: 'umum', label: 'Umum' }
              ]}
              value={categoryFilter}
              onChange={(val) => setCategoryFilter(val)}
            />
          </div>
        </div>

        {/* Table View */}
        <Table
          columns={columns}
          data={filteredUsers}
          loading={loading}
          emptyMessage="Tidak ada data pengguna yang cocok."
        />
      </div>

      {/* Edit Category Modal */}
      {editUser && (
        <Modal
          isOpen={!!editUser}
          onClose={() => setEditUser(null)}
          title={`Ubah Kategori Pengguna: ${editUser.name || editUser.username}`}
        >
          <form onSubmit={handleUpdateCategory} className="space-y-4 font-mono text-xs">
            <div className="space-y-1">
              <label className="text-slate-500 uppercase font-semibold">Pilih Kategori Baru</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              >
                <option value="umum">Umum (Tarif Standar)</option>
                <option value="mahasiswa">Mahasiswa (Tarif Mahasiswa)</option>
                <option value="karyawan">Dosen / Karyawan (Tarif Karyawan)</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditUser(null)}
                className="py-2 px-4 rounded-xl border border-slate-200"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={editLoading}
                className="py-2 px-5 rounded-xl bg-[var(--text)] text-white font-bold uppercase"
              >
                {editLoading ? 'Menyimpan...' : 'Perbarui Kategori'}
              </button>
            </div>
          </form>
        </Modal>
      )}

    </DashboardLayout>
  );
}

export default SuperUsers;

