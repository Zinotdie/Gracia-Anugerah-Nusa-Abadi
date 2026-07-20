const db = require('../config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const asyncHandler = require('../utils/asyncHandler');

// Controller Autentikasi User
module.exports = {
  // Login user dan membuat JWT token
  login: asyncHandler(async (req, res) => {
    const { username, password, role } = req.body;

    const [users] = await db.query(
      `SELECT * FROM users WHERE username = ? AND is_active = 1`,
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Username tidak ditemukan atau akun non-aktif."
      });
    }

    const user = users[0];

    if (role && user.role !== role) {
      return res.status(401).json({
        success: false,
        message: "Role akun tidak sesuai dengan akses yang diminta."
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Password yang Anda masukkan salah."
      });
    }

    const payload = {
      id: user.id,
      username: user.username,
      role: user.role,
      nama: user.nama
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || 'gana_secret_key_2026', {
      expiresIn: '8h'
    });

    res.json({
      success: true,
      message: "Login Berhasil.",
      token: token,
      data: payload
    });
  })
};