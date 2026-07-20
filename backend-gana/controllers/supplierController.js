const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

module.exports = {
  getAllSupplier: asyncHandler(async (req, res) => {
    const [rows] = await db.query("SELECT * FROM suppliers");
    res.json({ success: true, data: rows });
  }),
  addSupplier: asyncHandler(async (req, res) => {
    const nama_supplier = req.body.nama_supplier || req.body.name || req.body.nama || '';
    await db.query("INSERT INTO suppliers (nama_supplier) VALUES (?)", [nama_supplier]);
    res.json({ success: true, message: "Supplier ditambah!" });
  }),
  updateSupplier: asyncHandler(async (req, res) => {
    const nama_supplier = req.body.nama_supplier || req.body.name || req.body.nama || '';
    await db.query("UPDATE suppliers SET nama_supplier=? WHERE id_supplier=?", [nama_supplier, req.params.id]);
    res.json({ success: true, message: "Supplier diupdate!" });
  }),
  deleteSupplier: asyncHandler(async (req, res) => {
    await db.query("DELETE FROM suppliers WHERE id_supplier=?", [req.params.id]);
    res.json({ success: true, message: "Supplier dihapus!" });
  })
};