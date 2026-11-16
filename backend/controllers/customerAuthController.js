const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { 
  Customer, 
  PricingCategory, 
  Booking, 
  BookingDetail, 
  ScheduleSlot, 
  Schedule, 
  Field, 
  Payment,
  BookingAttachment
} = require('../models');

/**
 * 1. Register Akun Pe-Reservasi / Pengguna Baru
 * POST /api/customer/register
 */
async function register(req, res, next) {
  try {
    const { 
      nama, 
      email, 
      password, 
      whatsapp, 
      category_id, 
      identify_number 
    } = req.body;

    if (!nama || !email || !password || !whatsapp) {
      return res.status(400).json({
        status: 'error',
        message: 'Lengkapi semua field wajib: Nama Lengkap, Email, Password, dan Nomor WhatsApp.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        status: 'error',
        message: 'Password minimal terdiri dari 6 karakter.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await Customer.findOne({ where: { email: cleanEmail } });
    if (existing) {
      return res.status(409).json({
        status: 'error',
        message: 'Alamat email ini sudah terdaftar. Silakan login atau gunakan email lain.'
      });
    }

    const categoryIdNum = Number(category_id) || 1;
    const category = await PricingCategory.findByPk(categoryIdNum);
    if (!category) {
      return res.status(400).json({
        status: 'error',
        message: 'Kategori harga tidak valid.'
      });
    }

    // Validasi syarat kategori jika Mahasiswa/Karyawan
    if (category.name === 'Mahasiswa POLINELA' && (!identify_number || !identify_number.trim())) {
      return res.status(400).json({
        status: 'error',
        message: 'Nomor Pokok Mahasiswa (NPM) wajib diisi untuk kategori Mahasiswa POLINELA.'
      });
    }

    if (category.name === 'Karyawan POLINELA' && (!identify_number || !identify_number.trim())) {
      return res.status(400).json({
        status: 'error',
        message: 'Nomor Induk Pegawai (NIP) wajib diisi untuk kategori Karyawan POLINELA.'
      });
    }

    const customer = await Customer.create({
      nama: nama.trim(),
      email: cleanEmail,
      password: password,
      whatsapp: whatsapp.trim(),
      category_id: categoryIdNum,
      identify_number: identify_number ? identify_number.trim() : null,
      status: 'aktif'
    });

    const tokenPayload = {
      id: customer.id,
      email: customer.email,
      nama: customer.nama,
      role: 'customer',
      type: 'customer'
    };

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET || 'polisoccer_secret_fallback',
      { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
    );

    return res.status(201).json({
      status: 'success',
      message: 'Akun pe-reservasi berhasil didaftarkan!',
      data: {
        token,
        customer: {
          id: customer.id,
          nama: customer.nama,
          email: customer.email,
          whatsapp: customer.whatsapp,
          category_id: customer.category_id,
          category_name: category.name,
          identify_number: customer.identify_number,
          created_at: customer.created_at
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 2. Login Akun Pe-Reservasi / Pengguna
 * POST /api/customer/login
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Email dan password wajib diisi.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const customer = await Customer.findOne({
      where: { email: cleanEmail },
      include: [{ model: PricingCategory, as: 'category' }]
    });

    if (!customer) {
      return res.status(401).json({
        status: 'error',
        message: 'Email atau password salah.'
      });
    }

    if (customer.status !== 'aktif') {
      return res.status(403).json({
        status: 'error',
        message: 'Akun pe-reservasi dinonaktifkan. Hubungi admin pengelola.'
      });
    }

    const isMatch = await customer.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Email atau password salah.'
      });
    }

    const tokenPayload = {
      id: customer.id,
      email: customer.email,
      nama: customer.nama,
      role: 'customer',
      type: 'customer'
    };

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET || 'polisoccer_secret_fallback',
      { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
    );

    return res.status(200).json({
      status: 'success',
      message: `Selamat datang kembali, ${customer.nama}!`,
      data: {
        token,
        customer: {
          id: customer.id,
          nama: customer.nama,
          email: customer.email,
          whatsapp: customer.whatsapp,
          category_id: customer.category_id,
          category_name: customer.category ? customer.category.name : 'Umum',
          identify_number: customer.identify_number,
          created_at: customer.created_at
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 3. Profile Pengguna Aktif
 * GET /api/customer/me
 */
async function getProfile(req, res, next) {
  try {
    const customer = req.customer;
    return res.status(200).json({
      status: 'success',
      data: {
        id: customer.id,
        nama: customer.nama,
        email: customer.email,
        whatsapp: customer.whatsapp,
        category_id: customer.category_id,
        category_name: customer.category ? customer.category.name : 'Umum',
        identify_number: customer.identify_number,
        status: customer.status,
        created_at: customer.created_at
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 4. Update Profile Pengguna
 * PUT /api/customer/me
 */
async function updateProfile(req, res, next) {
  try {
    const customer = req.customer;
    const { nama, whatsapp, category_id, identify_number, new_password } = req.body;

    if (nama) customer.nama = nama.trim();
    if (whatsapp) customer.whatsapp = whatsapp.trim();
    if (category_id) customer.category_id = Number(category_id);
    if (identify_number !== undefined) customer.identify_number = identify_number ? identify_number.trim() : null;
    if (new_password && new_password.trim().length >= 6) {
      customer.password = new_password.trim();
    }

    await customer.save();

    const reloaded = await Customer.findByPk(customer.id, {
      include: [{ model: PricingCategory, as: 'category' }]
    });

    return res.status(200).json({
      status: 'success',
      message: 'Profil berhasil diperbarui.',
      data: {
        id: reloaded.id,
        nama: reloaded.nama,
        email: reloaded.email,
        whatsapp: reloaded.whatsapp,
        category_id: reloaded.category_id,
        category_name: reloaded.category ? reloaded.category.name : 'Umum',
        identify_number: reloaded.identify_number
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * 5. Riwayat Reservasi Pengguna (My Bookings)
 * GET /api/customer/my-bookings
 */
async function getMyBookings(req, res, next) {
  try {
    const customer = req.customer;

    // Cari booking berdasarkan customer_id ATAU nomor whatsapp yang sama
    const matchConditions = [
      { customer_id: customer.id }
    ];
    if (customer.whatsapp) {
      matchConditions.push({ whatsapp: customer.whatsapp });
    }

    const bookings = await Booking.findAll({
      where: {
        [Op.or]: matchConditions
      },
      include: [
        { model: PricingCategory, as: 'category' },
        {
          model: BookingDetail,
          as: 'details',
          include: [
            {
              model: ScheduleSlot,
              as: 'slot',
              include: [
                {
                  model: Schedule,
                  as: 'schedule',
                  include: [{ model: Field, as: 'field' }]
                }
              ]
            }
          ]
        },
        { model: Payment, as: 'payments' },
        { model: BookingAttachment, as: 'attachments' }
      ],
      order: [['created_at', 'DESC']]
    });

    return res.status(200).json({
      status: 'success',
      data: {
        total: bookings.length,
        bookings: bookings.map(b => {
          const slots = (b.details || []).map(d => ({
            slot_id: d.slot_id,
            start_time: d.slot ? d.slot.start_time.slice(0, 5) : '',
            end_time: d.slot ? d.slot.end_time.slice(0, 5) : '',
            price_applied: Number(d.price_applied)
          }));

          const remainingBalance = Math.max(0, Number(b.total_amount) - Number(b.paid_amount));

          return {
            id: b.id,
            booking_code: b.booking_code,
            e_ticket_number: `TKT-${b.booking_code}`,
            customer_name: b.customer_name,
            whatsapp: b.whatsapp,
            category: b.category ? b.category.name : 'Umum',
            identify_number: b.identify_number,
            booking_date: b.booking_date,
            field_name: b.details?.[0]?.slot?.schedule?.field?.nama || 'Lapangan Utama POLINELA',
            status: b.status,
            payment_type: b.payment_type,
            schedule_slots: slots,
            pricing_summary: {
              total_amount: Number(b.total_amount),
              paid_amount: Number(b.paid_amount),
              remaining_balance: remainingBalance
            },
            payments: b.payments || [],
            created_at: b.created_at
          };
        })
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  getMyBookings
};
