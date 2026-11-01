<?php
session_start();
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// =========================================================
// KONFIGURASI KONEKSI DATABASE MYSQL CPANEL & LARAGON LOCAL
// =========================================================
$connections = [
    // 1. Konfigurasi cPanel
    [
        'host' => 'localhost',
        'db'   => 'wnvjqqvi_rplxbasda',
        'user' => 'wnvjqqvi_tubes',
        'pass' => 'S@yasuka123'
    ],
    // 2. Konfigurasi Laragon Localhost (fallback otomatis)
    [
        'host' => 'localhost',
        'db'   => 'wnvjqqvi_rplxbasda',
        'user' => 'root',
        'pass' => ''
    ],
    [
        'host' => 'localhost',
        'db'   => 'sisarasa',
        'user' => 'root',
        'pass' => ''
    ]
];

$pdo = null;
$connError = "";

foreach ($connections as $cfg) {
    try {
        $dsn = "mysql:host={$cfg['host']};dbname={$cfg['db']};charset=utf8mb4";
        $pdo = new PDO($dsn, $cfg['user'], $cfg['pass'], [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]);
        break; // Berhasil terhubung
    } catch (PDOException $e) {
        $connError = $e->getMessage();
    }
}

if (!$pdo) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Gagal terhubung ke database: " . $connError
    ]);
    exit;
}

$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents("php://input"), true) ?? [];

// Helper untuk mengecek apakah email merupakan akun Yayasan resmi
function isDonationAdmin($email) {
    $email = strtolower(trim($email));
    return in_array($email, ['pedulikasih@gmail.com', 'vankhadafi@gmail.com']);
}

