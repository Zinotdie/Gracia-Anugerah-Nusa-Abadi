const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

function formatBrand(brandStr) {
  if (!brandStr) return 'Kixx';
  return String(brandStr).trim();
}

async function resolveCategoryId(kategoriName) {
  if (!kategoriName) return null;
  const [rows] = await db.query("SELECT id_kategori FROM kategori WHERE nama_kategori = ?", [kategoriName]);
  if (rows.length > 0) {
    return rows[0].id_kategori;
  }
  const [res] = await db.query("INSERT INTO kategori (nama_kategori) VALUES (?)", [kategoriName]);
  return res.insertId;
}

module.exports = {
  getAllProduk: asyncHandler(async (req, res) => {
    const query = `
      SELECT p.*, k.nama_kategori AS kategori_name 
      FROM produk p
      LEFT JOIN kategori k ON p.id_kategori = k.id_kategori
    `;
    const [rows] = await db.query(query);
    const data = rows.map(r => {
      const liters = parseFloat(r.kemasan) || 4;
      return {
        id: r.id_produk,
        id_produk: r.id_produk,
        id_kategori: r.id_kategori,
        kategori: r.kategori_name || 'Gasoline',
        brand: r.brand,
        name: r.nama_produk,
        nama: r.nama_produk,
        nama_produk: r.nama_produk,
        sae: r.sae,
        kemasan: r.kemasan,
        grade: r.grade,
        tipe_kendaraan: r.tipe_kendaraan,
        harga: parseFloat(r.harga_het) || 0,
        harga_het: parseFloat(r.harga_het) || 0,
        stokKarton: parseInt(r.stok_total_karton) || 0,
        stok_total_karton: parseInt(r.stok_total_karton) || 0,
        stokLiter: (parseInt(r.stok_total_karton) || 0) * liters
      };
    });
    res.json({ success: true, data });
  }),

  getProdukById: asyncHandler(async (req, res) => {
    const query = `
      SELECT p.*, k.nama_kategori AS kategori_name 
      FROM produk p
      LEFT JOIN kategori k ON p.id_kategori = k.id_kategori
      WHERE p.id_produk = ?
    `;
    const [rows] = await db.query(query, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: "Produk tidak ditemukan." });
    const r = rows[0];
    const liters = parseFloat(r.kemasan) || 4;
    const data = {
      id: r.id_produk,
      id_produk: r.id_produk,
      id_kategori: r.id_kategori,
      kategori: r.kategori_name || 'Gasoline',
      brand: r.brand,
      name: r.nama_produk,
      nama: r.nama_produk,
      nama_produk: r.nama_produk,
      sae: r.sae,
      kemasan: r.kemasan,
      grade: r.grade,
      tipe_kendaraan: r.tipe_kendaraan,
      harga: parseFloat(r.harga_het) || 0,
      harga_het: parseFloat(r.harga_het) || 0,
      stokKarton: parseInt(r.stok_total_karton) || 0,
      stok_total_karton: parseInt(r.stok_total_karton) || 0,
      stokLiter: (parseInt(r.stok_total_karton) || 0) * liters
    };
    res.json({ success: true, data });
  }),

  addProduk: asyncHandler(async (req, res) => {
    const data = req.body;
    let id_kategori = data.id_kategori;
    if (!id_kategori && data.kategori) {
      id_kategori = await resolveCategoryId(data.kategori);
    }

    const brand = formatBrand(data.brand);
    const nama_produk = data.nama_produk || data.name || data.nama || '';
    const sae = data.sae || '';
    const kemasan = data.kemasan || '4L';
    const grade = data.grade || '';
    const tipe_kendaraan = data.tipe_kendaraan || '';
    const harga_het = data.harga_het !== undefined ? data.harga_het : (data.harga !== undefined ? data.harga : 0);
    const stok_total_karton = data.stok_total_karton !== undefined ? data.stok_total_karton : (data.stokKarton !== undefined ? data.stokKarton : 0);

    const query = "INSERT INTO produk (id_kategori, brand, nama_produk, sae, kemasan, grade, tipe_kendaraan, harga_het, stok_total_karton) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
    await db.query(query, [id_kategori, brand, nama_produk, sae, kemasan, grade, tipe_kendaraan, harga_het, stok_total_karton]);
    res.json({ success: true, message: "Produk berhasil ditambah!" });
  }),

  updateProduk: asyncHandler(async (req, res) => {
    const id = req.params.id;
    const data = req.body;
    let id_kategori = data.id_kategori;
    if (!id_kategori && data.kategori) {
      id_kategori = await resolveCategoryId(data.kategori);
    }

    const brand = data.brand !== undefined ? formatBrand(data.brand) : undefined;
    const nama_produk = data.nama_produk || data.name || data.nama;
    const sae = data.sae;
    const kemasan = data.kemasan;
    const grade = data.grade;
    const tipe_kendaraan = data.tipe_kendaraan;
    const harga_het = data.harga_het !== undefined ? data.harga_het : data.harga;
    const stok_total_karton = data.stok_total_karton !== undefined ? data.stok_total_karton : data.stokKarton;

    let fields = [];
    let values = [];

    if (id_kategori !== undefined) { fields.push("id_kategori=?"); values.push(id_kategori); }
    if (brand !== undefined) { fields.push("brand=?"); values.push(brand); }
    if (nama_produk !== undefined) { fields.push("nama_produk=?"); values.push(nama_produk); }
    if (sae !== undefined) { fields.push("sae=?"); values.push(sae); }
    if (kemasan !== undefined) { fields.push("kemasan=?"); values.push(kemasan); }
    if (grade !== undefined) { fields.push("grade=?"); values.push(grade); }
    if (tipe_kendaraan !== undefined) { fields.push("tipe_kendaraan=?"); values.push(tipe_kendaraan); }
    if (harga_het !== undefined) { fields.push("harga_het=?"); values.push(harga_het); }
    if (stok_total_karton !== undefined) { fields.push("stok_total_karton=?"); values.push(stok_total_karton); }

    if (fields.length > 0) {
      values.push(id);
      const query = `UPDATE produk SET ${fields.join(', ')} WHERE id_produk=?`;
      await db.query(query, values);
    }

    res.json({ success: true, message: "Produk diupdate!" });
  }),

  deleteProduk: asyncHandler(async (req, res) => {
    await db.query("DELETE FROM produk WHERE id_produk = ?", [req.params.id]);
    res.json({ success: true, message: "Produk dihapus!" });
  })
};