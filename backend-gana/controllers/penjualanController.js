const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

// Controller Transaksi Penjualan (Direct MySQL Queries)
module.exports = {
  // Ambil semua data transaksi penjualan
  getAllPenjualan: asyncHandler(async (req, res) => {
    const query = `
      SELECT p.*, pel.nama_bengkel, u.nama as nama_sales,
             ab.detail_alamat, ab.kota_kab
      FROM penjualan p
      LEFT JOIN pelanggan pel ON p.id_pelanggan = pel.id_pelanggan
      LEFT JOIN users u ON p.id_sales = u.id
      LEFT JOIN (
        SELECT id_pelanggan, MIN(detail_alamat) as detail_alamat, MIN(kota_kab) as kota_kab 
        FROM alamat_bengkel 
        GROUP BY id_pelanggan
      ) ab ON p.id_pelanggan = ab.id_pelanggan
      ORDER BY p.id_penjualan DESC
    `;
    const [rows] = await db.query(query);

    const result = [];
    for (let row of rows) {
      const [detailRows] = await db.query(
        `SELECT dp.*, pr.nama_produk, pr.brand, pr.kemasan, pr.sae, pr.harga_het
         FROM detail_penjualan dp
         JOIN produk pr ON dp.id_produk = pr.id_produk
         WHERE dp.id_penjualan = ?`,
        [row.id_penjualan]
      );

      const mappedItems = detailRows.map(d => ({
        id_detail: d.id_detail,
        id_produk: d.id_produk,
        nama_produk: d.nama_produk,
        name: d.nama_produk,
        brand: d.brand,
        kemasan: d.kemasan,
        sae: d.sae,
        qty_beli: d.qty_beli,
        qty_dus: d.qty_dus || d.qty_beli,
        harga: parseFloat(d.harga_het) || 0,
        subtotal: parseFloat(d.subtotal) || 0
      }));

      let statusUi = 'Draft';
      const sp = (row.status_pengiriman || '').toLowerCase();
      if (sp === 'diproses' || sp === 'approved') statusUi = 'Approved';
      else if (sp === 'dikirim' || sp === 'shipped') statusUi = 'Shipped';
      else if (sp === 'diterima' || sp === 'delivered' || sp === 'invoiced') statusUi = 'Delivered';
      else if (sp === 'dibatalkan' || sp === 'batal' || sp === 'cancelled') statusUi = 'Cancelled';

      result.push({
        id: row.id_penjualan,
        id_penjualan: row.id_penjualan,
        no_so: `INV-${String(row.id_penjualan).padStart(4, '0')}`,
        id_pelanggan: row.id_pelanggan,
        customer: row.nama_bengkel || 'Bengkel Umum',
        address: `${row.detail_alamat || ''} ${row.kota_kab || ''}`.trim() || 'Alamat tidak diisi',
        id_sales: row.id_sales,
        sales: row.nama_sales || 'Sales Staff',
        date: row.tgl_invoice ? new Date(row.tgl_invoice).toLocaleDateString('id-ID') : '-',
        tgl_invoice: row.tgl_invoice,
        dueDate: row.tgl_jatuh_tempo ? new Date(row.tgl_jatuh_tempo).toLocaleDateString('id-ID') : '-',
        tgl_jatuh_tempo: row.tgl_jatuh_tempo,
        total: parseFloat(row.total_netto) || 0,
        total_netto: parseFloat(row.total_netto) || 0,
        paymentMethod: row.metode_bayar || 'Tempo',
        metode_bayar: row.metode_bayar || 'Tempo',
        statusPayment: row.status_bayar || 'Belum Lunas',
        status_bayar: row.status_bayar || 'Belum Lunas',
        status: statusUi,
        status_pengiriman: row.status_pengiriman || 'Draft',
        driver: row.driver || row.nama_driver || '',
        no_sj_customer: row.no_sj_customer || '',
        time: row.status_pengiriman === 'Diterima' ? new Date(row.updated_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WITA' : '',
        dataDetail: mappedItems,
        items: mappedItems
      });
    }

    res.json({ success: true, data: result });
  }),

  // Tambah transaksi Sales Order baru
  addPenjualan: asyncHandler(async (req, res) => {
    const { dataDetail, detail_penjualan, ...dataPenjualan } = req.body;
    const itemDetail = dataDetail || detail_penjualan;

    if (!itemDetail || !Array.isArray(itemDetail) || itemDetail.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Field 'dataDetail' (array item pesanan) wajib diisi dan tidak boleh kosong."
      });
    }

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const id_pelanggan = dataPenjualan.id_pelanggan || dataPenjualan.pelanggan_id || null;
      const id_sales = dataPenjualan.id_sales || dataPenjualan.sales_id || null;
      const id_staff_pengirim = dataPenjualan.id_staff_pengirim || null;
      const no_sj_customer = dataPenjualan.no_sj_customer || null;
      const metode_bayar = dataPenjualan.metode_bayar || 'Cash';
      const status_bayar = dataPenjualan.status_bayar || 'Belum Lunas';
      const status_pengiriman = dataPenjualan.status_pengiriman || 'Draft';
      const total_netto = dataPenjualan.total_netto || 0;

      let tgl_jatuh_tempo = dataPenjualan.tgl_jatuh_tempo || null;
      if (!tgl_jatuh_tempo && metode_bayar.toLowerCase() === 'tempo') {
        const date = new Date();
        date.setDate(date.getDate() + 14);
        tgl_jatuh_tempo = date;
      }

      const [penjualan] = await connection.query(
        "INSERT INTO penjualan (id_pelanggan, id_sales, id_staff_pengirim, no_sj_customer, metode_bayar, tgl_jatuh_tempo, status_bayar, status_pengiriman, total_netto, tgl_invoice) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())", 
        [id_pelanggan, id_sales, id_staff_pengirim, no_sj_customer, metode_bayar, tgl_jatuh_tempo, status_bayar, status_pengiriman, total_netto]
      );
      const id_penjualan = penjualan.insertId;

      for (let item of itemDetail) {
        const id_produk = item.id_produk || item.produk_id;
        const qty_beli = item.qty_beli || item.qty || 1;
        const qty_dus = item.qty_dus || item.qty || 1;
        const subtotal = item.subtotal || (qty_beli * (item.harga || 0));

        await connection.query(
          "INSERT INTO detail_penjualan (id_penjualan, id_produk, qty_beli, qty_dus, subtotal) VALUES (?, ?, ?, ?, ?)", 
          [id_penjualan, id_produk, qty_beli, qty_dus, subtotal]
        );
      }

      await connection.commit();
      res.json({ success: true, message: "Transaksi Penjualan berhasil dibuat.", id_penjualan });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }),

  // Update status pengiriman / pembatalan atau tanggal jatuh tempo
  updatePenjualan: asyncHandler(async (req, res) => {
    const id = req.params.id;
    const data = {};

    if (req.body.status !== undefined) {
      const s = req.body.status.toLowerCase();
      if (s === 'approved' || s === 'diproses') data.status_pengiriman = 'Diproses';
      else if (s === 'shipped' || s === 'dikirim') data.status_pengiriman = 'Dikirim';
      else if (s === 'delivered' || s === 'diterima') data.status_pengiriman = 'Diterima';
      else if (s === 'cancelled' || s === 'batal' || s === 'dibatalkan') data.status_pengiriman = 'Dibatalkan';
    } else if (req.body.status_pengiriman !== undefined) {
      data.status_pengiriman = req.body.status_pengiriman;
    }

    if (req.body.statusBayar !== undefined) data.status_bayar = req.body.statusBayar;
    else if (req.body.status_bayar !== undefined) data.status_bayar = req.body.status_bayar;

    if (req.body.driver !== undefined) data.driver = req.body.driver;
    if (req.body.no_sj_customer !== undefined) data.no_sj_customer = req.body.no_sj_customer;
    if (req.body.tgl_jatuh_tempo !== undefined) data.tgl_jatuh_tempo = req.body.tgl_jatuh_tempo;

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const [currentRows] = await connection.query(
        "SELECT status_pengiriman FROM penjualan WHERE id_penjualan = ?",
        [id]
      );
      if (currentRows.length === 0) {
        await connection.rollback();
        return res.status(404).json({ success: false, message: "Transaksi Penjualan tidak ditemukan." });
      }
      const oldStatus = currentRows[0].status_pengiriman;

      // Approval Logic (Draft -> Diproses) => Potong Stok
      if (oldStatus === 'Draft' && data.status_pengiriman === 'Diproses') {
        const [items] = await connection.query(
          "SELECT id_produk, qty_beli FROM detail_penjualan WHERE id_penjualan = ?",
          [id]
        );

        for (let item of items) {
          const [prodRow] = await connection.query("SELECT stok_total_karton, nama_produk FROM produk WHERE id_produk = ?", [item.id_produk]);
          if (prodRow.length > 0) {
            const currentStock = prodRow[0].stok_total_karton;
            if (currentStock < item.qty_beli) {
              throw new Error(`Stok produk "${prodRow[0].nama_produk}" tidak mencukupi untuk disetujui! (Sisa stok: ${currentStock} Karton)`);
            }
          }

          await connection.query(
            "UPDATE produk SET stok_total_karton = stok_total_karton - ? WHERE id_produk = ?", 
            [item.qty_beli, item.id_produk]
          );

          await connection.query(
            "INSERT INTO riwayat_stok (id_produk, tipe_perubahan, jumlah, keterangan) VALUES (?, 'Keluar', ?, ?)", 
            [item.id_produk, item.qty_beli, `Penjualan Invoice #${id}`]
          );
        }
      }

      // Cancellation Logic (OldStatus != Dibatalkan && NewStatus == Dibatalkan) => Restorasi Stok jika sudah pernah disetujui
      if (oldStatus !== 'Dibatalkan' && data.status_pengiriman === 'Dibatalkan') {
        if (oldStatus === 'Diproses' || oldStatus === 'Dikirim' || oldStatus === 'Diterima') {
          const [items] = await connection.query(
            "SELECT id_produk, qty_beli FROM detail_penjualan WHERE id_penjualan = ?",
            [id]
          );
          for (let item of items) {
            await connection.query(
              "UPDATE produk SET stok_total_karton = stok_total_karton + ? WHERE id_produk = ?",
              [item.qty_beli, item.id_produk]
            );
            await connection.query(
              "INSERT INTO riwayat_stok (id_produk, tipe_perubahan, jumlah, keterangan) VALUES (?, 'Masuk', ?, ?)",
              [item.id_produk, item.qty_beli, `Pengembalian Stok (Batal Order #${id})`]
            );
          }
        }
      }

      const fields = [];
      const values = [];

      if (data.status_pengiriman !== undefined) { fields.push("status_pengiriman = ?"); values.push(data.status_pengiriman); }
      if (data.status_bayar !== undefined) { fields.push("status_bayar = ?"); values.push(data.status_bayar); }
      if (data.driver !== undefined) { fields.push("driver = ?"); values.push(data.driver); }
      if (data.no_sj_customer !== undefined) { fields.push("no_sj_customer = ?"); values.push(data.no_sj_customer); }
      if (data.tgl_jatuh_tempo !== undefined) { fields.push("tgl_jatuh_tempo = ?"); values.push(data.tgl_jatuh_tempo); }

      if (fields.length > 0) {
        fields.push("updated_at = NOW()");
        values.push(id);
        await connection.query(
          `UPDATE penjualan SET ${fields.join(', ')} WHERE id_penjualan = ?`,
          values
        );
      }

      await connection.commit();
      res.json({ success: true, message: "Transaksi Penjualan berhasil diperbarui." });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }),

  // Hapus transaksi Penjualan (Hapus permanent)
  deletePenjualan: asyncHandler(async (req, res) => {
    const id = req.params.id;
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      await connection.query("DELETE FROM detail_penjualan WHERE id_penjualan = ?", [id]);
      await connection.query("DELETE FROM pembayaran_penjualan WHERE id_penjualan = ?", [id]);
      await connection.query("DELETE FROM penjualan WHERE id_penjualan = ?", [id]);
      await connection.commit();
      res.json({ success: true, message: "Transaksi Penjualan berhasil dihapus." });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }),

  // Get all pembayaran piutang (Termasuk invoice penjualan yang ada / belum ada installment)
  getAllPembayaran: asyncHandler(async (req, res) => {
    const query = `
      SELECT 
        pb.id_pembayaran,
        p.id_penjualan,
        p.total_netto,
        p.metode_bayar as penjualan_metode,
        p.status_bayar as penjualan_status_bayar,
        p.tgl_invoice,
        pb.jumlah_bayar,
        pb.metode_bayar as pembayaran_metode,
        pb.status_pembayaran,
        pb.tgl_bayar,
        pb.bukti_bayar,
        pel.nama_bengkel,
        u.nama as nama_sales
      FROM penjualan p
      LEFT JOIN pembayaran_penjualan pb ON p.id_penjualan = pb.id_penjualan
      LEFT JOIN pelanggan pel ON p.id_pelanggan = pel.id_pelanggan
      LEFT JOIN users u ON p.id_sales = u.id
      ORDER BY p.id_penjualan DESC, pb.id_pembayaran DESC
    `;
    const [rows] = await db.query(query);
    const data = rows.map(r => {
      const statusRaw = r.status_pembayaran || (r.penjualan_status_bayar === 'Lunas' ? 'Disetujui' : 'Pending');
      let statusMapped = 'Pending';
      if (statusRaw === 'Disetujui' || statusRaw === 'Approved') statusMapped = 'Disetujui';
      else if (statusRaw === 'Pending' || statusRaw === 'Menunggu') statusMapped = 'Pending';
      else if (statusRaw === 'Ditolak' || statusRaw === 'Rejected') statusMapped = 'Ditolak';

      const nominal = r.jumlah_bayar !== null && r.jumlah_bayar !== undefined ? parseFloat(r.jumlah_bayar) : Math.round(parseFloat(r.total_netto) || 0);

      return {
        id_pembayaran: r.id_pembayaran || `INV-${r.id_penjualan}`,
        id_penjualan: r.id_penjualan,
        no_so: `INV-${String(r.id_penjualan).padStart(4, '0')}`,
        bengkel: r.nama_bengkel || 'Bengkel Umum',
        nama_bengkel: r.nama_bengkel || 'Bengkel Umum',
        customer: r.nama_bengkel || 'Bengkel Umum',
        sales: r.nama_sales || 'Sales Staff',
        nama_sales: r.nama_sales || 'Sales Staff',
        jumlah_bayar: nominal,
        metode_bayar: r.pembayaran_metode || r.penjualan_metode || 'Tempo',
        status_pembayaran: statusMapped,
        tgl_pembayaran: r.tgl_bayar || r.tgl_invoice,
        tgl_bayar: (r.tgl_bayar || r.tgl_invoice) ? new Date(r.tgl_bayar || r.tgl_invoice).toLocaleDateString('id-ID') : '-',
        bukti_bayar: r.bukti_bayar || null,
        created_at: r.tgl_bayar || r.tgl_invoice
      };
    });
    res.json({ success: true, data });
  }),

  // Get pembayaran by penjualan id
  getPembayaran: asyncHandler(async (req, res) => {
    const id_penjualan = req.params.id;
    const query = "SELECT * FROM pembayaran_penjualan WHERE id_penjualan = ? ORDER BY id_pembayaran DESC";
    const [rows] = await db.query(query, [id_penjualan]);
    res.json({ success: true, data: rows });
  }),

  // Add pembayaran piutang new record
  addPembayaran: asyncHandler(async (req, res) => {
    const id_penjualan = req.params.id;
    const { jumlah_bayar, metode_bayar, bukti_bayar, tgl_bayar } = req.body;

    const [result] = await db.query(
      "INSERT INTO pembayaran_penjualan (id_penjualan, jumlah_bayar, metode_bayar, status_pembayaran, bukti_bayar, tgl_bayar) VALUES (?, ?, ?, 'Menunggu', ?, ?)",
      [id_penjualan, jumlah_bayar || 0, metode_bayar || 'Transfer', bukti_bayar || null, tgl_bayar || new Date()]
    );

    res.json({ success: true, message: "Pembayaran berhasil dicatat. Menunggu verifikasi Admin.", id_pembayaran: result.insertId });
  }),

  // Update status pembayaran (Disetujui / Ditolak) and check if invoice is fully paid
  updateStatusPembayaran: asyncHandler(async (req, res) => {
    const idPembayaran = req.params.idPembayaran;
    const { status_pembayaran } = req.body; // 'Disetujui' or 'Ditolak'

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const [pembayaranRows] = await connection.query("SELECT id_penjualan, jumlah_bayar FROM pembayaran_penjualan WHERE id_pembayaran = ?", [idPembayaran]);
      if (pembayaranRows.length === 0) {
        await connection.rollback();
        return res.status(404).json({ success: false, message: "Data pembayaran tidak ditemukan." });
      }

      const id_penjualan = pembayaranRows[0].id_penjualan;

      await connection.query("UPDATE pembayaran_penjualan SET status_pembayaran = ? WHERE id_pembayaran = ?", [status_pembayaran, idPembayaran]);

      if (status_pembayaran === 'Disetujui' || status_pembayaran === 'Approved') {
        const [sumRows] = await connection.query(
          "SELECT SUM(jumlah_bayar) as total_approved FROM pembayaran_penjualan WHERE id_penjualan = ? AND (status_pembayaran = 'Disetujui' OR status_pembayaran = 'Approved')",
          [id_penjualan]
        );
        const [penjualanRows] = await connection.query("SELECT total_netto FROM penjualan WHERE id_penjualan = ?", [id_penjualan]);

        const totalApproved = parseFloat(sumRows[0].total_approved) || 0;
        const totalNetto = parseFloat(penjualanRows[0]?.total_netto) || 0;

        if (totalApproved >= totalNetto && totalNetto > 0) {
          await connection.query("UPDATE penjualan SET status_bayar = 'Lunas' WHERE id_penjualan = ?", [id_penjualan]);
        }
      }

      await connection.commit();
      res.json({ success: true, message: "Status pembayaran berhasil diperbarui." });
    } catch(err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  })
};