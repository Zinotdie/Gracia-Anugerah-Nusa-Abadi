# 📌 Panduan Menggunakan Postman Collection - PT. GANA Backend

## 1. Import Collection ke Postman

### Di Postman Desktop/Web:
1. Buka Postman
2. Klik **Collections** (di sidebar kiri)
3. Klik tombol **Import**
4. Pilih file `POSTMAN_COLLECTION.json` atau copy-paste isi file

Atau gunakan link di Postman Web:
- Klik **File** → **Import** → Pilih file

---

## 2. Setup Token untuk Autentikasi

### Langkah 1: Login Terlebih Dahulu
1. Buka collection **Authentication** → **Login**
2. Lihat Body, isikan data sesuai user di database:
   ```json
   {
     "username": "admin@gana",
     "password": "password123",
     "role": "admin"
   }
   ```
3. Klik **Send**

### Langkah 2: Copy Token dari Response
Jika login berhasil, response akan seperti:
```json
{
  "success": true,
  "message": "Login Berhasil!",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "id": 1,
    "username": "admin@gana",
    "role": "admin",
    "nama": "Admin Utama"
  }
}
```

### Langkah 3: Masukkan Token ke Variable
1. Setelah dapat token, ke tab **Variables** di collection
2. Di variable `token`, paste token dari response login
3. Semua endpoint akan otomatis menggunakan token ini

---

## 3. Format Endpoint & Response

### Success Response (200 OK)
```json
{
  "success": true,
  "data": [...],
  "message": "..."
}
```

### Error Response (401/403/500)
```json
{
  "success": false,
  "message": "Akses Ditolak! Anda belum login (Token tidak ada)."
}
```

---

## 4. Daftar Semua Endpoint

### 🔐 Authentication (Tanpa Token)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/auth/login` | Login user |

### 📋 Alamat (Dengan Token)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/alamat` | Ambil semua alamat |
| POST | `/api/alamat` | Tambah alamat baru |
| PUT | `/api/alamat/:id` | Update alamat |
| DELETE | `/api/alamat/:id` | Hapus alamat |

**Request Body (POST/PUT):**
```json
{
  "id_pelanggan": 1,
  "label_alamat": "Kantor Pusat",
  "detail_alamat": "Jl. Merdeka No. 123",
  "kota_kab": "Makassar",
  "telp_bengkel": "08123456789"
}
```

---

### 📦 Produk (Dengan Token)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/produk` | Ambil semua produk |
| POST | `/api/produk` | Tambah produk baru |

**Request Body (POST):**
```json
{
  "id_kategori": 1,
  "nama_produk": "Oli Motor Castrol",
  "harga_jual": 75000,
  "harga_beli": 50000
}
```

---

### 🏷️ Kategori (Dengan Token)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/kategori` | Ambil semua kategori |
| POST | `/api/kategori` | Tambah kategori baru |

**Request Body (POST):**
```json
{
  "nama_kategori": "Oli & Pelumas"
}
```

---

### 🏭 Supplier (Dengan Token)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/supplier` | Ambil semua supplier |
| POST | `/api/supplier` | Tambah supplier baru |

**Request Body (POST):**
```json
{
  "nama_supplier": "PT Akses Motor Supply",
  "alamat": "Jl. Industry No. 100",
  "kontak": "08123456789",
  "email": "info@akses-motor.com"
}
```

---

### 👥 Pelanggan (Dengan Token)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/pelanggan` | Ambil semua pelanggan |
| POST | `/api/pelanggan` | Tambah pelanggan baru |

**Request Body (POST):**
```json
{
  "nama_bengkel": "Bengkel Maju Jaya",
  "kontak_bengkel": "08123456789",
  "kategori_bengkel": "Resmi"
}
```

---

### 🛍️ Pembelian (Dengan Token)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/pembelian` | Ambil semua pembelian |
| POST | `/api/pembelian` | Tambah pembelian baru |

**Request Body (POST):**
```json
{
  "id_supplier": 1,
  "tanggal_pembelian": "2026-05-26",
  "total_harga": 500000,
  "status_pembayaran": "Lunas"
}
```

---

### 💰 Penjualan (Dengan Token)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/penjualan` | Ambil semua penjualan |
| POST | `/api/penjualan` | Tambah penjualan baru |

**Request Body (POST):**
```json
{
  "id_produk": 1,
  "id_pelanggan": 1,
  "jumlah": 5,
  "harga_satuan": 75000,
  "total_harga": 375000,
  "tanggal_penjualan": "2026-05-26"
}
```

---

### 📦 Stok (Dengan Token)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/stok` | Ambil semua stok |
| POST | `/api/stok` | Tambah stok baru |

**Request Body (POST):**
```json
{
  "id_produk": 1,
  "jumlah_stok": 100,
  "tanggal_input": "2026-05-26"
}
```

---

### 👨‍💼 User Management (Dengan Token)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/admins` | Ambil semua admin |
| GET | `/api/sales` | Ambil semua sales |
| GET | `/api/owners` | Ambil semua owner |
| GET | `/api/staff` | Ambil semua staff gudang |
| GET | `/api/kepala` | Ambil semua kepala gudang |

---

### 📍 Kunjungan (Dengan Token)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/kunjungan` | Ambil semua kunjungan |

---

### 🏥 Health Check (Tanpa Token)
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/health` | Cek status server & database |

---

## 5. Testing dengan Contoh

### Contoh 1: Tambah Alamat
1. Login terlebih dahulu → Copy token ke variable
2. Buka **Alamat** → **Add Alamat**
3. Ubah Body sesuai kebutuhan:
   ```json
   {
     "id_pelanggan": 1,
     "label_alamat": "Cabang Baru",
     "detail_alamat": "Jl. Sudirman No. 456",
     "kota_kab": "Gowa",
     "telp_bengkel": "08134567890"
   }
   ```
4. Klik **Send**

### Contoh 2: Update Alamat
1. Buka **Alamat** → **Update Alamat**
2. Ganti ID di URL dari `1` ke ID yang ingin diupdate
3. Ubah Body data yang ingin diubah
4. Klik **Send**

### Contoh 3: Hapus Alamat
1. Buka **Alamat** → **Delete Alamat**
2. Ganti ID di URL dari `1` ke ID yang ingin dihapus
3. Klik **Send**

---

## 6. Penting ⚠️

- **Semua endpoint kecuali Login & Health Check memerlukan Token**
- Token berlaku **8 jam** (bisa diubah di `authController.js`)
- Jika token expired, login ulang
- Header `Authorization` format: `Bearer <token>` (otomatis dari variable)
- Pastikan backend running di `http://localhost:5000`
- Database harus terkoneksi dengan baik

---

## 7. Troubleshooting

### ❌ Error: "Token tidak ada"
✅ Solusi: Login terlebih dahulu, copy token ke variable

### ❌ Error: "Sesi habis atau Token tidak valid"
✅ Solusi: Login ulang, token sudah expired (8 jam)

### ❌ Error: "Cannot GET /api/alamat"
✅ Solusi: Backend belum running, jalankan `npm run dev`

### ❌ Error: "connect ECONNREFUSED"
✅ Solusi: Backend tidak running atau port tidak sesuai

---

## 📞 Kontak Support
Untuk bantuan lebih lanjut, hubungi tim development PT. GANA
