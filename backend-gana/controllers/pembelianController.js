const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

// Controller Transaksi Pembelian (Direct MySQL Queries)
module.exports = {
  // Ambil semua data barang masuk / pembelian
  getAllPembelian: asyncHandler(async (req, res) => {
    const query = `
      SELECT p.*, s.nama_supplier, sg.nama as nama_staff, kg.nama as nama_kepala 
      FROM pembelian p 
      LEFT JOIN suppliers s ON p.id_supplier = s.id_supplier
      LEFT JOIN users sg ON p.id_staff_gudang = sg.id
      LEFT JOIN users kg ON p.id_kepala_gudang = kg.id
      ORDER BY p.id_pembelian DESC
    `;
    const [rows] = await db.query(query);
    
    const result = [];
    for (let row of rows) {
      const [items] = await db.query(
        `SELECT dp.*, pr.nama_produk, pr.brand, pr.kemasan 
         FROM detail_pembelian dp
         JOIN produk pr ON dp.id_produk = pr.id_produk
         WHERE dp.id_pembelian = ?`,
        [row.id_pembelian]
      );

      const mappedItems = items.map(item => ({
        id_produk: item.id_produk,
        produk_id: item.id_produk,
        name: item.nama_produk,
        nama: item.nama_produk,
        brand: item.brand,
        qty: item.qty_beli,
        qty_beli: item.qty_beli,
        uom: 'Karton'
      }));

      let status = 'pending';
      if (row.status_qc === 'Sesuai') status = 'approved';
      else if (row.status_qc === 'Cacat/Retur') status = 'rejected';

      const totalQty = mappedItems.reduce((sum, item) => sum + item.qty, 0);

      const formattedDate = row.tgl_beli ? new Date(row.tgl_beli).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }) : '-';

      result.push({
        id: `PEM-${String(row.id_pembelian).padStart(4, '0')}`,
        id_pembelian: row.id_pembelian,
        date: formattedDate,
        rawDate: row.tgl_beli,
        sj: row.no_sj_supplier,
        foto_sj_supplier: row.foto_sj_supplier || null,
        supplier: row.nama_supplier || 'Supplier System',
        items: mappedItems.length,
        totalQty: totalQty,
        status: status,
        status_qc: row.status_qc,
        staff: row.nama_staff || 'Staff System',
        kepala: row.nama_kepala || 'Kepala System',
        draftList: mappedItems,
        itemsList: mappedItems
      });
    }
    res.json({ success: true, data: result });
  }),

  // Tambah penerimaan barang baru dari supplier
  addPembelian: asyncHandler(async (req, res) => {
    const { id_supplier, id_staff_gudang, no_sj_supplier, foto_sj_supplier, tgl_beli, detail_pembelian, items } = req.body;
    const itemDetail = detail_pembelian || items;

    if (!itemDetail || !Array.isArray(itemDetail) || itemDetail.length === 0) {
      return res.status(400).json({ success: false, message: "Detail barang masuk (items) wajib diisi." });
    }

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const [beli] = await connection.query(
        "INSERT INTO pembelian (id_supplier, id_staff_gudang, id_kepala_gudang, no_sj_supplier, foto_sj_supplier, tgl_beli, status_qc, total_bayar) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", 
        [id_supplier, id_staff_gudang || req.user?.id || 1, null, no_sj_supplier, foto_sj_supplier || null, tgl_beli || new Date(), 'Menunggu', 0]
      );
      const id_pembelian = beli.insertId;

      for (let item of itemDetail) {
        await connection.query(
          "INSERT INTO detail_pembelian (id_pembelian, id_produk, qty_beli, subtotal) VALUES (?, ?, ?, ?)", 
          [id_pembelian, item.id_produk || item.produk_id, item.qty_beli || item.qty, 0]
        );
      }

      await connection.commit();
      res.json({ success: true, message: "Laporan Penerimaan Barang berhasil disimpan.", id_pembelian });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }),

  // Approval penerimaan barang oleh Kepala Gudang
  approvePembelian: asyncHandler(async (req, res) => {
    const id_pembelian = req.params.id;
    const id_kepala_gudang = req.body.id_kepala_gudang || req.user?.id || 1;

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const [rows] = await connection.query("SELECT status_qc, no_sj_supplier FROM pembelian WHERE id_pembelian = ?", [id_pembelian]);
      if (rows.length === 0) {
        await connection.rollback();
        return res.status(404).json({ success: false, message: "Transaksi Pembelian tidak ditemukan!" });
      }

      if (rows[0].status_qc === 'Sesuai') {
        await connection.commit();
        return res.json({ success: true, message: "Transaksi sudah disetujui sebelumnya." });
      }

      await connection.query(
        "UPDATE pembelian SET status_qc = 'Sesuai', id_kepala_gudang = ? WHERE id_pembelian = ?",
        [id_kepala_gudang, id_pembelian]
      );

      const [items] = await connection.query("SELECT id_produk, qty_beli FROM detail_pembelian WHERE id_pembelian = ?", [id_pembelian]);

      for (let item of items) {
        await connection.query(
          "UPDATE produk SET stok_total_karton = stok_total_karton + ? WHERE id_produk = ?",
          [item.qty_beli, item.id_produk]
        );

        await connection.query(
          "INSERT INTO riwayat_stok (id_produk, tipe_perubahan, jumlah, keterangan) VALUES (?, 'Masuk', ?, ?)",
          [item.id_produk, item.qty_beli, `Barang Masuk (Approved) SJ Supplier #${rows[0].no_sj_supplier}`]
        );
      }

      await connection.commit();
      res.json({ success: true, message: "Penerimaan barang disetujui & stok berhasil ditambahkan." });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }),

  // Penolakan / Retur penerimaan barang
  rejectPembelian: asyncHandler(async (req, res) => {
    const id_pembelian = req.params.id;
    const id_kepala_gudang = req.body.id_kepala_gudang || req.user?.id || 1;

    await db.query(
      "UPDATE pembelian SET status_qc = 'Cacat/Retur', id_kepala_gudang = ? WHERE id_pembelian = ?",
      [id_kepala_gudang, id_pembelian]
    );

    res.json({ success: true, message: "Penerimaan barang ditolak / ditandai cacat." });
  })
};