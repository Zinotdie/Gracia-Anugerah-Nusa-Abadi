const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

module.exports = {
  getAllKategori: asyncHandler(async (req, res) => {
    const [rows] = await db.query("SELECT * FROM kategori");
    res.json({ success: true, data: rows });
  }),
  addKategori: asyncHandler(async (req, res) => {
    const nama_kategori = req.body.nama_kategori || req.body.name || req.body.nama || '';
    await db.query("INSERT INTO kategori (nama_kategori) VALUES (?)", [nama_kategori]);
    res.json({ success: true, message: "Kategori ditambah!" });
  }),
  updateKategori: asyncHandler(async (req, res) => {
    const nama_kategori = req.body.nama_kategori || req.body.name || req.body.nama || '';
    await db.query("UPDATE kategori SET nama_kategori=? WHERE id_kategori=?", [nama_kategori, req.params.id]);
    res.json({ success: true, message: "Kategori diupdate!" });
  }),
  deleteKategori: asyncHandler(async (req, res) => {
    await db.query("DELETE FROM kategori WHERE id_kategori=?", [req.params.id]);
    res.json({ success: true, message: "Kategori dihapus!" });
  })
};