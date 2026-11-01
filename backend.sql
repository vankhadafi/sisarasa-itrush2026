-- Pastikan Anda sudah membuat atau mengklik database di phpMyAdmin cPanel atau Laragon sebelum menjalankan SQL ini

-- =========================================================
-- 1. TABEL PENGGUNA (3 AKTOR: buyer, merchant, donation)
-- =========================================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('buyer', 'merchant', 'donation') NOT NULL,
    organization VARCHAR(120) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert Akun Default (Penerima Donasi didukung untuk pedulikasih@gmail.com & vankhadafi@gmail.com)
INSERT INTO users (name, email, password, role, organization) VALUES
('Van Khadafi (Pemilik Yayasan)', 'pedulikasih@gmail.com', 'tubes', 'donation', 'Yayasan Peduli Kasih'),
('Van Khadafi (Pemilik Yayasan)', 'vankhadafi@gmail.com', 'tubes', 'donation', 'Yayasan Peduli Kasih'),
('Admin Artisan Boulangerie', 'merchant@sisarasa.com', 'merchant123', 'merchant', 'Artisan Boulangerie'),
('Budi Santoso', 'pembeli@sisarasa.com', 'pembeli123', 'buyer', 'Publik / Pembeli')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- =========================================================
-- 2. TABEL MAKANAN SURPLUS & LELANG
-- =========================================================
CREATE TABLE IF NOT EXISTS food_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    merchant VARCHAR(100) NOT NULL,
    title VARCHAR(180) NOT NULL,
    category ENUM('bakery', 'berat', 'buah') NOT NULL,
    distance DECIMAL(4,1) NOT NULL DEFAULT 1.0,
    normal_price INT NOT NULL,
    current_bid INT NOT NULL,
    buy_now_price INT NOT NULL,
    stock INT NOT NULL DEFAULT 1,
    remaining_seconds INT NOT NULL DEFAULT 2700,
    status ENUM('active', 'sold', 'donated') NOT NULL DEFAULT 'active',
    image VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO food_items (merchant, title, category, distance, normal_price, current_bid, buy_now_price, stock, remaining_seconds, status, image) VALUES
('Artisan Boulangerie', 'Paket 6 Assorted Croissant & Pain au Chocolat', 'bakery', 0.8, 120000, 42000, 60000, 3, 2450, 'active', 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=700&q=80'),
('Tokyo Bento Express', '2 Box Salmon Teriyaki & Chicken Katsu Bento', 'berat', 1.4, 110000, 45000, 65000, 2, 1180, 'active', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=700&q=80'),
('GreenHarvest Groceries', 'Keranjang Sayur Organik & Buah Segar (3 Kg)', 'buah', 2.3, 95000, 32000, 48000, 4, 4920, 'active', 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=700&q=80'),
('Dapur Nusantara Bistro', 'Paket Keluarga Nasi Liwet Ayam Bakar (4 Porsi)', 'berat', 0.9, 160000, 65000, 90000, 2, 890, 'active', 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=700&q=80'),
('SweetCrumb Bakery', 'Sourdough Loaf & 4 Cinnamon Rolls Hangat', 'bakery', 3.6, 105000, 38000, 55000, 5, 3310, 'active', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=700&q=80'),
('FreshBar Salad & Bowl', '2 Porsi Mediterranean Quinoa & Avocado Salad', 'buah', 1.8, 130000, 48000, 70000, 3, 1650, 'active', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=700&q=80');

-- =========================================================
-- 3. TABEL KETERSEDIAAN DONASI SIAP KLAIM
-- =========================================================
CREATE TABLE IF NOT EXISTS donations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    merchant VARCHAR(100) NOT NULL,
    title VARCHAR(180) NOT NULL,
    portions VARCHAR(50) NOT NULL,
    pickup_deadline VARCHAR(80) NOT NULL,
    location VARCHAR(100) NOT NULL,
    is_claimed TINYINT(1) NOT NULL DEFAULT 0,
    claimed_by VARCHAR(100) DEFAULT NULL,
    claimed_at VARCHAR(60) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO donations (merchant, title, portions, pickup_deadline, location, is_claimed, claimed_by, claimed_at) VALUES
('Roti Kita Bakery', '12 Porsi Roti Manis & Roti Tawar Gandum', '12 Porsi', 'Hari ini, 21:30 WIB', '0.7 km dari lokasi Anda', 0, NULL, NULL),
('Katering Berkah Sehat', '10 Kotak Nasi Ayam Panggang & Sayur Capcay', '10 Kotak', 'Hari ini, 21:00 WIB', '1.5 km dari lokasi Anda', 0, NULL, NULL),
('Artisan Boulangerie', '15 Paket Roti Gandum Utuh', '15 Porsi', 'Selesai', '0.8 km dari lokasi Anda', 1, 'Yayasan Peduli Kasih (pedulikasih@gmail.com)', 'Hari ini, 18:15'),
('GreenHarvest Groceries', 'Sayuran Hijau & Apel Malang', '8 Kg', 'Selesai', '2.3 km dari lokasi Anda', 1, 'Yayasan Peduli Kasih (pedulikasih@gmail.com)', 'Hari ini, 16:40');
