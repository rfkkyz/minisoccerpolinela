export const content = {
  brand: {
    name: 'POLISOCCER',
    fullName: 'POLITEKNIK NEGERI LAMPUNG',
    tagline: 'Sistem Informasi Pengelolaan & Reservasi Lapangan Mini Soccer',
  },
  announcement: {
    text: 'Sistem Reservasi Online Lapangan Mini Soccer Polinela. Cek jadwal ketersediaan',
    linkText: 'Lihat Jadwal ->',
    linkHref: '#jadwal'
  },
  nav: {
    items: [
      { id: 'tentang', label: 'TENTANG', href: '#tentang' },
      { id: 'tarif', label: 'TARIF SEWA', href: '#tarif' },
      { id: 'jadwal', label: 'JADWAL & KETERSEDIAAN', href: '#jadwal' },
      { id: 'berita', label: 'BERITA & PENGUMUMAN', href: '#berita' },
    ],
    tarifsDropdown: [
      {
        id: 'mahasiswa',
        title: 'MAHASISWA POLINELA',
        badge: 'TARIF MAHASISWA',
        desc: 'Tarif sewa Rp100.000 / jam bagi mahasiswa aktif Polinela dengan verifikasi Kartu Tanda Mahasiswa (KTM).',
        price: 'Rp100.000 / jam',
      },
      {
        id: 'karyawan',
        title: 'DOSEN & KARYAWAN',
        badge: 'TARIF KARYAWAN',
        desc: 'Tarif sewa Rp120.000 / jam bagi dosen dan tenaga kependidikan Polinela dengan verifikasi ID Card/KTA.',
        price: 'Rp120.000 / jam',
      },
      {
        id: 'umum',
        title: 'MASYARAKAT UMUM',
        badge: 'TARIF UMUM',
        desc: 'Tarif sewa reguler Rp150.000 / jam untuk masyarakat dan komunitas umum.',
        price: 'Rp150.000 / jam',
      },
    ],
  },
  hero: {
    badge: 'POLITEKNIK NEGERI LAMPUNG — SISTEM INFORMASI RESERVASI',
    headline: {
      part1: 'Sistem Reservasi Online',
      part2: 'Lapangan Mini Soccer Polinela',
    },
    subheading: 'Sistem informasi pengelolaan dan pemesanan lapangan mini soccer Politeknik Negeri Lampung secara real-time, transparan, dan terstruktur guna mencegah bentrok jadwal penggunaan.',
    ctaPrimary: 'PESAN JADWAL SEKARANG',
    ctaSecondary: 'LIHAT TARIF SEWA',
    facilitiesMarquee: [
      'LAPANGAN MINI SOCCER RUMPUT SINTETIS',
      'PENCAHAYAAN OPERASIONAL MALAM',
      'RUANG GANTI & FASILITAS KEBERSIHAN',
      'PENCEGAHAN BENTROK JADWAL OTOMATIS',
      'VERIFIKASI BUKTI PEMBAYARAN ONLINE',
      'E-TIKET RESERVASI DIGITAL',
      'TERSEDIA BOLA & ROMPI LATIHAN',
      'AREA PARKIR POLITEKNIK NEGERI LAMPUNG',
    ],
  },
  about: {
    label: 'ALUR LAYANAN & PENGELOLAAN',
    title: 'Alur Lengkap Reservasi Lapangan',
    steps: [
      {
        num: '01',
        title: 'CEK JADWAL LAPANGAN',
        desc: 'Periksa kalender ketersediaan secara real-time untuk melihat slot jam operasional lapangan yang masih kosong.',
      },
      {
        num: '02',
        title: 'BUAT AKUN & LOGIN',
        desc: 'Daftarkan akun pengguna dan lengkapi identitas KTM bagi mahasiswa atau ID Card bagi karyawan untuk verifikasi tarif kampus.',
      },
      {
        num: '03',
        title: 'PILIH JADWAL & KUNCI WAKTU',
        desc: 'Pilih tanggal serta slot jam bermain yang diinginkan. Sistem otomatis mengunci slot waktu Anda agar bebas bentrok.',
      },
      {
        num: '04',
        title: 'BAYAR DP / LUNAS & UPLOAD BUKTI',
        desc: 'Lakukan transfer pembayaran uang muka (DP 50%) atau bayar lunas, kemudian unggah foto bukti transfer pembayaran ke sistem.',
      },
      {
        num: '05',
        title: 'VERIFIKASI & TERIMA E-TIKET',
        desc: 'Admin pengelola memvalidasi pembayaran dan sistem menerbitkan e-tiket digital resmi lengkap dengan QR Code.',
      },
      {
        num: '06',
        title: 'SCAN BARCODE DI LAPANGAN',
        desc: 'Tunjukkan e-tiket kepada petugas lapangan saat hari bermain untuk dipindai (scan) sebagai bukti check-in resmi sebelum bertanding.',
      },
    ],
  },
  pricing: {
    label: 'TARIF SEWA LAPANGAN',
    title: 'Tarif Sewa Tetap Per Kategori Pengguna',
    subheading: 'Tarif sewa berlaku tetap per jam sesuai kategori pemesan (Umum, Mahasiswa, Karyawan) untuk mendukung pengelolaan fasilitas olahraga kampus yang tertib.',
    tiers: [
      {
        category: 'umum',
        name: 'Tarif Umum',
        pricePerHour: 150000,
        features: [
          'Tarif reguler untuk masyarakat umum',
          'Pemesanan langsung melalui website',
          'Pilihan pembayaran DP 50% atau Lunas',
          'Termasuk fasilitas bola & rompi latihan',
          'Pencahayaan operasional malam hari',
        ],
        ctaText: 'PESAN TARIF UMUM',
      },
      {
        category: 'mahasiswa',
        name: 'Tarif Mahasiswa',
        pricePerHour: 100000,
        features: [
          'Tarif khusus mahasiswa aktif Polinela',
          'Wajib melampirkan foto KTM aktif',
          'Pilihan pembayaran DP 50% atau Lunas',
          'Termasuk fasilitas bola & rompi latihan',
          'Pencahayaan operasional malam hari',
        ],
        ctaText: 'PESAN TARIF MAHASISWA',
      },
      {
        category: 'karyawan',
        name: 'Tarif Karyawan',
        pricePerHour: 120000,
        features: [
          'Tarif khusus dosen & karyawan Polinela',
          'Wajib melampirkan foto ID Card / KTA',
          'Pilihan pembayaran DP 50% atau Lunas',
          'Termasuk fasilitas bola & rompi latihan',
          'Pencahayaan operasional malam hari',
        ],
        ctaText: 'PESAN TARIF KARYAWAN',
      },
    ],
  },
  cta: {
    heading: 'Ingin Menggunakan Lapangan Mini Soccer Polinela?',
    subheading: 'Periksa ketersediaan jadwal secara real-time dan lakukan pemesanan online dengan mudah tanpa harus datang langsung ke lokasi.',
  },
  footer: {
    institution: 'Politeknik Negeri Lampung',
    department: 'Jurusan Teknologi Informasi — Program Studi Manajemen Informatika',
    address: 'Jl. Soekarno Hatta No. 10, Rajabasa, Bandar Lampung, Lampung 35144',
    hours: 'Operasional Lapangan: Setiap Hari 06:00 - 24:00 WIB',
    whatsapp: '+62 821-8899-7766',
    email: 'minisoccer@polinela.ac.id',
    copyright: '© 2026 POLITEKNIK NEGERI LAMPUNG. PROYEK MANDIRI MANAJEMEN INFORMATIKA.',
  },
};
