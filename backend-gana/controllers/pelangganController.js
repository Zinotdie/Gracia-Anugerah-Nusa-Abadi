const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

// Controller Management Pelanggan Bengkel (Direct MySQL Queries)
module.exports = {
  getAllPelanggan: asyncHandler(async (req, res) => {
    const query = `
      SELECT 
        p.id_pelanggan, 
        p.username, 
        p.nama_bengkel, 
        p.is_active,
        ab.detail_alamat AS address,
        ab.telp_bengkel AS phone,
        ab.kota_kab AS city,
        COALESCE(
          (SELECT SUM(pen.total_netto) 
           FROM penjualan pen 
           WHERE pen.id_pelanggan = p.id_pelanggan 
             AND pen.metode_bayar = 'Tempo' 
             AND pen.status_bayar = 'Belum Lunas'
          ), 0
        ) AS outstanding
      FROM pelanggan p
      LEFT JOIN (
        SELECT a1.* FROM alamat_bengkel a1
        INNER JOIN (
          SELECT id_pelanggan, MIN(id_alamat) as min_id
          FROM alamat_bengkel
          GROUP BY id_pelanggan
        ) a2 ON a1.id_alamat = a2.min_id
      ) ab ON p.id_pelanggan = ab.id_pelanggan
      WHERE p.is_active = TRUE
    `;
    const [rows] = await db.query(query);

    const data = rows.map(r => ({
      id: r.id_pelanggan,
      id_pelanggan: r.id_pelanggan,
      name: r.nama_bengkel,
      nama: r.nama_bengkel,
      nama_bengkel: r.nama_bengkel,
      username: r.username,
      address: r.address || '',
      alamat: r.address || '',
      phone: r.phone || '',
      telepon: r.phone || '',
      city: r.city || '',
      kota: r.city || '',
      outstanding: parseFloat(r.outstanding) || 0,
      status: r.is_active ? 'Active' : 'Inactive',
      is_active: r.is_active
    }));

    res.json({ success: true, data });
  }),

  addPelanggan: asyncHandler(async (req, res) => {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const data = req.body;
      const nama_bengkel = data.name || data.nama || data.nama_bengkel || '';
      const rawUsername = data.username || nama_bengkel.toLowerCase().replace(/[^a-z0-9]/g, '_');
      
      let username = rawUsername;
      let isUnique = false;
      let counter = 1;
      while (!isUnique) {
        const [existing] = await connection.query("SELECT id_pelanggan FROM pelanggan WHERE username = ?", [username]);
        if (existing.length === 0) {
          isUnique = true;
        } else {
          username = `${rawUsername}_${counter}`;
          counter++;
        }
      }

      const password = data.password || 'password123';
      const is_active = (data.status === 'Active' || data.is_active === true || data.is_active === 1 || data.is_active === undefined);

      const [pelangganRes] = await connection.query(
        "INSERT INTO pelanggan (username, password, nama_bengkel, is_active) VALUES (?, ?, ?, ?)",
        [username, password, nama_bengkel, is_active]
      );
      const id_pelanggan = pelangganRes.insertId;

      const detail_alamat = data.address || data.alamat || '';
      const telp_bengkel = data.phone || data.telepon || '';
      const kota_kab = data.city || data.kota || 'Banjarmasin';

      await connection.query(
        "INSERT INTO alamat_bengkel (id_pelanggan, label_alamat, detail_alamat, kota_kab, telp_bengkel) VALUES (?, 'Utama', ?, ?, ?)",
        [id_pelanggan, detail_alamat, kota_kab, telp_bengkel]
      );

      await connection.commit();
      res.json({ success: true, message: "Pelanggan bengkel berhasil ditambahkan!" });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }),

  updatePelanggan: asyncHandler(async (req, res) => {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const id = req.params.id;
      const data = req.body;

      const nama_bengkel = data.name || data.nama || data.nama_bengkel;
      const is_active = data.status ? (data.status === 'Active') : (data.is_active !== undefined ? !!data.is_active : true);
      
      let updateFields = [];
      let updateValues = [];

      if (nama_bengkel !== undefined) {
        updateFields.push("nama_bengkel = ?");
        updateValues.push(nama_bengkel);
      }
      if (data.username !== undefined) {
        updateFields.push("username = ?");
        updateValues.push(data.username);
      }
      if (data.password !== undefined && data.password !== '') {
        updateFields.push("password = ?");
        updateValues.push(data.password);
      }
      updateFields.push("is_active = ?");
      updateValues.push(is_active);

      if (updateFields.length > 0) {
        updateValues.push(id);
        await connection.query(
          `UPDATE pelanggan SET ${updateFields.join(', ')} WHERE id_pelanggan = ?`,
          updateValues
        );
      }

      const detail_alamat = data.address || data.alamat;
      const telp_bengkel = data.phone || data.telepon;
      const kota_kab = data.city || data.kota;

      if (detail_alamat !== undefined || telp_bengkel !== undefined || kota_kab !== undefined) {
        const [existingAddress] = await connection.query("SELECT id_alamat FROM alamat_bengkel WHERE id_pelanggan = ? ORDER BY id_alamat ASC LIMIT 1", [id]);
        if (existingAddress.length > 0) {
          let addrFields = [];
          let addrValues = [];
          if (detail_alamat !== undefined) { addrFields.push("detail_alamat = ?"); addrValues.push(detail_alamat); }
          if (telp_bengkel !== undefined) { addrFields.push("telp_bengkel = ?"); addrValues.push(telp_bengkel); }
          if (kota_kab !== undefined) { addrFields.push("kota_kab = ?"); addrValues.push(kota_kab); }

          if (addrFields.length > 0) {
            addrValues.push(existingAddress[0].id_alamat);
            await connection.query(
              `UPDATE alamat_bengkel SET ${addrFields.join(', ')} WHERE id_alamat = ?`,
              addrValues
            );
          }
        } else {
          await connection.query(
            "INSERT INTO alamat_bengkel (id_pelanggan, label_alamat, detail_alamat, kota_kab, telp_bengkel) VALUES (?, 'Utama', ?, ?, ?)",
            [id, detail_alamat || '', kota_kab || 'Banjarmasin', telp_bengkel || '']
          );
        }
      }

      await connection.commit();
      res.json({ success: true, message: "Pelanggan diupdate!" });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }),

  deletePelanggan: asyncHandler(async (req, res) => {
    await db.query("UPDATE pelanggan SET is_active = FALSE WHERE id_pelanggan=?", [req.params.id]);
    res.json({ success: true, message: "Pelanggan dihapus!" });
  })
};