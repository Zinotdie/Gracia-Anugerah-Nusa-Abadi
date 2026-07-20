const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

// Controller Laporan Kunjungan (Direct MySQL Queries)
module.exports = {
  // Ambil semua laporan kunjungan sales
  getAllKunjungan: asyncHandler(async (req, res) => {
    let query = `
      SELECT l.*, s.nama AS nama_sales, p.nama_bengkel 
      FROM laporan_kunjungan l 
      LEFT JOIN users s ON l.id_sales = s.id
      LEFT JOIN pelanggan p ON l.id_pelanggan = p.id_pelanggan
      WHERE 1=1
    `;
    const queryParams = [];

    if (req.query.bulan && req.query.bulan !== 'all' && !req.query.bulan.includes('all')) {
      query += ` AND DATE_FORMAT(l.tgl_kunjungan, '%Y-%m') = ?`;
      queryParams.push(req.query.bulan);
    }
    if (req.query.sales_id) {
      query += ` AND l.id_sales = ?`;
      queryParams.push(req.query.sales_id);
    }

    query += ` ORDER BY l.tgl_kunjungan DESC, l.id_laporan DESC`;

    const [rows] = await db.query(query, queryParams);

    const data = rows.map(r => ({
      id: r.id_laporan,
      id_laporan: r.id_laporan,
      id_sales: r.id_sales,
      sales_name: r.nama_sales || 'Sales System',
      sales: r.nama_sales || 'Sales System',
      id_pelanggan: r.id_pelanggan,
      workshop_name: r.nama_bengkel || 'Bengkel General',
      customer: r.nama_bengkel || 'Bengkel General',
      tgl_kunjungan: r.tgl_kunjungan ? new Date(r.tgl_kunjungan).toLocaleDateString('id-ID') : '-',
      date: r.tgl_kunjungan ? new Date(r.tgl_kunjungan).toLocaleDateString('id-ID') : '-',
      catatan: r.catatan || '-',
      notes: r.catatan || '-',
      foto_visit: r.foto_visit || null,
      image: r.foto_visit || null
    }));

    res.json({ success: true, data });
  }),

  // Simpan laporan kunjungan baru
  addKunjungan: asyncHandler(async (req, res) => {
    const data = req.body;
    const salesId = data.sales_id || data.id_sales || data.id_user || req.user?.id || 1;
    const pelangganId = data.id_pelanggan || data.pelanggan_id || null;
    const tgl = data.tgl_kunjungan || data.tgl_visit || data.created_at || new Date();
    const photo = data.foto_visit || data.image || data.photoUrl || null;
    const notes = data.catatan || data.keterangan || data.hasil_kunjungan || data.hasil_diskusi || null;

    const [result] = await db.query(
      "INSERT INTO laporan_kunjungan (id_sales, id_pelanggan, tgl_kunjungan, foto_visit, catatan) VALUES (?, ?, ?, ?, ?)", 
      [salesId, pelangganId, tgl, photo, notes]
    );

    res.json({ success: true, message: "Laporan Kunjungan berhasil disimpan.", id_laporan: result.insertId });
  }),

  // Update laporan kunjungan
  updateKunjungan: asyncHandler(async (req, res) => {
    const data = req.body;
    const pelangganId = data.id_pelanggan || data.pelanggan_id || null;
    const photo = data.foto_visit || data.image || data.photoUrl || null;
    const notes = data.catatan || data.keterangan || data.hasil_kunjungan || data.hasil_diskusi || null;

    await db.query(
      "UPDATE laporan_kunjungan SET id_pelanggan = ?, catatan = ?, foto_visit = ? WHERE id_laporan = ?",
      [pelangganId, notes, photo, req.params.id]
    );

    res.json({ success: true, message: "Laporan Kunjungan berhasil diupdate." });
  }),

  // Hapus laporan kunjungan
  deleteKunjungan: asyncHandler(async (req, res) => {
    await db.query("DELETE FROM laporan_kunjungan WHERE id_laporan = ?", [req.params.id]);
    res.json({ success: true, message: "Laporan Kunjungan berhasil dihapus." });
  })
};