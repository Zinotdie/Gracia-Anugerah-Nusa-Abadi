const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

async function getWithAchievement(sales_id, bulan) {
  const [targets] = await db.query(
    `SELECT tp.*, s.nama AS nama_sales 
     FROM target_penjualan tp 
     LEFT JOIN users s ON tp.sales_id = s.id 
     WHERE (tp.sales_id = ? OR tp.sales_id IS NULL) AND tp.bulan = ?
     ORDER BY tp.sales_id DESC LIMIT 1`,
    [sales_id, bulan]
  );

  if (targets.length === 0) return null;
  const target = targets[0];

  const [revenueRows] = await db.query(
    `SELECT COALESCE(SUM(total_netto), 0) AS achieved_revenue 
     FROM penjualan 
     WHERE (id_sales = ? OR ? IS NULL) 
       AND DATE_FORMAT(tgl_invoice, '%Y-%m') = ? 
       AND status_pengiriman != 'Cancelled'`,
    [sales_id, sales_id, bulan]
  );

  const [volumeRows] = await db.query(
    `SELECT COALESCE(SUM(dp.qty_beli), 0) AS achieved_volume
     FROM detail_penjualan dp
     JOIN penjualan p ON dp.id_penjualan = p.id_penjualan
     WHERE (p.id_sales = ? OR ? IS NULL) 
       AND DATE_FORMAT(p.tgl_invoice, '%Y-%m') = ?
       AND p.status_pengiriman != 'Cancelled'`,
    [sales_id, sales_id, bulan]
  );

  const [focalProducts] = await db.query(
    `SELECT tpf.produk_id, pr.brand, pr.nama_produk, tpf.target_qty,
            COALESCE((
              SELECT SUM(dp2.qty_beli)
              FROM detail_penjualan dp2
              JOIN penjualan p2 ON dp2.id_penjualan = p2.id_penjualan
              WHERE (p2.id_sales = ? OR ? IS NULL)
                AND DATE_FORMAT(p2.tgl_invoice, '%Y-%m') = ?
                AND dp2.id_produk = tpf.produk_id
                AND p2.status_pengiriman != 'Cancelled'
            ), 0) AS achieved
     FROM target_produk_fokus tpf
     JOIN produk pr ON tpf.produk_id = pr.id_produk
     WHERE tpf.target_id = ?`,
    [sales_id, sales_id, bulan, target.id]
  );

  const now = new Date();
  const lastDay = new Date(bulan + '-01');
  lastDay.setMonth(lastDay.getMonth() + 1);
  lastDay.setDate(0);
  const daysRemaining = Math.max(0, Math.ceil((lastDay - now) / (1000 * 60 * 60 * 24)));

  const bulanDate = new Date(bulan + '-01');
  const bulanFormatted = bulanDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  const targetRevenue = parseFloat(target.target_omset || 0);
  const achievedRevenue = parseFloat(revenueRows[0].achieved_revenue || 0);
  const targetVolume = parseInt(target.target_volume || 0);
  const achievedVolume = parseInt(volumeRows[0].achieved_volume || 0);

  return {
    bulan: bulanFormatted,
    daysRemaining,
    nama_sales: target.nama_sales || 'Sales',
    targetRevenue,
    achievedRevenue,
    targetVolume,
    targetDus: targetVolume,
    achievedVolume,
    achievedDus: achievedVolume,
    focalProducts: focalProducts.map(fp => ({
      produk_id: fp.produk_id,
      brand: fp.brand,
      name: fp.nama_produk,
      target: fp.target_qty,
      achieved: parseInt(fp.achieved)
    }))
  };
}

// Controller Target Penjualan & Performa Sales (Direct MySQL Queries)
module.exports = {
  getTarget: asyncHandler(async (req, res) => {
    const { role, id: tokenId } = req.user;
    const bulan = req.query.bulan || new Date().toISOString().slice(0, 7);

    if (role === 'sales') {
      const data = await getWithAchievement(tokenId, bulan);
      if (!data) {
        return res.json({
          success: true,
          data: {
            sales_id: tokenId,
            bulan,
            targetRevenue: 0,
            targetVolume: 0,
            achievedRevenue: 0,
            achievedVolume: 0,
            message: `Target untuk bulan ${bulan} belum dikonfigurasi oleh Admin.`
          }
        });
      }
      return res.json({ success: true, data });

    } else if (role === 'admin' || role === 'owner') {
      if (req.query.sales_id) {
        const data = await getWithAchievement(req.query.sales_id, bulan);
        if (!data) {
          return res.json({
            success: true,
            data: {
              sales_id: req.query.sales_id,
              bulan,
              targetRevenue: 0,
              targetVolume: 0,
              achievedRevenue: 0,
              achievedVolume: 0,
              message: `Target untuk sales_id ${req.query.sales_id} pada bulan ${bulan} belum dikonfigurasi.`
            }
          });
        }
        return res.json({ success: true, data });
      }

      const [allTargets] = await db.query(
        `SELECT tp.*, s.nama AS nama_sales 
         FROM target_penjualan tp 
         LEFT JOIN users s ON tp.sales_id = s.id 
         WHERE tp.bulan = ?
         ORDER BY s.nama ASC`,
        [bulan]
      );
      return res.json({ success: true, bulan, data: allTargets });

    } else {
      return res.status(403).json({ success: false, message: "Akses ditolak." });
    }
  }),

  createTarget: asyncHandler(async (req, res) => {
    const { role } = req.user;

    if (role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Hanya Admin yang dapat membuat atau memperbarui target penjualan."
      });
    }

    const { sales_id, bulan, target_omset, target_volume, focal_products } = req.body;

    if (!bulan || target_omset === undefined || target_volume === undefined) {
      return res.status(400).json({
        success: false,
        message: "Field 'bulan', 'target_omset', dan 'target_volume' wajib diisi."
      });
    }

    if (!/^\d{4}-\d{2}$/.test(bulan)) {
      return res.status(400).json({
        success: false,
        message: "Format 'bulan' tidak valid. Gunakan format YYYY-MM (contoh: '2026-06')."
      });
    }

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const [existing] = await connection.query(
        'SELECT id FROM target_penjualan WHERE sales_id = ? AND bulan = ?',
        [sales_id || null, bulan]
      );

      let target_id;
      if (existing.length > 0) {
        target_id = existing[0].id;
        await connection.query(
          'UPDATE target_penjualan SET target_omset = ?, target_volume = ?, updated_at = NOW() WHERE id = ?',
          [target_omset, target_volume, target_id]
        );
        await connection.query('DELETE FROM target_produk_fokus WHERE target_id = ?', [target_id]);
      } else {
        const [result] = await connection.query(
          'INSERT INTO target_penjualan (sales_id, bulan, target_omset, target_volume) VALUES (?, ?, ?, ?)',
          [sales_id || null, bulan, target_omset, target_volume]
        );
        target_id = result.insertId;
      }

      if (focal_products && Array.isArray(focal_products) && focal_products.length > 0) {
        for (const fp of focal_products) {
          await connection.query(
            'INSERT INTO target_produk_fokus (target_id, produk_id, target_qty) VALUES (?, ?, ?)',
            [target_id, fp.produk_id, fp.target_qty]
          );
        }
      }

      await connection.commit();
      const msg = existing.length > 0 ? `Target bulan ${bulan} berhasil diperbarui.` : `Target bulan ${bulan} berhasil dibuat.`;
      res.json({ success: true, message: msg, target_id });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  })
};
