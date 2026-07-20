const jwt = require('jsonwebtoken');

// Middleware untuk verifikasi JWT Token
const verifyToken = (req, res, next) => {
  // Izinkan request HTTP OPTIONS (CORS Preflight) lolos tanpa memeriksa token
  if (req.method === 'OPTIONS') {
    return next();
  }

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(403).json({
      success: false,
      message: "Akses ditolak. Token autentikasi tidak ditemukan."
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'gana_secret_key_2026', (err, decoded) => {
    if (err) {
      return res.status(401).json({
        success: false,
        message: "Sesi tidak valid atau telah kadaluarsa. Silakan login kembali."
      });
    }

    req.user = decoded;
    next();
  });
};

module.exports = { verifyToken };