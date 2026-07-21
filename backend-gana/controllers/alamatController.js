const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

// Controller Alamat Bengkel (Direct MySQL Queries)
module.exports = {
  getAllAlamat: asyncHandler(async (req, res) => {
    const query = `
      SELECT a.*, p.nama_bengkel 
      FROM alamat_bengkel a 
      LEFT JOIN pelanggan p ON a.id_pelanggan = p.id_pelanggan
    `;
    const [rows] = await db.query(query);
    res.json({ success: true, data: rows });
  }),

  addAlamat: asyncHandler(async (req, res) => {
    const { id_pelanggan, label_alamat, detail_alamat, kota_kab, telp_bengkel } = req.body;
    await db.query(
      "INSERT INTO alamat_bengkel (id_pelanggan, label_alamat, detail_alamat, kota_kab, telp_bengkel) VALUES (?, ?, ?, ?, ?)",
      [id_pelanggan, label_alamat || 'Utama', detail_alamat || '', kota_kab || 'Banjarmasin', telp_bengkel || '']
    );
    res.json({ success: true, message: "Alamat ditambah!" });
  }),

  updateAlamat: asyncHandler(async (req, res) => {
    const { id_pelanggan, label_alamat, detail_alamat, kota_kab, telp_bengkel } = req.body;
    await db.query(
      "UPDATE alamat_bengkel SET id_pelanggan=?, label_alamat=?, detail_alamat=?, kota_kab=?, telp_bengkel=? WHERE id_alamat=?",
      [id_pelanggan, label_alamat, detail_alamat, kota_kab, telp_bengkel, req.params.id]
    );
    res.json({ success: true, message: "Alamat diupdate!" });
  }),

  deleteAlamat: asyncHandler(async (req, res) => {
    await db.query("DELETE FROM alamat_bengkel WHERE id_alamat=?", [req.params.id]);
    res.json({ success: true, message: "Alamat dihapus!" });
  })
};