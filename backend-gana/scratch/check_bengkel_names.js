const db = require('../config/db');

async function checkBengkelNames() {
  const [penjualanRows] = await db.query(`
    SELECT p.id_penjualan, p.id_pelanggan, pel.nama_bengkel
    FROM penjualan p
    LEFT JOIN pelanggan pel ON p.id_pelanggan = pel.id_pelanggan
    LIMIT 20
  `);
  console.log("PENJUALAN SAMPLES WITH PELANGGAN:", penjualanRows);

  const [pelangganRows] = await db.query("SELECT id_pelanggan, nama_bengkel FROM pelanggan");
  console.log("ALL PELANGGAN IN DATABASE:", pelangganRows);

  process.exit(0);
}

checkBengkelNames().catch(console.error);
