# SisaRasa — Artisanal Surplus Food Auction & Zero-Waste Ecosystem

> Platform lelang makanan surplus dan alokasi donasi pangan terintegrasi berbasis Artificial Intelligence (AI) di Kota Bengkulu untuk menekan *food waste* dan memperkuat ketahanan pangan masyarakat.

Karya ini diajukan untuk **IT RUSH 2026** — Sub-tema: **Lingkungan dan Konservasi** / **Ekonomi dan Pemberdayaan Masyarakat**.

---

## 📌 Fitur Utama

1. **Live Auction System:** Lelang makanan berlebih dengan hitungan mundur dinamis dan penawaran waktu nyata.
2. **Instant Buyout (Beli Langsung):** Opsi pembelian cepat sebelum lelang ditutup dengan diskon hingga 70%.
3. **AI Smart Pricing & Shelf-Life Estimator (Integrasi AI):** Algoritma kecerdasan buatan untuk optimasi harga awal lelang, harga beli langsung, dan rekomendasi durasi lelang berdasarkan estimasi masa simpan pangan (*shelf-life*).
4. **Automated Donation Fail-safe:** Makanan tak terjual otomatis dialihkan ke portal donasi untuk diklaim yayasan/lembaga sosial.
5. **Multi-Role Portal:** Akses terpisah untuk Pembeli, Mitra Merchant, dan Pengelola Yayasan (Penerima Donasi).

---

## 🤖 Integrasi Artificial Intelligence (AI)

Sesuai ketentuan Ketentuan Karya Website IT RUSH 2026 (Poin V.1):
- **Fitur AI:** *AI Smart Pricing & Food Shelf-Life Advisor*
- **Fungsi:**
  - Menghitung batas kelayakan konsumsi makanan berlebih berdasarkan kategori (bakery, makanan berat, buah/sayur) dan faktor waktu lelang sore/malam (*peak food rescue window*).
  - Menghasilkan rekomendasi harga awal lelang dan harga beli langsung secara otomatis untuk memaksimalkan *clearance rate* stok surplus tanpa merugikan merchant.
- **Implementasi:** Endpoint API `api.php?action=ai_pricing_suggest` didukung *client-side fallback* cerdas di `script.js`.

---

## 👥 Akun Demo Penjurian

Sesuai ketentuan Poin V.6 Guidebook:

| Peran (Role) | Email | Kata Sandi | Keterangan |
|---|---|---|---|
| **Pembeli (Buyer)** | `pembeli@sisarasa.com` | `pembeli123` | Akses katalog publik, ikut lelang, beli langsung |
| **Mitra Merchant** | `merchant@sisarasa.com` | `merchant123` | Akses dashboard toko, upload menu via bantuan AI |
| **Penerima Donasi** | `pedulikasih@gmail.com` | `tubes` | Portal Yayasan Peduli Kasih, klaim makanan donasi |

Tersedia tombol satu klik **"Akun Demo Penjurian"** pada halaman login website.

---

## 🛠️ Tech Stack & Penggunaan Aset / AI

Sesuai ketentuan Poin V.4 & V.5 Guidebook:

- **Frontend:** Semantic HTML5, CSS3 Custom Properties (Editorial Luxury Theme), Vanilla JavaScript (ES6+ Asynchronous).
- **Backend:** PHP Native RESTful API (`api.php`), Session Management, PDO MySQL.
- **Database:** MySQL / MariaDB (`backend.sql`).
- **Font:** Cormorant Garamond & Plus Jakarta Sans via Google Fonts.
- **Aset Gambar:** Unsplash Open-Source License.
- **Penggunaan AI Coding Assistant:** Digunakan untuk optimasi struktur kode, refactoring styling, dan perancangan algoritma perhitungan harga surplus.

---

## 🚀 Panduan Instalasi Lokal (Laragon)

1. Clone atau salin folder proyek ke direktori `laragon/www/Surplus v3`.
2. Buka Laragon, pastikan Apache dan MySQL aktif.
3. Buka phpMyAdmin (`http://localhost/phpmyadmin`), buat database baru bernama `sisarasa` atau `wnvjqqvi_rplxbasda`.
4. Import file `backend.sql` ke database tersebut.
5. Buka browser pada alamat `http://localhost/Surplus%20v3/` atau Virtual Host yang dikonfigurasi.

---

## 📄 Lisensi & Hak Cipta
Hak cipta milik peserta IT RUSH 2026.
