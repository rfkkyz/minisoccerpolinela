import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { adminMenuItems } from './adminMenu';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api';
import { formatDate, formatHourRange } from '../../utils/format';
import { getErrorMessage } from '../../utils/errorMessage';
import { Modal } from '../../components/ui/Modal';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { 
  Calendar, ShieldAlert, PlusCircle, Unlock, 
  ChevronLeft, ChevronRight, Lock, CheckCircle2 
} from 'lucide-react';

export function AdminSchedule() {
  const { user } = useAuth();
  const [fields, setFields] = useState([]);
  const [selectedFieldId, setSelectedFieldId] = useState(1);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = useState([]);
  const [blockedSlots, setBlockedSlots] = useState([]);
  const [loading, setLoading] = useState(true);

  // Block Modal State
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [blockForm, setBlockForm] = useState({
    start_hour: 8,
    end_hour: 12,
    reason: 'Turnamen Dies Natalis Polinela',
  });
  const [blockLoading, setBlockLoading] = useState(false);

  const fetchSchedule = () => {
    setLoading(true);
    Promise.all([
      apiClient.public.fields(),
      apiClient.admin.getSchedule(selectedFieldId),
      apiClient.admin.getBlockedSlots(selectedFieldId)
    ])
      .then(([fieldsRes, scheduleRes, blockedRes]) => {
        if (fieldsRes?.data) {
          const fList = Array.isArray(fieldsRes.data) ? fieldsRes.data : Array.isArray(fieldsRes.data?.fields) ? fieldsRes.data.fields : [];
          setFields(fList);
        }
        if (scheduleRes?.data) {
          const sList = Array.isArray(scheduleRes.data?.slots) ? scheduleRes.data.slots : Array.isArray(scheduleRes.data) ? scheduleRes.data : [];
          setSlots(sList);
        }
        if (blockedRes?.data) {
          const bList = Array.isArray(blockedRes.data) ? blockedRes.data : Array.isArray(blockedRes.data?.blocked_slots) ? blockedRes.data.blocked_slots : [];
          setBlockedSlots(bList);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSchedule();
  }, [selectedFieldId, selectedDate]);

  const handleBlockSubmit = async (e) => {
    e.preventDefault();
    setBlockLoading(true);

    try {
      await apiClient.admin.blockSlot({
        field_id: selectedFieldId,
        date: selectedDate,
        start_hour: Number(blockForm.start_hour),
        end_hour: Number(blockForm.end_hour),
        reason: blockForm.reason
      });
      setBlockModalOpen(false);
      fetchSchedule();
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setBlockLoading(false);
    }
  };

  const handleUnblock = async (blockedId) => {
    if (!window.confirm('Buka kunci slot yang diblokir ini?')) return;
    try {
      await apiClient.admin.unblockSlot(blockedId);
      fetchSchedule();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  return (
    <DashboardLayout
      role={user?.role === 'superadmin' ? 'superadmin' : 'admin'}
      menuItems={adminMenuItems}
      title="Jadwal & Blokir Slot"
      user={user}
    >
      <PageHeader
        title="Pengaturan Jadwal & Blokir Slot"
        highlightWord="Jadwal"
        subtitle="Kelola jam operasional harian, agenda khusus kampus Polinela, dan jadwal pemeliharaan rumput"
        breadcrumbs={[
          { label: 'BERANDA', path: '/' },
          { label: 'ADMINISTRATOR', path: '/admin' },
          { label: 'JADWAL & BLOKIR' }
        ]}
        actions={
          <Button
            variant="accent"
            size="md"
            icon={<ShieldAlert className="w-4 h-4" />}
            onClick={() => setBlockModalOpen(true)}
          >
            Blokir Slot Internal
          </Button>
        }
      />

      <div className="-mt-6 space-y-6">

        {/* Field & Date Control Bar */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {fields.map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedFieldId(f.id)}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase transition-colors cursor-pointer ${
                  selectedFieldId === f.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-500 uppercase">TANGGAL:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-mono"
            />
          </div>
        </div>

        {/* Blocked Slots Active on This Day */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="text-sm font-mono uppercase font-bold text-slate-700 flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-600" />
            <span>DAFTAR SLOT TERBLOKIR (INTERNAL KAMPUS / MAINTENANCE)</span>
          </h3>

          {blockedSlots.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {blockedSlots.map((b) => (
                <div key={b.id} className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between font-mono text-xs">
                  <div>
                    <div className="font-bold text-amber-900">{b.reason || 'Kegiatan Internal Kampus'}</div>
                    <div className="text-[11px] text-amber-700 mt-0.5">
                      {formatDate(b.date || selectedDate)}, Jam {String(b.start_hour).padStart(2, '0')}:00 - {String(b.end_hour).padStart(2, '0')}:00 WIB
                    </div>
                  </div>

                  <button
                    onClick={() => handleUnblock(b.id)}
                    className="py-1.5 px-3 rounded-xl bg-white border border-amber-300 text-amber-800 hover:bg-amber-100 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Buka Blokir</span>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-xs font-mono text-slate-400">
              Tidak ada jam yang diblokir untuk tanggal ini.
            </div>
          )}
        </div>

        {/* Hourly Matrix for Day */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="text-sm font-mono uppercase font-bold text-slate-700">
            KETERSEDIAAN SLOT (06:00 - 24:00 WIB)
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 font-mono text-xs">
            {Array.from({ length: 18 }, (_, i) => i + 6).map((hr) => {
              const safeSlots = Array.isArray(slots) ? slots : [];
              const slot = safeSlots.find(s => s.hour === hr);
              const status = slot?.status || 'available';

              let color = 'bg-emerald-50 border-emerald-200 text-emerald-800';
              let label = 'Tersedia';

              if (status === 'booked' || status === 'fully_paid') {
                color = 'bg-rose-50 border-rose-200 text-rose-800';
                label = 'Terisi';
              } else if (status === 'dp_paid_50') {
                color = 'bg-blue-50 border-blue-200 text-blue-800';
                label = 'DP 50%';
              } else if (status === 'pending_hold') {
                color = 'bg-amber-50 border-amber-200 text-amber-800';
                label = 'Dalam Proses';
              } else if (status === 'blocked') {
                color = 'bg-slate-200 border-slate-300 text-slate-700';
                label = 'Diblokir';
              }

              return (
                <div key={hr} className={`p-3 rounded-2xl border ${color} text-center`}>
                  <div className="font-bold text-sm">{String(hr).padStart(2, '0')}:00</div>
                  <div className="text-[10px] uppercase font-semibold mt-1">{label}</div>
                  {slot?.customer_name && (
                    <div className="text-[9px] truncate mt-1 opacity-75">{slot.customer_name}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Block Slot Modal */}
      {blockModalOpen && (
        <Modal
          isOpen={blockModalOpen}
          onClose={() => setBlockModalOpen(false)}
          title="Blokir Slot Jadwal Internal Kampus"
        >
          <form onSubmit={handleBlockSubmit} className="space-y-4 font-mono text-xs">
            <div className="space-y-1">
              <label className="text-slate-500 uppercase font-semibold">Alasan Pemblokiran</label>
              <input
                type="text"
                required
                value={blockForm.reason}
                onChange={(e) => setBlockForm({ ...blockForm, reason: e.target.value })}
                placeholder="Contoh: Turnamen Rektor Cup / Pemeliharaan Rumput"
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-slate-500 uppercase font-semibold">Jam Mulai</label>
                <select
                  value={blockForm.start_hour}
                  onChange={(e) => setBlockForm({ ...blockForm, start_hour: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                >
                  {Array.from({ length: 18 }, (_, i) => i + 6).map((h) => (
                    <option key={h} value={h}>{String(h).padStart(2, '0')}:00 WIB</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 uppercase font-semibold">Jam Selesai</label>
                <select
                  value={blockForm.end_hour}
                  onChange={(e) => setBlockForm({ ...blockForm, end_hour: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                >
                  {Array.from({ length: 18 }, (_, i) => i + 7).map((h) => (
                    <option key={h} value={h}>{String(h).padStart(2, '0')}:00 WIB</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setBlockModalOpen(false)}
                className="py-2 px-4 rounded-xl border border-slate-200"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={blockLoading}
                className="py-2 px-5 rounded-xl bg-amber-600 text-white font-bold uppercase"
              >
                {blockLoading ? 'Memblokir...' : 'Tutup Slot'}
              </button>
            </div>
          </form>
        </Modal>
      )}

    </DashboardLayout>
  );
}

export default AdminSchedule;

