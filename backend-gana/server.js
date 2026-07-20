const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Application Middlewares with Full Permissive CORS (Allows ngrok, custom headers & preflights)
app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'ngrok-skip-browser-warning', 'bypass-tunnel-reminder'],
  credentials: true
}));

// Additional middleware to ensure CORS headers on every response
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, ngrok-skip-browser-warning, bypass-tunnel-reminder');
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Import Route Handlers
const authRoutes = require('./routes/authRoutes');
const produkRoutes = require('./routes/produkRoutes');
const kategoriRoutes = require('./routes/kategoriRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const pelangganRoutes = require('./routes/pelangganRoutes');
const pembelianRoutes = require('./routes/pembelianRoutes');
const stokRoutes = require('./routes/stokRoutes');
const penjualanRoutes = require('./routes/penjualanRoutes');
const userRoutes = require('./routes/userRoutes');
const kunjunganRoutes = require('./routes/kunjunganRoutes');
const alamatRoutes = require('./routes/alamatRoutes');
const targetPenjualanRoutes = require('./routes/targetPenjualanRoutes');
const ownerDashboardRoutes = require('./routes/ownerDashboardRoutes');
const adminDashboardRoutes = require('./routes/adminDashboardRoutes');

const { verifyToken } = require('./middlewares/authMiddleware');

// Public API Routes
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.send('API Backend PT. Gracia Anugerah Nusa Abadi Ready.');
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: "API Server & Database Operational",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime())
  });
});

// Protected API Routes (Requires JWT Authentication)
app.use(verifyToken);

app.use('/api/produk', produkRoutes);
app.use('/api/kategori', kategoriRoutes);
app.use('/api/supplier', supplierRoutes);
app.use('/api/pelanggan', pelangganRoutes);
app.use('/api/pembelian', pembelianRoutes);
app.use('/api/stok', stokRoutes);
app.use('/api/penjualan', penjualanRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admins', userRoutes);
app.use('/api/sales', userRoutes);
app.use('/api/owners', userRoutes);
app.use('/api/staff', userRoutes);
app.use('/api/kepala', userRoutes);
app.use('/api/kepala_gudang', userRoutes);
app.use('/api/kunjungan', kunjunganRoutes);
app.use('/api/alamat', alamatRoutes);
app.use('/api/target-penjualan', targetPenjualanRoutes);
app.use('/api/owner', ownerDashboardRoutes);
app.use('/api/admin', adminDashboardRoutes);

// Global Error Handler
const { errorHandler } = require('./middlewares/errorMiddleware');
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`[Server Ready]: PT GANA Backend active on port ${PORT}`);
});