switch ($action) {

    // =========================================================
    // 1. FITUR LOGIN SATU PINTU UNTUK SEMUA AKTOR
    // =========================================================
    case 'login':
        $email = strtolower(trim($input['email'] ?? ''));
        $passwordInput = trim($input['password'] ?? '');

        if ($email === '' || $passwordInput === '') {
            echo json_encode(["success" => false, "message" => "Email dan kata sandi wajib diisi."]);
            exit;
        }

        $stmt = $pdo->prepare("SELECT id, name, email, password, role, organization FROM users WHERE LOWER(email) = ? LIMIT 1");
        $stmt->execute([$email]);
        $account = $stmt->fetch();

        // Dukung password plain text dan password hash
        $passwordValid = false;
        if ($account) {
            if ($account['password'] === $passwordInput || password_verify($passwordInput, $account['password'])) {
                $passwordValid = true;
            }
        }

        if (!$account || !$passwordValid) {
            echo json_encode(["success" => false, "message" => "Email atau kata sandi salah!"]);
            exit;
        }

        // Aturan Ketat: Penerima Donasi HANYA boleh diakses oleh email resmi Yayasan
        if ($account['role'] === 'donation' && !isDonationAdmin($account['email'])) {
            echo json_encode([
                "success" => false,
                "message" => "Akses Ditolak! Portal Penerima Donasi hanya untuk Pemilik Yayasan resmi."
            ]);
            exit;
        }

        unset($account['password']);
        $account['id'] = (int)$account['id'];
        $_SESSION['user'] = $account;

        echo json_encode([
            "success" => true,
            "message" => "Login berhasil! Mengarahkan ke dashboard...",
            "user" => $account
        ]);
        break;

    // =========================================================
    // 2. REGISTRASI AKUN (HANYA PEMBELI & MERCHANT)
    // =========================================================
    case 'register':
        $name  = trim($input['name'] ?? '');
        $email = strtolower(trim($input['email'] ?? ''));
        $passwordInput = trim($input['password'] ?? '');
        $role  = trim($input['role'] ?? 'buyer');
        $org   = trim($input['organization'] ?? '');

        if ($name === '' || $email === '' || $passwordInput === '') {
            echo json_encode(["success" => false, "message" => "Semua field wajib diisi."]);
            exit;
        }

        if (strlen($passwordInput) < 4) {
            echo json_encode(["success" => false, "message" => "Kata sandi minimal 4 karakter."]);
            exit;
        }

        // Cegah pembuatan akun Penerima Donasi baru
        if ($role === 'donation' || isDonationAdmin($email)) {
            echo json_encode([
                "success" => false,
                "message" => "Peran Penerima Donasi dikunci khusus hanya untuk akun resmi Pemilik Yayasan."
            ]);
            exit;
        }

        if (!in_array($role, ['buyer', 'merchant'])) {
            $role = 'buyer';
        }

        $check = $pdo->prepare("SELECT id FROM users WHERE LOWER(email) = ?");
        $check->execute([$email]);
        if ($check->fetch()) {
            echo json_encode(["success" => false, "message" => "Email sudah terdaftar. Silakan langsung login."]);
            exit;
        }

        $orgName = $org ?: ($role === 'merchant' ? $name : 'Publik / Pembeli');
        $stmt = $pdo->prepare("INSERT INTO users (name, email, password, role, organization) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$name, $email, $passwordInput, $role, $orgName]);

        $newUser = [
            "id" => (int)$pdo->lastInsertId(),
            "name" => $name,
            "email" => $email,
            "role" => $role,
            "organization" => $orgName
        ];
        $_SESSION['user'] = $newUser;

        echo json_encode([
            "success" => true,
            "message" => "Pendaftaran berhasil!",
            "user" => $newUser
        ]);
        break;

    // =========================================================
    // 3. AMBIL SELURUH DATA KATALOG & DONASI (REAL-TIME TIMER)
    // =========================================================
    case 'get_data':
        // Cek apakah ada item aktif yang waktunya masih berjalan
        $validActiveCount = (int)$pdo->query("SELECT COUNT(*) FROM food_items 
            WHERE status = 'active' 
            AND (CAST(remaining_seconds AS SIGNED) - TIMESTAMPDIFF(SECOND, created_at, NOW())) > 0")->fetchColumn();

        $totalActiveCount = (int)$pdo->query("SELECT COUNT(*) FROM food_items WHERE status = 'active'")->fetchColumn();

        // Jika semua lelang aktif sudah expired (misal SQL dump lama), segarkan created_at
        if ($totalActiveCount > 0 && $validActiveCount === 0) {
            $pdo->exec("UPDATE food_items SET created_at = NOW() WHERE status = 'active'");
        }

        // Cari makanan aktif yang waktu lelangnya baru saja habis untuk dialihkan ke Donasi
        $expiredStmt = $pdo->query("SELECT * FROM food_items 
            WHERE status = 'active' 
            AND (CAST(remaining_seconds AS SIGNED) - TIMESTAMPDIFF(SECOND, created_at, NOW())) <= 0");
        $expiredItems = $expiredStmt->fetchAll();

        foreach ($expiredItems as $exp) {
            $pdo->prepare("UPDATE food_items SET status = 'donated' WHERE id = ?")->execute([$exp['id']]);
            $ins = $pdo->prepare("INSERT INTO donations (merchant, title, portions, pickup_deadline, location, is_claimed) VALUES (?, ?, ?, 'Hari ini, 21:30 WIB', ?, 0)");
            $ins->execute([
                $exp['merchant'],
                $exp['title'],
                $exp['stock'] . ' Paket',
                $exp['distance'] . ' km dari lokasi Anda'
            ]);
        }

        // Ambil daftar makanan beserta sisa detik real-time
        $foods = $pdo->query("SELECT 
            id, merchant, title, category, 
            distance, 
            normal_price AS normalPrice, 
            current_bid AS currentBid, 
            buy_now_price AS buyNowPrice, 
            stock, 
            GREATEST(0, CAST(remaining_seconds AS SIGNED) - TIMESTAMPDIFF(SECOND, created_at, NOW())) AS remainingSeconds, 
            status, image 
            FROM food_items ORDER BY id DESC")->fetchAll();

        foreach ($foods as &$f) {
            $f['id'] = (int)$f['id'];
            $f['distance'] = (float)$f['distance'];
            $f['normalPrice'] = (int)$f['normalPrice'];
            $f['currentBid'] = (int)$f['currentBid'];
            $f['buyNowPrice'] = (int)$f['buyNowPrice'];
            $f['stock'] = (int)$f['stock'];
            $f['remainingSeconds'] = (int)$f['remainingSeconds'];
        }
        unset($f);

        $availableDonations = $pdo->query("SELECT 
            id, merchant, title, portions, 
            pickup_deadline AS pickupDeadline, location 
            FROM donations WHERE is_claimed = 0 ORDER BY id DESC")->fetchAll();

        foreach ($availableDonations as &$d) {
            $d['id'] = (int)$d['id'];
        }
        unset($d);

        $historyDonations = $pdo->query("SELECT 
            claimed_at AS time, merchant, title AS item, portions, 
            claimed_by AS receiver, 'Siap / Selesai Dijemput' AS status 
            FROM donations WHERE is_claimed = 1 ORDER BY id DESC")->fetchAll();

        // Hitung total revenue dari barang berstatus 'sold'
        $soldRevenue = (int)$pdo->query("SELECT COALESCE(SUM(buy_now_price), 0) FROM food_items WHERE status = 'sold'")->fetchColumn();

        echo json_encode([
            "success" => true,
            "foodItems" => $foods,
            "donationPool" => $availableDonations,
            "donationHistory" => $historyDonations,
            "merchantRevenue" => $soldRevenue > 0 ? $soldRevenue : 425000,
            "sessionUser" => $_SESSION['user'] ?? null
        ]);
        break;

    // =========================================================
    // 4. AJUKAN TAWARAN LELANG (BID)
    // =========================================================
    case 'place_bid':
        $itemId = (int)($input['itemId'] ?? 0);
        $amount = (int)($input['amount'] ?? 0);

        $stmt = $pdo->prepare("SELECT current_bid, title FROM food_items WHERE id = ? AND status = 'active'");
        $stmt->execute([$itemId]);
        $item = $stmt->fetch();

        if (!$item || $amount <= (int)$item['current_bid']) {
            echo json_encode(["success" => false, "message" => "Nominal tawaran harus lebih tinggi dari tawaran saat ini!"]);
            exit;
        }

        $upd = $pdo->prepare("UPDATE food_items SET current_bid = ? WHERE id = ?");
        $upd->execute([$amount, $itemId]);

        echo json_encode(["success" => true, "message" => "Tawaran berhasil disimpan!"]);
        break;

    // =========================================================
    // 5. BELI LANGSUNG (BUY NOW)
    // =========================================================
    case 'buy_now':
        $itemId = (int)($input['itemId'] ?? 0);
        $stmt = $pdo->prepare("SELECT stock, buy_now_price FROM food_items WHERE id = ? AND status = 'active'");
        $stmt->execute([$itemId]);
        $item = $stmt->fetch();

        if (!$item || (int)$item['stock'] <= 0) {
            echo json_encode(["success" => false, "message" => "Stok makanan sudah habis."]);
            exit;
        }

        $newStock = (int)$item['stock'] - 1;
        $newStatus = $newStock <= 0 ? 'sold' : 'active';

        $upd = $pdo->prepare("UPDATE food_items SET stock = ?, status = ? WHERE id = ?");
        $upd->execute([$newStock, $newStatus, $itemId]);

        echo json_encode([
            "success" => true,
            "newStock" => $newStock,
            "newStatus" => $newStatus,
            "message" => "Pembelian langsung berhasil!"
        ]);
        break;

    // =========================================================
    // 6. UNGGAH MAKANAN SURPLUS BARU (MERCHANT)
    // =========================================================
    case 'upload_food':
        $sessionMerchant = $_SESSION['user']['organization'] ?? $_SESSION['user']['name'] ?? null;
        $merchant = trim($sessionMerchant ?: ($input['merchant'] ?? 'Mitra Merchant'));
        
        $title = trim($input['title'] ?? '');
        $category = $input['category'] ?? 'bakery';
        $distance = (float)($input['distance'] ?? 1.2);
        $normalPrice = (int)($input['normalPrice'] ?? 50000);
        $currentBid = (int)($input['currentBid'] ?? 20000);
        $buyNowPrice = (int)($input['buyNowPrice'] ?? 35000);
        $stock = (int)($input['stock'] ?? 1);
        $remainingSeconds = (int)($input['durationMinutes'] ?? 45) * 60;
        $image = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=700&q=80";

        if ($title === '') {
            echo json_encode(["success" => false, "message" => "Nama paket makanan wajib diisi."]);
            exit;
        }

        $stmt = $pdo->prepare("INSERT INTO food_items 
            (merchant, title, category, distance, normal_price, current_bid, buy_now_price, stock, remaining_seconds, status, image, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, NOW())");
        $stmt->execute([$merchant, $title, $category, $distance, $normalPrice, $currentBid, $buyNowPrice, $stock, $remainingSeconds, $image]);

        $newId = (int)$pdo->lastInsertId();

        $newItem = [
            "id" => $newId,
            "merchant" => $merchant,
            "title" => $title,
            "category" => $category,
            "distance" => $distance,
            "normalPrice" => $normalPrice,
            "currentBid" => $currentBid,
            "buyNowPrice" => $buyNowPrice,
            "stock" => $stock,
            "remainingSeconds" => $remainingSeconds,
            "status" => "active",
            "image" => $image
        ];

        echo json_encode([
            "success" => true,
            "id" => $newId,
            "item" => $newItem,
            "message" => "Makanan surplus berhasil diunggah!"
        ]);
        break;
        
    // =========================================================
    // 7. ALIHKAN MAKANAN KE PORTAL DONASI
    // =========================================================
    case 'convert_donation':
        $itemId = (int)($input['itemId'] ?? 0);
        $stmt = $pdo->prepare("SELECT * FROM food_items WHERE id = ? AND status = 'active'");
        $stmt->execute([$itemId]);
        $item = $stmt->fetch();

        $donationId = null;
        $donationObj = null;

        if ($item) {
            $pdo->prepare("UPDATE food_items SET status = 'donated' WHERE id = ?")->execute([$itemId]);
            $ins = $pdo->prepare("INSERT INTO donations (merchant, title, portions, pickup_deadline, location, is_claimed) VALUES (?, ?, ?, 'Hari ini, 21:30 WIB', ?, 0)");
            $ins->execute([$item['merchant'], $item['title'], $item['stock'] . ' Paket', $item['distance'] . ' km dari lokasi Anda']);
            $donationId = (int)$pdo->lastInsertId();

            $donationObj = [
                "id" => $donationId,
                "merchant" => $item['merchant'],
                "title" => $item['title'],
                "portions" => $item['stock'] . ' Paket',
                "pickupDeadline" => 'Hari ini, 21:30 WIB',
                "location" => $item['distance'] . ' km dari lokasi Anda'
            ];
        }

        echo json_encode([
            "success" => true,
            "donationId" => $donationId,
            "donation" => $donationObj,
            "message" => "Berhasil dialihkan ke Portal Donasi!"
        ]);
        break;

    // =========================================================
    // 8. KLAIM DONASI (KHUSUS PEMILIK YAYASAN)
    // =========================================================
    case 'claim_donation':
        $donationId = (int)($input['donationId'] ?? 0);
        $email = strtolower(trim($input['email'] ?? ''));

        if (!isDonationAdmin($email)) {
            echo json_encode([
                "success" => false,
                "message" => "Akses Ditolak! Hanya Pemilik Yayasan resmi yang berhak mengklaim donasi."
            ]);
            exit;
        }

        $claimedAt = "Hari ini, " . date('H:i') . " WIB";
        $claimedBy = "Yayasan Peduli Kasih ($email)";

        $upd = $pdo->prepare("UPDATE donations SET is_claimed = 1, claimed_by = ?, claimed_at = ? WHERE id = ?");
        $upd->execute([$claimedBy, $claimedAt, $donationId]);

        echo json_encode([
            "success" => true,
            "claimedAt" => $claimedAt,
            "claimedBy" => $claimedBy,
            "message" => "Donasi berhasil diklaim oleh Yayasan!"
        ]);
        break;

    // =========================================================
    // 9. AI SMART PRICING & FOOD SHELF-LIFE ADVISOR (IT RUSH 2026)
    // =========================================================
    case 'ai_pricing_suggest':
        $title = trim($input['title'] ?? '');
        $category = $input['category'] ?? 'bakery';
        $normalPrice = max(5000, (int)($input['normalPrice'] ?? 50000));
        $distance = (float)($input['distance'] ?? 1.2);

        // Algoritma Heuristik Cerdas / Decision Engine Prediktif
        // Menentukan rasio diskon, urgensi waktu lelang, dan batas kelayakan konsumsi
        $categoryMultipliers = [
            'bakery' => ['min_bid' => 0.35, 'buy_now' => 0.55, 'duration' => 60, 'shelf_life' => '6 - 12 jam'],
            'berat'  => ['min_bid' => 0.40, 'buy_now' => 0.60, 'duration' => 45, 'shelf_life' => '4 - 6 jam (Perlu pemanasan ulang)'],
            'buah'   => ['min_bid' => 0.30, 'buy_now' => 0.50, 'duration' => 90, 'shelf_life' => '12 - 24 jam (Simpan sejuk)']
        ];

        $rule = $categoryMultipliers[$category] ?? $categoryMultipliers['bakery'];

        // Faktor waktu malam hari (peak food rescue window 17:00 - 22:00)
        $currentHour = (int)date('G');
        $urgencyBonus = ($currentHour >= 18 && $currentHour <= 23) ? 0.90 : 1.0;

        $suggestedBid = round(($normalPrice * $rule['min_bid'] * $urgencyBonus) / 1000) * 1000;
        $suggestedBuyNow = round(($normalPrice * $rule['buy_now'] * $urgencyBonus) / 1000) * 1000;
        $suggestedDuration = max(20, round($rule['duration'] * $urgencyBonus));

        $analysis = "AI memprediksi ketahanan pangan: " . $rule['shelf_life'] . ". Optimalisasi lelang dipatok hemat s/d " . round((1 - ($suggestedBid / $normalPrice)) * 100) . "% agar terserap cepat sebelum masuk jadwal donasi.";

        echo json_encode([
            "success" => true,
            "data" => [
                "suggestedBid" => (int)$suggestedBid,
                "suggestedBuyNow" => (int)$suggestedBuyNow,
                "suggestedDuration" => (int)$suggestedDuration,
                "shelfLife" => $rule['shelf_life'],
                "analysis" => $analysis
            ]
        ]);
        break;

    case 'logout':
        session_destroy();
        echo json_encode(["success" => true]);
        break;

    default:
        echo json_encode(["success" => false, "message" => "Endpoint API tidak ditemukan."]);
        break;
}
