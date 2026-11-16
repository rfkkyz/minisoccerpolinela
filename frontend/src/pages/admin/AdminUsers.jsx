import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { adminMenuItems } from './adminMenu';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api';
import { formatDate } from '../../utils/format';
import { getErrorMessage } from '../../utils/errorMessage';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { PageHeader } from '../../components/layout/PageHeader';
import { Chip } from '../../components/ui/Chip';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { 
  Users, Search, ShieldCheck, ShieldAlert, 
  CheckCircle2, XCircle, Eye 
} from 'lucide-react';

export function AdminUsers() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Review Identity Modal State
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = () => {
    setLoading(true);
    apiClient.admin.getUsers()
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

  const handleVerifyIdentity = async (verified) => {
    if (!selectedUser) return;
    setActionLoading(true);

    try {
      await apiClient.admin.verifyUserIdentity(selectedUser.id, {
        status: verified ? 'verified' : 'rejected'
      });
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setActionLoading(false);
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
      header: 'STATUS VERIFIKASI IDENTITAS',
      accessor: 'identity_verification_status',
      render: (row) => {
        const status = row.identity_verification_status || 'unverified';
        if (row.category === 'umum') {
          return <span className="text-[11px] font-mono text-slate-400">Tidak Perlu (Umum)</span>;
        }
        return (
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase ${
            status === 'verified'
              ? 'bg-emerald-100 text-emerald-800'
              : status === 'rejected'
              ? 'bg-rose-100 text-rose-800'
              : 'bg-amber-100 text-amber-800'
          }`}>
            {status}
          </span>
        );
      },
    },
    {
      header: 'TERDAFTAR',
      accessor: 'created_at',
      render: (row) => (
        <span className="text-xs font-mono text-slate-400">{formatDate(row.created_at)}</span>
      ),
    },
    {
      header: 'AKSI',
      accessor: 'id',
      render: (row) => (
        row.category !== 'umum' && (
          <button
            onClick={() => setSelectedUser(row)}
            className="px-3 py-1.5 rounded-lg bg-[var(--text)] hover:bg-black text-white font-mono text-[11px] font-bold uppercase cursor-pointer"
          >
            Review KTM
          </button>
        )
      ),
    },
  ];

  return (
    <DashboardLayout
      role={user?.role === 'superadmin' ? 'superadmin' : 'admin'}
      menuItems={adminMenuItems}
      title="Verifikasi Pengguna"
      user={user}
    >
      <PageHeader
        title="Verifikasi Pengguna & Sivitas"
        highlightWord="Verifikasi"
        subtitle="Validasi keaslian Kartu Tanda Mahasiswa (KTM) dan Kartu Pegawai untuk hak tarif resmi Polinela"
        breadcrumbs={[
          { label: 'BERANDA', path: '/' },
          { label: 'ADMINISTRATOR', path: '/admin' },
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
          emptyMessage="Tidak ada pengguna yang sesuai."
        />

      </div>

      {/* Review Identity Document Modal */}
      {selectedUser && (
        <Modal
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          title={`Review Dokumen: ${selectedUser.name || selectedUser.username}`}
        >
          <div className="space-y-4 font-mono text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div>Kategori: <strong className="uppercase text-[var(--accent-strong)]">{selectedUser.category}</strong></div>
              <div>Nomor Identitas: <strong>{selectedUser.identity_number || '-'}</strong></div>
            </div>

            <div className="space-y-1.5">
              <span className="text-slate-500 uppercase font-semibold block">FOTO KARTU IDENTITAS:</span>
              <div className="rounded-2xl overflow-hidden bg-slate-900 border border-slate-200">
                <img
                  src={`http://localhost:5000/api/admin/files/${selectedUser.identity_card_path}`}
                  alt="KTM/KTA"
                  className="w-full max-h-72 object-contain"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://placehold.co/600x400?text=Dokumen+Identitas';
                  }}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => handleVerifyIdentity(false)}
                disabled={actionLoading}
                className="flex-1 py-2.5 px-4 rounded-xl border border-rose-300 text-rose-600 hover:bg-rose-50 font-bold uppercase cursor-pointer"
              >
                Tolak Identitas
              </button>
              <button
                onClick={() => handleVerifyIdentity(true)}
                disabled={actionLoading}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase cursor-pointer"
              >
                Setujui Identitas
              </button>
            </div>
          </div>
        </Modal>
      )}

    </DashboardLayout>
  );
}

export default AdminUsers;

