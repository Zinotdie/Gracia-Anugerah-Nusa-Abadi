const mysql = require('mysql2');
require('dotenv').config();

// Konfigurasi connection pool database MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS !== undefined ? process.env.DB_PASS : (process.env.DB_PASSWORD || ''),
  database: process.env.DB_NAME || 'gana_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Ekspor koneksi database berbasis promise (async/await)
const db = pool.promise();

// Cek status verifikasi koneksi awal
pool.getConnection((err, connection) => {
  if (err) {
    console.error('[Database Connection Failed]:', err.message);
  } else {
    console.log('[Database Connection]: Connected to MySQL database successfully.');
    connection.release();
  }
});

module.exports = db;