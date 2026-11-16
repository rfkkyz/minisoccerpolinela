import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { adminMenuItems } from './adminMenu';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api';
import { formatDate } from '../../utils/format';
import { getErrorMessage } from '../../utils/errorMessage';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { 
  PlusCircle, Edit2, Trash2, Newspaper, 
  Image as ImageIcon, Calendar, Tag, CheckCircle2 
} from 'lucide-react';

export function AdminNews() {
  const { user } = useAuth();
  const [newsList, setNewsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form Modal State (Add / Edit)
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({
    title: '',
    category: 'berita',
    excerpt: '',
    content: '',
  });
  const [coverFile, setCoverFile] = useState(null);
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [formLoading, setFormLoading] = useState(false);

  // Delete State
  const [deleteItem, setDeleteItem] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchNews = () => {
    setLoading(true);
    apiClient.public.news()
      .then((res) => {
        const items = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.news)
            ? res.data.news
            : Array.isArray(res.data?.data)
              ? res.data.data
              : [];
        setNewsList(items);
      })
      .catch(() => { setNewsList([]); })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setForm({ title: '', category: 'berita', excerpt: '', content: '' });
    setCoverFile(null);
    setGalleryFiles([]);
    setModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setForm({
      title: item.title,
      category: item.category || 'berita',
      excerpt: item.excerpt || '',
      content: item.content || '',
    });
    setCoverFile(null);
    setGalleryFiles([]);
    setModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('category', form.category);
      formData.append('excerpt', form.excerpt);
      formData.append('content', form.content);

      if (coverFile) {
        formData.append('cover_image', coverFile);
      }

      if (galleryFiles.length > 0) {
        Array.from(galleryFiles).forEach((file) => {
          formData.append('gallery_images', file);
        });
      }

      if (editingItem) {
        await apiClient.admin.updateNews(editingItem.id, formData);
      } else {
        await apiClient.admin.createNews(formData);
      }

      setModalOpen(false);
      fetchNews();
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setDeleteLoading(true);

    try {
      await apiClient.admin.deleteNews(deleteItem.id);
      setDeleteItem(null);
      fetchNews();
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns = [
    {
      header: 'FOTO & JUDUL',
      accessor: 'title',
      render: (row) => (
        <div className="flex items-center gap-3">
          <img
            src={row.cover_image || 'https://placehold.co/100x60?text=News'}
            alt={row.title}
            className="w-16 h-10 object-cover rounded-lg shrink-0 border border-slate-200"
          />
          <div className="text-xs font-mono">
            <span className="font-bold text-[var(--text)] line-clamp-1">{row.title}</span>
            <span className="text-[10px] text-slate-400">{formatDate(row.created_at)}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'KATEGORI',
      accessor: 'category',
      render: (row) => (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
          {row.category || 'BERITA'}
        </span>
      ),
    },
    {
      header: 'RINGKASAN',
      accessor: 'excerpt',
      render: (row) => (
        <span className="text-xs text-slate-500 line-clamp-2 max-w-sm">
          {row.excerpt || row.content}
        </span>
      ),
    },
    {
      header: 'AKSI',
      accessor: 'id',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenEdit(row)}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setDeleteItem(row)}
            className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout
      role={user?.role === 'superadmin' ? 'superadmin' : 'admin'}
      menuItems={adminMenuItems}
      title="Kelola Berita & Galeri"
      user={user}
    >
      <PageHeader
        title="Publikasi Berita & Galeri"
        highlightWord="Berita"
        subtitle="Kelola artikel kegiatan, pengumuman kejuaraan, dan galeri fasilitas Mini Soccer Polinela"
        breadcrumbs={[
          { label: 'BERANDA', path: '/' },
          { label: 'ADMINISTRATOR', path: '/admin' },
          { label: 'BERITA & GALERI' }
        ]}
        actions={
          <Button
            variant="accent"
            size="md"
            icon={<PlusCircle className="w-4 h-4" />}
            onClick={handleOpenAdd}
          >
            Tambah Artikel Baru
          </Button>
        }
      />

      <div className="-mt-6 space-y-6">
        {/* Table View */}
        <Table
          columns={columns}
          data={Array.isArray(newsList) ? newsList : []}
          loading={loading}
          emptyMessage="Belum ada artikel berita yang dipublikasikan."
        />
      </div>

      {/* Add / Edit News Modal */}
      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingItem ? 'Edit Artikel Berita' : 'Tambah Artikel Berita Baru'}
          maxWidth="max-w-2xl"
        >
          <form onSubmit={handleFormSubmit} className="space-y-4 font-mono text-xs">
            <div className="space-y-1">
              <label className="text-slate-500 uppercase font-semibold">Judul Artikel</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Judul pengumuman / liputan"
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-slate-500 uppercase font-semibold">Kategori</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                >
                  <option value="berita">Berita</option>
                  <option value="kegiatan">Kegiatan</option>
                  <option value="promo">Promo</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 uppercase font-semibold">Foto Sampul Utama</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCoverFile(e.target.files[0])}
                  className="w-full text-xs file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:bg-emerald-100 file:text-emerald-800"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-slate-500 uppercase font-semibold">Foto Galeri Dokumentasi (Pilih Beberapa Foto)</label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => setGalleryFiles(e.target.files)}
                className="w-full text-xs file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:bg-emerald-100 file:text-emerald-800"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-500 uppercase font-semibold">Ringkasan Singkat (Excerpt)</label>
              <input
                type="text"
                value={form.excerpt}
                onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                placeholder="Ringkasan 1-2 kalimat untuk preview di beranda"
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-500 uppercase font-semibold">Isi Lengkap Artikel</label>
              <textarea
                required
                rows={6}
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="Tuliskan berita lengkap di sini..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="py-2 px-4 rounded-xl border border-slate-200"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={formLoading}
                className="py-2 px-5 rounded-xl bg-[var(--text)] text-white font-bold uppercase"
              >
                {formLoading ? 'Menyimpan...' : 'Simpan & Publikasikan'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteItem && (
        <ConfirmDialog
          isOpen={!!deleteItem}
          title="Hapus Artikel Berita?"
          message={`Apakah Anda yakin ingin menghapus artikel "${deleteItem.title}"? Tindakan ini tidak dapat dibatalkan.`}
          confirmLabel={deleteLoading ? 'Menghapus...' : 'Ya, Hapus'}
          onConfirm={handleDelete}
          onCancel={() => setDeleteItem(null)}
        />
      )}

    </DashboardLayout>
  );
}

export default AdminNews;

