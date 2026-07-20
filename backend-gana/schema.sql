-- SQL Schema for PT. GANA Database (gana_db)
-- Generated from backend model code to assist in frontend-backend integration

CREATE DATABASE IF NOT EXISTS gana_db;
USE gana_db;

-- 1. Tabel Kategori
CREATE TABLE IF NOT EXISTS kategori (
    id_kategori INT AUTO_INCREMENT PRIMARY KEY,
    nama_kategori VARCHAR(255) NOT NULL
) ENGINE=InnoDB;

-- 2. Tabel Produk
CREATE TABLE IF NOT EXISTS produk (
    id_produk INT AUTO_INCREMENT PRIMARY KEY,
    id_kategori INT,
    brand VARCHAR(255),
    nama_produk VARCHAR(255) NOT NULL,
    sae VARCHAR(50),
    kemasan VARCHAR(50),
    grade VARCHAR(50),
    tipe_kendaraan VARCHAR(100),
    harga_het DECIMAL(15,2),
    stok_total_karton INT DEFAULT 0,
    FOREIGN KEY (id_kategori) REFERENCES kategori(id_kategori) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 3. Tabel Pelanggan
CREATE TABLE IF NOT EXISTS pelanggan (
    id_pelanggan INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    nama_bengkel VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB;

-- 4. Tabel Alamat Bengkel
CREATE TABLE IF NOT EXISTS alamat_bengkel (
    id_alamat INT AUTO_INCREMENT PRIMARY KEY,
    id_pelanggan INT,
    label_alamat VARCHAR(255),
    detail_alamat TEXT,
    kota_kab VARCHAR(100),
    telp_bengkel VARCHAR(50),
    FOREIGN KEY (id_pelanggan) REFERENCES pelanggan(id_pelanggan) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 5. Tabel Admins
CREATE TABLE IF NOT EXISTS admins (
    id_admin INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    nama_admin VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB;

-- 6. Tabel Sales
CREATE TABLE IF NOT EXISTS sales (
    id_sales INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    nama_sales VARCHAR(255) NOT NULL,
    no_hp VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB;

-- 7. Tabel Owners
CREATE TABLE IF NOT EXISTS owners (
    id_owner INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    nama_owner VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB;

-- 8. Tabel Kepala Gudang
CREATE TABLE IF NOT EXISTS kepala_gudang (
    id_kepala INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    nama_kepala VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB;

-- 9. Tabel Staff Gudang
CREATE TABLE IF NOT EXISTS staff_gudang (
    id_staff INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    nama_staff VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB;

-- 10. Tabel Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
    id_supplier INT AUTO_INCREMENT PRIMARY KEY,
    nama_supplier VARCHAR(255) NOT NULL,
    alamat TEXT,
    kontak VARCHAR(50),
    email VARCHAR(100)
) ENGINE=InnoDB;

-- 11. Tabel Riwayat Stok
CREATE TABLE IF NOT EXISTS riwayat_stok (
    id_riwayat INT AUTO_INCREMENT PRIMARY KEY,
    id_produk INT,
    tipe_perubahan ENUM('Masuk', 'Keluar') NOT NULL,
    jumlah INT NOT NULL,
    keterangan TEXT,
    tgl_perubahan TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_produk) REFERENCES produk(id_produk) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 12. Tabel Pembelian (Barang Masuk)
CREATE TABLE IF NOT EXISTS pembelian (
    id_pembelian INT AUTO_INCREMENT PRIMARY KEY,
    id_supplier INT,
    id_staff_gudang INT,
    id_kepala_gudang INT,
    no_sj_supplier VARCHAR(100),
    tgl_beli DATE,
    status_qc VARCHAR(50) DEFAULT 'Menunggu',
    total_bayar DECIMAL(15,2),
    FOREIGN KEY (id_supplier) REFERENCES suppliers(id_supplier) ON DELETE SET NULL,
    FOREIGN KEY (id_staff_gudang) REFERENCES staff_gudang(id_staff) ON DELETE SET NULL,
    FOREIGN KEY (id_kepala_gudang) REFERENCES kepala_gudang(id_kepala) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 13. Tabel Detail Pembelian
CREATE TABLE IF NOT EXISTS detail_pembelian (
    id_detail_beli INT AUTO_INCREMENT PRIMARY KEY,
    id_pembelian INT,
    id_produk INT,
    qty_beli INT,
    subtotal DECIMAL(15,2),
    FOREIGN KEY (id_pembelian) REFERENCES pembelian(id_pembelian) ON DELETE CASCADE,
    FOREIGN KEY (id_produk) REFERENCES produk(id_produk) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 14. Tabel Penjualan (Barang Keluar/Invoice)
CREATE TABLE IF NOT EXISTS penjualan (
    id_penjualan INT AUTO_INCREMENT PRIMARY KEY,
    id_pelanggan INT,
    id_sales INT,
    id_staff_pengirim INT,
    no_sj_customer VARCHAR(100),
    metode_bayar VARCHAR(100),
    tgl_jatuh_tempo DATE,
    status_bayar VARCHAR(50) DEFAULT 'Belum Lunas',
    status_pengiriman VARCHAR(50) DEFAULT 'Diproses',
    total_netto DECIMAL(15,2),
    driver VARCHAR(255) DEFAULT NULL,
    FOREIGN KEY (id_pelanggan) REFERENCES pelanggan(id_pelanggan) ON DELETE SET NULL,
    FOREIGN KEY (id_sales) REFERENCES sales(id_sales) ON DELETE SET NULL,
    FOREIGN KEY (id_staff_pengirim) REFERENCES staff_gudang(id_staff) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 15. Tabel Detail Penjualan
CREATE TABLE IF NOT EXISTS detail_penjualan (
    id_detail_jual INT AUTO_INCREMENT PRIMARY KEY,
    id_penjualan INT,
    id_produk INT,
    qty_beli INT,
    qty_dus INT,
    subtotal DECIMAL(15,2),
    FOREIGN KEY (id_penjualan) REFERENCES penjualan(id_penjualan) ON DELETE CASCADE,
    FOREIGN KEY (id_produk) REFERENCES produk(id_produk) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 16. Tabel Laporan Kunjungan
CREATE TABLE IF NOT EXISTS laporan_kunjungan (
    id_kunjungan INT AUTO_INCREMENT PRIMARY KEY,
    id_sales INT,
    id_pelanggan INT,
    tgl_kunjungan DATETIME,
    foto_visit VARCHAR(255),
    catatan TEXT,
    FOREIGN KEY (id_sales) REFERENCES sales(id_sales) ON DELETE SET NULL,
    FOREIGN KEY (id_pelanggan) REFERENCES pelanggan(id_pelanggan) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Dummy User Data untuk Login Pertama Kali (Password plain text sesuai controller saat ini)
INSERT INTO admins (username, password, nama_admin) VALUES ('admin@gana', 'password123', 'Admin Utama');
