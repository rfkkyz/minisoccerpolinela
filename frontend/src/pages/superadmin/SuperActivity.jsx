import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { superMenuItems } from './superMenu';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api';
import { formatDate } from '../../utils/format';
import { Table } from '../../components/ui/Table';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { FileText, Download, Search, Filter } from 'lucide-react';

export function SuperActivity() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  useEffect(() => {
    setLoading(true);
    apiClient.superadmin.getActivityLogs()
      .then((res) => {
        const items = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.activities)
            ? res.data.activities
            : Array.isArray(res.data?.data)
              ? res.data.data
              : [];
        setLogs(items);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const safeLogs = Array.isArray(logs) ? logs : [];

  const filteredLogs = safeLogs.filter((l) => {
    const matchSearch = (l.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.user_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.action || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.ip_address || '').includes(searchTerm);
    const matchAction = actionFilter === 'all' || l.action === actionFilter;
    return matchSearch && matchAction;
  });

  const exportCSV = () => {
    const headers = ['Waktu', 'Aksi', 'Tipe Entitas', 'Deskripsi', 'IP Address'];
    const rows = filteredLogs.map(l => [
      l.created_at,
      l.action,
      l.entity_type || '-',
      `"${(l.description || '').replace(/"/g, '""')}"`,
      l.ip_address || '-'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Audit_Log_Polisoccer_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns = [
    {
      header: 'WAKTU',
      accessor: 'created_at',
      render: (row) => (
        <span className="font-mono text-xs text-slate-500">{formatDate(row.created_at)}</span>
      ),
    },
    {
      header: 'AKSI',
      accessor: 'action',
      render: (row) => (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase bg-slate-900 text-[var(--accent)]">
          {row.action}
        </span>
      ),
    },
    {
      header: 'ENTITAS',
      accessor: 'entity_type',
      render: (row) => (
        <span className="text-xs font-mono uppercase text-slate-600">
          {row.entity_type || '-'}
        </span>
      ),
    },
    {
      header: 'DESKRIPSI TINDAKAN',
      accessor: 'description',
      render: (row) => (
        <span className="text-xs font-mono text-[var(--text)]">{row.description || '-'}</span>
      ),
    },
    {
      header: 'IP ADDRESS',
      accessor: 'ip_address',
      render: (row) => (
        <span className="text-[11px] font-mono text-slate-400">{row.ip_address || '127.0.0.1'}</span>
      ),
    },
  ];

  return (
    <DashboardLayout
      role="superadmin"
      menuItems={superMenuItems}
      title="Log Audit & Aktivitas"
      user={user}
    >
      <PageHeader
        title="Jejak Audit Aktivitas Server"
        highlightWord="Audit"
        subtitle="Rekam jejak seluruh aksi penting, perubahan harga sewa, dan persetujuan bayar (append-only)"
        breadcrumbs={[
          { label: 'BERANDA', path: '/' },
          { label: 'SUPER ADMIN', path: '/superadmin' },
          { label: 'LOG AUDIT' }
        ]}
        actions={
          <Button
            variant="secondary"
            size="md"
            icon={<Download className="w-4 h-4" />}
            onClick={exportCSV}
            disabled={filteredLogs.length === 0}
          >
            Ekspor Audit CSV
          </Button>
        }
      />

      <div className="-mt-6 space-y-6">
        {/* Filters */}
        <div className="bg-[var(--surface)] p-4 sm:p-5 rounded-[20px] border border-[var(--line)] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="w-full sm:w-80">
            <Input
              placeholder="Cari dalam log aktivitas..."
              icon={Search}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="w-full sm:w-56">
            <Select
              options={[
                { value: 'all', label: 'Semua Jenis Aksi' },
                { value: 'LOGIN', label: 'LOGIN' },
                { value: 'RESERVE', label: 'RESERVE' },
                { value: 'CONFIRM_DP', label: 'CONFIRM_DP' },
                { value: 'CONFIRM_PAYMENT', label: 'CONFIRM_PAYMENT' },
                { value: 'CANCEL', label: 'CANCEL' },
                { value: 'BLOCK_SLOT', label: 'BLOCK_SLOT' },
                { value: 'UPDATE_TARIFF', label: 'UPDATE_TARIFF' }
              ]}
              value={actionFilter}
              onChange={(val) => setActionFilter(val)}
            />
          </div>
        </div>

        {/* Table View */}
        <Table
          columns={columns}
          data={filteredLogs}
          loading={loading}
          emptyMessage="Tidak ada catatan aktivitas audit yang sesuai."
        />

      </div>
    </DashboardLayout>
  );
}

export default SuperActivity;

