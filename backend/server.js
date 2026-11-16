const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { sequelize } = require('./models');
const routes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');
const { startLockCleanupCron } = require('./jobs/lockCleanupCron');

const app = express();
app.disable('x-powered-by');
const PORT = process.env.PORT || 5000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';

// Security Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS Configuration
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origin === FRONTEND_ORIGIN || origin.includes('localhost') || origin.includes('127.0.0.1')) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-Id', 'x-bypass-ratelimit']
}));

app.use(cookieParser());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve ONLY public news images statically. Private KTM/KTA and receipts are protected via /api/admin/files/...
app.use('/uploads/news', express.static(path.join(__dirname, 'public/uploads/news')));

// Mount Modular API Routes
app.use('/api', routes);

// Root Endpoint: Redirect browser visitors directly to frontend (http://localhost:3000), or return 404 for API requests
app.get('/', (req, res) => {
  if (req.accepts('html')) {
    return res.redirect(FRONTEND_ORIGIN);
  }
  return res.status(404).end();
});

// 404 Handler for undefined routes
app.use((req, res) => {
  if (req.accepts('html')) {
    return res.redirect(FRONTEND_ORIGIN);
  }
  res.status(404).json({
    success: false,
    code: 'NOT_FOUND',
    message: 'Resource tidak ditemukan.'
  });
});

// Centralized Uniform Error Handler
app.use(errorHandler);

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('✅ [DATABASE] Terhubung dengan sukses ke MySQL/MariaDB (polisoccer_db).');

    // Start background auto-cleanup cron job (runs every minute)
    startLockCleanupCron();

    app.listen(PORT, () => {
      console.log(`🚀 [SERVER] Polisoccer Backend Fase 2/3 berjalan di http://localhost:${PORT}`);
      console.log(`📌 [ENVIRONMENT] Mode: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ [DATABASE ERROR] Gagal terhubung ke database:', error);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = app;
