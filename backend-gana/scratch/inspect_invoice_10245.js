const db = require('../config/db');

async function inspectInvoice() {
  const [penjualan] = await db.query("SELECT * FROM penjualan WHERE id_penjualan = 10245");
  console.log("PENJUALAN RECORD 10245:", penjualan);

  const [pembayaran] = await db.query("SELECT * FROM pembayaran_penjualan WHERE id_penjualan = 10245");
  console.log("PEMBAYARAN RECORDS 10245:", pembayaran);

  const [sumRes] = await db.query("SELECT SUM(jumlah_bayar) AS total_dibayar FROM pembayaran_penjualan WHERE id_penjualan = 10245 AND status_pembayaran IN ('Disetujui', 'Approved', 'Lunas')");
  console.log("SUM APPROVED PAYMENTS:", sumRes);

  process.exit(0);
}

inspectInvoice().catch(console.error);
