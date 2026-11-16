/**
 * Error Message Mapping Utility - POLISOCCER
 * Maps backend error codes to user-friendly Indonesian messages.
 */

const ERROR_MAP = {
  SLOT_TAKEN: 'Jadwal slot yang dipilih sudah terisi atau terkunci oleh pihak lain. Silakan pilih jam lain.',
  LOCK_EXPIRED: 'Waktu hold 5 menit Anda telah kedaluwarsa. Silakan pilih kembali jadwal.',
  INVALID_FILE: 'Berkas tidak valid. Harap gunakan format JPG, PNG, WEBP, atau PDF dengan ukuran maksimal.',
  IDENTITY_REQUIRED: 'Kategori Mahasiswa / Karyawan wajib menyertakan foto identitas (KTM/KTA) untuk verifikasi tarif civitas.',
  VALIDATION_ERROR: 'Data input tidak lengkap atau tidak sesuai format yang ditentukan.',
  RATE_LIMITED: 'Terlalu banyak permintaan. Harap tunggu sejenak sebelum mencoba kembali.',
  UNAUTHORIZED: 'Email atau password yang Anda masukkan salah, atau sesi login telah berakhir.',
  FORBIDDEN: 'Anda tidak memiliki hak akses untuk membuka halaman atau fitur ini.',
  NOT_FOUND: 'Data yang dicari tidak ditemukan pada sistem.',
  PASSWORD_CHANGE_REQUIRED: 'Anda wajib mengubah password bawaan saat pertama kali masuk.',
  SERVER_ERROR: 'Terjadi gangguan internal pada server. Tim teknis sedang menanganinya.'
};

export function getErrorMessage(error, fallback = 'Terjadi kesalahan sistem. Silakan coba kembali.') {
  if (!error) return fallback;
  if (typeof error === 'string') return error;

  const data = error.response?.data;
  
  // Prefer specific backend message if provided
  if (data?.message && typeof data.message === 'string') {
    return data.message;
  }
  if (data?.code && ERROR_MAP[data.code]) {
    return ERROR_MAP[data.code];
  }
  if (error.message) {
    return error.message;
  }
  return fallback;
}
