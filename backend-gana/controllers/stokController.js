const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

const getRiwayatStok = asyncHandler(async (req, res) => {
  const query = `
    SELECT r.*, p.nama_produk 
    FROM riwayat_stok r 
    LEFT JOIN produk p ON r.id_produk = p.id_produk 
    ORDER BY r.tgl_perubahan ASC
  `;
  const [rows] = await db.query(query);
  
  const runningBalances = {};
  const mapped = rows.map(r => {
    const prodId = r.id_produk;
    const change = r.tipe_perubahan === 'Masuk' ? r.jumlah : -r.jumlah;
    runningBalances[prodId] = (runningBalances[prodId] || 0) + change;

    const tgl = r.tgl_perubahan ? new Date(r.tgl_perubahan) : new Date();
    const dateStr = tgl.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }) + ' ' + tgl.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    }).replace('.', ':');

    return {
      id_riwayat: r.id_riwayat,
      id_produk: r.id_produk,
      product: r.nama_produk || 'Produk Tidak Dikenal',
      ref: r.keterangan || '-',
      type: r.tipe_perubahan === 'Masuk' ? 'in' : 'out',
      qty: r.jumlah,
      balance: runningBalances[prodId],
      date: dateStr,
      rawDate: r.tgl_perubahan
    };
  });

  res.json({ success: true, data: mapped.reverse() });
});

module.exports = {
  getRiwayatStok,
  getAllStok: getRiwayatStok,
  getAll: getRiwayatStok
};