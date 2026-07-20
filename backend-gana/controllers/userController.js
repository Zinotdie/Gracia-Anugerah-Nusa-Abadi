const db = require('../config/db');
const bcrypt = require('bcryptjs');
const asyncHandler = require('../utils/asyncHandler');

// Ambil role dari URL endpoint
const getRoleFromPath = (path) => {
  if (path.includes('admins')) return 'admin';
  if (path.includes('sales')) return 'sales';
  if (path.includes('owners')) return 'owner';
  if (path.includes('kepala')) return 'kepala_gudang';
  if (path.includes('staff')) return 'staff_gudang';
  return null;
};

// Controller Management User (Direct MySQL Queries)
module.exports = {
  // Ambil semua data user berdasarkan role (Tampilkan user Aktif & Tidak Aktif)
  getAll: asyncHandler(async (req, res) => {
    const role = req.query.role || getRoleFromPath(req.baseUrl);
    let query = "SELECT id, username, nama, no_hp, role, is_active FROM users WHERE 1=1";
    const params = [];

    if (role && role !== 'all') {
      query += " AND (role = ? OR LOWER(role) = ?)";
      params.push(role.toLowerCase(), role.toLowerCase());
    }

    query += " ORDER BY id DESC";
    const [rows] = await db.query(query, params);

    const mappedData = rows.map(item => {
      const isActive = item.is_active == 1 || item.is_active === true || item.is_active === null || item.is_active === undefined;
      return {
        id: item.id,
        id_admin: item.id,
        id_sales: item.id,
        id_owner: item.id,
        id_kepala: item.id,
        id_staff: item.id,
        username: item.username,
        nama: item.nama,
        nama_admin: item.nama,
        nama_sales: item.nama,
        nama_owner: item.nama,
        nama_kepala: item.nama,
        nama_staff: item.nama,
        no_hp: item.no_hp,
        is_active: isActive ? 1 : 0,
        status: isActive ? 'Active' : 'Inactive',
        status_label: isActive ? 'Aktif' : 'Tidak Aktif'
      };
    });

    res.json({ success: true, data: mappedData });
  }),

  // Tambah user baru
  create: asyncHandler(async (req, res) => {
    const role = req.body.role || getRoleFromPath(req.baseUrl);
    const { username, password, nama, no_hp, status } = req.body;
    const nameVal = nama || req.body.nama_admin || req.body.nama_sales || req.body.nama_owner || req.body.nama_kepala || req.body.nama_staff;
    const targetRole = (role || req.body.role || 'admin').toLowerCase();
    const rawPass = (password && typeof password === 'string' && password.trim() !== '') ? password : '123456';
    const hashedPassword = await bcrypt.hash(rawPass, 10);
    const is_active = (status !== undefined) ? ((String(status).toLowerCase() === 'active' || String(status).toLowerCase() === 'aktif' || String(status) === '1' || String(status) === 'true') ? 1 : 0) : 1;

    await db.query(
      "INSERT INTO users (username, password, nama, role, no_hp, is_active) VALUES (?, ?, ?, ?, ?, ?)",
      [username, hashedPassword, nameVal, targetRole, no_hp || null, is_active]
    );

    res.json({ success: true, message: "User berhasil ditambahkan." });
  }),

  // Edit user
  update: asyncHandler(async (req, res) => {
    const role = req.body.role || getRoleFromPath(req.baseUrl);
    const { username, password, nama, no_hp, status } = req.body;
    const nameVal = nama || req.body.nama_admin || req.body.nama_sales || req.body.nama_owner || req.body.nama_kepala || req.body.nama_staff;
    const targetRole = (role || req.body.role || 'admin').toLowerCase();

    let fields = [];
    let params = [];

    if (username !== undefined && username !== null && username !== '') {
      fields.push("username=?");
      params.push(username);
    }
    if (nameVal !== undefined && nameVal !== null && nameVal !== '') {
      fields.push("nama=?");
      params.push(nameVal);
    }
    if (targetRole) {
      fields.push("role=?");
      params.push(targetRole);
    }
    if (no_hp !== undefined) {
      fields.push("no_hp=?");
      params.push(no_hp || null);
    }

    if (password && typeof password === 'string' && password.trim() !== '') {
      let passToSave = password;
      if (!password.startsWith('$2a$') && !password.startsWith('$2b$')) {
        passToSave = await bcrypt.hash(password, 10);
      }
      fields.push("password=?");
      params.push(passToSave);
    }

    if (status !== undefined) {
      const sStr = String(status).toLowerCase();
      const isActive = (sStr === 'active' || sStr === 'aktif' || sStr === '1' || sStr === 'true') ? 1 : 0;
      fields.push("is_active=?");
      params.push(isActive);
    }

    if (fields.length > 0) {
      params.push(req.params.id);
      await db.query(`UPDATE users SET ${fields.join(', ')} WHERE id=?`, params);
    }

    res.json({ success: true, message: "User berhasil diperbarui." });
  }),

  // Hapus user secara permanen (Hard Delete)
  delete: asyncHandler(async (req, res) => {
    try {
      await db.query("DELETE FROM users WHERE id=?", [req.params.id]);
    } catch(e) {
      // Jika terdapat constraint FK di transaksi, bersihkan atau ubah ke -1 / hapus FK
      await db.query("DELETE FROM users WHERE id=?", [req.params.id]).catch(async () => {
        await db.query("UPDATE users SET is_active = 0 WHERE id=?", [req.params.id]);
      });
    }
    res.json({ success: true, message: "User berhasil dihapus." });
  })
};
