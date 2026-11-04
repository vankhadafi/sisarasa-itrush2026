// ==========================================================================
// KONFIGURASI API & STATE PENGGUNA AKTIF
// ==========================================================================
const API_URL = null; // Client-side standalone (GitHub Pages)
let currentUser = null;

// Fungsi Sanitasi Anti-XSS
function escapeHTML(str) {
    if (str === null || str === undefined) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

let foodItems = [];
let donationPool = [];
let donationHistory = [];

let selectedCategory = "all";
let maxDistance = 999;
let searchQuery = "";
let merchantRevenueTotal = Number(localStorage.getItem("sisarasa_merchant_revenue")) || 425000;

// =====================================================================
// DATA DEFAULT (FALLBACK) — digunakan saat server PHP tidak tersedia
// =====================================================================
const defaultFoodItems = [
    {
        id: 1, merchant: "Artisan Boulangerie",
        title: "Paket 6 Assorted Croissant & Pain au Chocolat",
        category: "bakery", distance: 0.8,
        normalPrice: 120000, currentBid: 42000, buyNowPrice: 60000,
        stock: 3, remainingSeconds: 2450, status: "active",
        image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=700&q=80"
    },
    {
        id: 2, merchant: "Tokyo Bento Express",
        title: "2 Box Salmon Teriyaki & Chicken Katsu Bento",
        category: "berat", distance: 1.4,
        normalPrice: 110000, currentBid: 45000, buyNowPrice: 65000,
        stock: 2, remainingSeconds: 1180, status: "active",
        image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=700&q=80"
    },
    {
        id: 3, merchant: "GreenHarvest Groceries",
        title: "Keranjang Sayur Organik & Buah Segar (3 Kg)",
        category: "buah", distance: 2.3,
        normalPrice: 95000, currentBid: 32000, buyNowPrice: 48000,
        stock: 4, remainingSeconds: 4920, status: "active",
        image: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=700&q=80"
    },
    {
        id: 4, merchant: "Dapur Nusantara Bistro",
        title: "Paket Keluarga Nasi Liwet Ayam Bakar (4 Porsi)",
        category: "berat", distance: 0.9,
        normalPrice: 160000, currentBid: 65000, buyNowPrice: 90000,
        stock: 2, remainingSeconds: 890, status: "active",
        image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=700&q=80"
    },
    {
        id: 5, merchant: "SweetCrumb Bakery",
        title: "Sourdough Loaf & 4 Cinnamon Rolls Hangat",
        category: "bakery", distance: 3.6,
        normalPrice: 105000, currentBid: 38000, buyNowPrice: 55000,
        stock: 5, remainingSeconds: 3310, status: "active",
        image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=700&q=80"
    },
    {
        id: 6, merchant: "FreshBar Salad & Bowl",
        title: "2 Porsi Mediterranean Quinoa & Avocado Salad",
        category: "buah", distance: 1.8,
        normalPrice: 130000, currentBid: 48000, buyNowPrice: 70000,
        stock: 3, remainingSeconds: 1650, status: "active",
        image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=700&q=80"
    }
];

const defaultDonationPool = [
    {
        id: 101, merchant: "Roti Kita Bakery",
        title: "12 Porsi Roti Manis & Roti Tawar Gandum",
        portions: "12 Porsi", pickupDeadline: "Hari ini, 21:30 WIB",
        location: "0.7 km dari lokasi Anda"
    },
    {
        id: 102, merchant: "Katering Berkah Sehat",
        title: "10 Kotak Nasi Ayam Panggang & Sayur Capcay",
        portions: "10 Kotak", pickupDeadline: "Hari ini, 21:00 WIB",
        location: "1.5 km dari lokasi Anda"
    }
];

const defaultDonationHistory = [
    {
        time: "Hari ini, 18:15", merchant: "Artisan Boulangerie",
        item: "15 Paket Roti Gandum Utuh", portions: "15 Porsi",
        receiver: "Yayasan Peduli Kasih (pedulikasih@gmail.com)", status: "Siap / Selesai Dijemput"
    },
    {
        time: "Hari ini, 16:40", merchant: "GreenHarvest Groceries",
        item: "Sayuran Hijau & Apel Malang", portions: "8 Kg",
        receiver: "Yayasan Peduli Kasih (pedulikasih@gmail.com)", status: "Siap / Selesai Dijemput"
    }
];

// Akun default untuk mode offline (tanpa server PHP)
let localUsers = [
    { id: 1, name: "Van Khadafi (Pemilik Yayasan)", email: "pedulikasih@gmail.com", password: "tubes", role: "donation", organization: "Yayasan Peduli Kasih" },
    { id: 2, name: "Admin Artisan Boulangerie", email: "merchant@sisarasa.com", password: "merchant123", role: "merchant", organization: "Artisan Boulangerie" },
    { id: 3, name: "Budi Santoso", email: "pembeli@sisarasa.com", password: "pembeli123", role: "buyer", organization: "Publik / Pembeli" }
];

// Simpan state ke localStorage agar tidak pernah hilang saat keluar dari web
function saveLocalState() {
    try {
        localStorage.setItem("sisarasa_food_items", JSON.stringify(foodItems));
        localStorage.setItem("sisarasa_donation_pool", JSON.stringify(donationPool));
        localStorage.setItem("sisarasa_donation_history", JSON.stringify(donationHistory));
        localStorage.setItem("sisarasa_merchant_revenue", String(merchantRevenueTotal));
    } catch (e) {}
}

function loadLocalState() {
    try {
        const savedFoods = localStorage.getItem("sisarasa_food_items");
        const savedPool = localStorage.getItem("sisarasa_donation_pool");
        const savedHist = localStorage.getItem("sisarasa_donation_history");
        const savedUsers = localStorage.getItem("sisarasa_local_users");

        foodItems = savedFoods ? JSON.parse(savedFoods) : JSON.parse(JSON.stringify(defaultFoodItems));
        donationPool = savedPool ? JSON.parse(savedPool) : JSON.parse(JSON.stringify(defaultDonationPool));
        donationHistory = savedHist ? JSON.parse(savedHist) : JSON.parse(JSON.stringify(defaultDonationHistory));
        if (savedUsers) localUsers = JSON.parse(savedUsers);
    } catch (e) {
        foodItems = JSON.parse(JSON.stringify(defaultFoodItems));
        donationPool = JSON.parse(JSON.stringify(defaultDonationPool));
        donationHistory = JSON.parse(JSON.stringify(defaultDonationHistory));
    }
}

// ==========================================================================
// SINKRONISASI DATA DENGAN BACKEND PHP & MYSQL (api.php)
// ==========================================================================
async function fetchInitialData() {
    // Mode Client-side Standalone untuk GitHub Pages
    loadLocalState();
    syncItemTimers(false);
    saveLocalState();
    renderBuyerCatalog();
    renderMerchantDashboard();
    renderDonationPortal();
}

// Menjaga waktu berakhir (endTime) tetap berjalan meskipun keluar dari aplikasi/browser
function syncItemTimers(fromServer = false) {
    let savedEndTimes = {};
    try {
        savedEndTimes = JSON.parse(localStorage.getItem("sisarasa_timers") || "{}");
    } catch (e) {
        savedEndTimes = {};
    }

    const now = Date.now();

    foodItems.forEach(item => {
        item.id = Number(item.id);
        item.distance = Number(item.distance);
        item.normalPrice = Number(item.normalPrice);
        item.currentBid = Number(item.currentBid);
        item.buyNowPrice = Number(item.buyNowPrice);
        item.stock = Number(item.stock);
        item.remainingSeconds = Math.max(0, Math.floor(Number(item.remainingSeconds) || 0));

        if (item.status === "active") {
            if (fromServer && item.endTimeMs) {
                // Gunakan waktu berakhir permanen dari MySQL (expires_at)
                item.endTime = now + (item.remainingSeconds * 1000);
                savedEndTimes[item.id] = item.endTime;
            } else {
                // Gunakan target waktu yang sudah tersimpan di localStorage
                const existingEndTime = item.endTime || savedEndTimes[item.id];
                if (existingEndTime) {
                    item.endTime = Number(existingEndTime);
                    const secondsLeft = Math.max(0, Math.floor((item.endTime - now) / 1000));
                    item.remainingSeconds = secondsLeft;
                } else {
                    item.endTime = now + (item.remainingSeconds * 1000);
                    savedEndTimes[item.id] = item.endTime;
                }
            }
        }
    });

    localStorage.setItem("sisarasa_timers", JSON.stringify(savedEndTimes));

    // Jika ada makanan yang waktunya sudah habis saat pengguna berada di luar aplikasi, langsung alihkan ke donasi
    foodItems.forEach(item => {
        if (item.status === "active" && item.remainingSeconds <= 0) {
            convertToDonation(item.id);
        }
    });
}

// ==========================================================================
// SISTEM LOGIN SATU PINTU & PENGARAHAN DASHBOARD SESUAI PERAN AKTOR
// ==========================================================================
function showView(viewId) {
    if (viewId === "view-merchant" && (!currentUser || currentUser.role !== "merchant")) {
        showToast("Silakan login menggunakan akun Mitra Merchant terlebih dahulu.", "warning");
        viewId = "view-login";
    }

    if (viewId === "view-donation") {
        if (!currentUser || currentUser.role !== "donation" || currentUser.email.toLowerCase() !== "pedulikasih@gmail.com") {
            showToast("Akses Ditolak. Khusus akun Yayasan terverifikasi (pedulikasih@gmail.com).", "warning");
            viewId = "view-login";
        }
    }

    document.querySelectorAll(".view-section").forEach(sec => sec.classList.remove("active"));
    const target = document.getElementById(viewId);
    if (target) {
        target.classList.add("active");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Tutup mobile menu saat pindah halaman
    closeMobileMenu();
}

function navigateHome(e) {
    if (e) e.preventDefault();
    if (!currentUser) {
        showView("view-buyer");
        return;
    }
    redirectByRole(currentUser);
}

function redirectByRole(user) {
    const roleLabels = {
        buyer: "🛒 Pembeli",
        merchant: "🏪 Mitra Merchant",
        donation: "🤝 Pemilik Yayasan"
    };

    document.getElementById("guest-nav-actions").classList.add("hidden");
    document.getElementById("user-nav-profile").classList.remove("hidden");
    document.getElementById("active-role-badge").textContent = roleLabels[user.role] || "Pengguna";
    document.getElementById("logged-user-name").textContent = user.name;

    if (user.role === "merchant") {
        document.getElementById("input-merchant").value = user.organization || user.name;
        renderMerchantDashboard();
        showView("view-merchant");
    } else if (user.role === "donation" && user.email.toLowerCase() === "pedulikasih@gmail.com") {
        document.getElementById("donation-owner-label").textContent = `${user.name} (${user.email})`;
        renderDonationPortal();
        showView("view-donation");
    } else {
        renderBuyerCatalog();
        showView("view-buyer");
    }
}

function switchAuthTab(tab) {
    const isLogin = tab === "login";
    document.getElementById("tab-login-btn").classList.toggle("active", isLogin);
    document.getElementById("tab-register-btn").classList.toggle("active", !isLogin);
    document.getElementById("auth-login-panel").classList.toggle("hidden", !isLogin);
    document.getElementById("auth-register-panel").classList.toggle("hidden", isLogin);
}

function toggleOrgField(role) {
    const group = document.getElementById("reg-org-group");
    group.classList.toggle("hidden", role !== "merchant");
}

function fillDemoLogin(email, password) {
    document.getElementById("login-email").value = email;
    document.getElementById("login-password").value = password;
    showToast(`Akun ${email} telah diisi. Silakan klik Masuk.`, "info");
}

function openPartnerLogin() {
    showView("view-login");
    switchAuthTab("register");
    document.getElementById("reg-role").value = "merchant";
    toggleOrgField("merchant");
}

// Submit Form Login Satu Pintu
document.getElementById("unified-login-form").addEventListener("submit", async function (e) {
    e.preventDefault();
    const email = document.getElementById("login-email").value.trim().toLowerCase();
    const password = document.getElementById("login-password").value.trim();

    if (!email || !password) {
        showToast("⚠️ Email dan kata sandi wajib diisi.", "warning");
        return;
    }

    // Show loading state
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="btn-spinner"></span> Memproses...';
    submitBtn.disabled = true;

    try {
        const res = await fetch(`${API_URL}?action=login`, {
            method: "POST",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });
        if (!res.ok) throw new Error("Fallback ke autentikasi lokal");
        const result = await res.json();

        if (!result.success) {
            showToast(`⚠️ ${result.message}`, "warning");
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            return;
        }
        currentUser = result.user;
    } catch (err) {
        const found = localUsers.find(u => u.email.toLowerCase() === email && u.password === password);
        if (!found) {
            showToast("⚠️ Email atau kata sandi salah!", "error");
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            return;
        }
        if (found.role === "donation" && found.email.toLowerCase() !== "pedulikasih@gmail.com") {
            showToast("⚠️ Akses Penerima Donasi hanya untuk pedulikasih@gmail.com!", "error");
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            return;
        }
        currentUser = { ...found };
    }

    localStorage.setItem("sisarasa_user", JSON.stringify(currentUser));
    showToast(`✅ Selamat datang, ${currentUser.name}! Mengarahkan ke dashboard...`, "success");
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
    this.reset();
    redirectByRole(currentUser);
});

// Submit Form Registrasi
document.getElementById("unified-register-form").addEventListener("submit", async function (e) {
    e.preventDefault();
    const name = document.getElementById("reg-name").value.trim();
    const email = document.getElementById("reg-email").value.trim().toLowerCase();
    const password = document.getElementById("reg-password").value.trim();
    const role = document.getElementById("reg-role").value;
    const organization = document.getElementById("reg-org").value.trim();

    if (!name || !email || !password) {
        showToast("⚠️ Semua field wajib diisi.", "warning");
        return;
    }

    if (password.length < 4) {
        showToast("⚠️ Kata sandi minimal 4 karakter.", "warning");
        return;
    }

    if (email === "pedulikasih@gmail.com" || role === "donation") {
        showToast("⚠️ Akun Pemilik Yayasan (pedulikasih@gmail.com) sudah terdaftar khusus. Silakan langsung login.", "warning");
        return;
    }

    // Show loading state
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="btn-spinner"></span> Memproses...';
    submitBtn.disabled = true;

    try {
        const res = await fetch(`${API_URL}?action=register`, {
            method: "POST",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password, role, organization })
        });
        if (!res.ok) throw new Error("Fallback registrasi lokal");
        const result = await res.json();

        if (!result.success) {
            showToast(`⚠️ ${result.message}`, "warning");
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            return;
        }
        currentUser = result.user;
    } catch (err) {
        if (localUsers.some(u => u.email.toLowerCase() === email)) {
            showToast("⚠️ Email sudah digunakan. Silakan login.", "warning");
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            return;
        }
        const newUser = {
            id: Date.now(),
            name,
            email,
            password,
            role,
            organization: organization || (role === "merchant" ? name : "Publik / Pembeli")
        };
        localUsers.push(newUser);
        localStorage.setItem("sisarasa_local_users", JSON.stringify(localUsers));
        currentUser = newUser;
    }

    localStorage.setItem("sisarasa_user", JSON.stringify(currentUser));
    showToast(`🎉 Akun berhasil dibuat! Mengarahkan ke dashboard...`, "success");
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
    this.reset();
    redirectByRole(currentUser);
});

async function handleLogout() {
    try {
        await fetch(`${API_URL}?action=logout`, {
            credentials: "same-origin"
        });
    } catch (e) {}
    currentUser = null;
    localStorage.removeItem("sisarasa_user");
    document.getElementById("guest-nav-actions").classList.remove("hidden");
    document.getElementById("user-nav-profile").classList.add("hidden");
    showToast("👋 Anda telah keluar dari sesi.", "info");
    showView("view-buyer");
}

// ==========================================================================
// FORMAT RUPIAH & WAKTU HITUNG MUNDUR
// ==========================================================================
function formatRupiah(number) {
    return "Rp " + Number(number).toLocaleString("id-ID");
}

function formatTime(seconds) {
    const totalSecs = Math.max(0, Math.floor(Number(seconds) || 0));
    if (totalSecs <= 0) return "00:00:00";
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return [
        hrs.toString().padStart(2, "0"),
        mins.toString().padStart(2, "0"),
        secs.toString().padStart(2, "0")
    ].join(":");
}

// ==========================================================================
// 1. RENDER KATALOG PEMBELI
// ==========================================================================
function renderBuyerCatalog() {
    const grid = document.getElementById("buyer-food-grid");
    if (!grid) return;

    const filtered = foodItems.filter(item => {
        const matchCat = selectedCategory === "all" || item.category === selectedCategory;
        const matchDist = Number(item.distance) <= maxDistance;
        const matchSearch = String(item.title).toLowerCase().includes(searchQuery) || 
                            String(item.merchant).toLowerCase().includes(searchQuery);
        return item.status === "active" && matchCat && matchDist && matchSearch;
    });

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <div class="empty-state-icon">🍽️</div>
                <h3>Tidak ada makanan surplus yang cocok</h3>
                <p class="subtitle">Coba kata kunci lain, pilih kategori berbeda, atau ubah rentang jarak.</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = filtered.map(item => {
        const itemId = Number(item.id);
        const discountPercent = Math.round(((item.normalPrice - item.currentBid) / item.normalPrice) * 100);
        const safeTitle = escapeHTML(item.title);
        const safeMerchant = escapeHTML(item.merchant);
        const safeImage = escapeHTML(item.image);
        const safeDistance = Number(item.distance);
        const safeStock = Number(item.stock);

        const isUrgent = item.remainingSeconds < 600; // < 10 menit

        return `
            <article class="food-card${isUrgent ? ' card-urgent' : ''}">
                <div class="card-img-wrapper">
                    <img src="${safeImage}" alt="${safeTitle}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=700&q=80'">
                    <span class="discount-badge">Hemat ${discountPercent}%</span>
                    <span class="distance-badge">${safeDistance} km</span>
                    <div class="countdown-badge${isUrgent ? ' countdown-urgent' : ''}" data-timer-id="${itemId}">
                        <span class="pulse-dot${isUrgent ? ' pulse-urgent' : ''}"></span>
                        <span class="timer-text">${formatTime(item.remainingSeconds)}</span>
                    </div>
                </div>
                <div class="card-body">
                    <div class="merchant-meta">
                        <span class="merchant-name">${safeMerchant}</span>
                        <span class="stock-pill${safeStock <= 2 ? ' stock-low' : ''}">Sisa ${safeStock} Porsi</span>
                    </div>
                    <h3 class="food-title">${safeTitle}</h3>

                    <div class="price-box">
                        <div class="price-col">
                            <span>Harga Toko</span>
                            <s class="original-price">${formatRupiah(item.normalPrice)}</s>
                            <span style="margin-top: 4px;">Tawaran Tertinggi</span>
                            <strong class="current-bid-price">${formatRupiah(item.currentBid)}</strong>
                        </div>
                        <div class="price-col buy-now-label">
                            <span>Beli Langsung</span>
                            <strong class="buy-now-price">${formatRupiah(item.buyNowPrice)}</strong>
                        </div>
                    </div>

                    <div class="card-actions">
                        <button class="btn btn-bid" onclick="openBidModal(${itemId})">Ajukan Tawaran</button>
                        <button class="btn btn-cta" onclick="buyNowItem(${itemId})">Beli Langsung</button>
                    </div>
                </div>
            </article>
        `;
    }).join("");
}

// ==========================================================================
// 2. RENDER DASHBOARD MERCHANT (SPESIFIK TIAP AKUN MERCHANT)
// ==========================================================================

// Fungsi untuk mengecek apakah item makanan milik merchant yang sedang login
function isOwnedByCurrentMerchant(item) {
    if (!currentUser || currentUser.role !== "merchant") return false;
    const merchantOrg = (currentUser.organization || currentUser.name || "").trim().toLowerCase();
    const itemMerchant = String(item.merchant || "").trim().toLowerCase();
    return itemMerchant === merchantOrg;
}

// Fungsi mengambil & menyimpan pendapatan spesifik per nama merchant di localStorage
function getMerchantRevenue(merchantName) {
    const key = String(merchantName || "").trim().toLowerCase();
    let revenueMap = {};
    try {
        revenueMap = JSON.parse(localStorage.getItem("sisarasa_revenue_by_merchant") || "{}");
    } catch (e) {
        revenueMap = {};
    }

    // Jika belum ada riwayat transaksi, hitung estimasi awal dari item berstatus 'sold' milik merchant ini
    if (revenueMap[key] === undefined) {
        const soldRevenue = foodItems
            .filter(f => String(f.merchant || "").trim().toLowerCase() === key && f.status === "sold")
            .reduce((sum, f) => sum + Number(f.buyNowPrice || 0), 0);
        
        // Beri saldo awal simulasi Rp 120.000 khusus untuk akun demo Artisan Boulangerie
        revenueMap[key] = key === "artisan boulangerie" ? (120000 + soldRevenue) : soldRevenue;
        localStorage.setItem("sisarasa_revenue_by_merchant", JSON.stringify(revenueMap));
    }
    return Number(revenueMap[key] || 0);
}

function addMerchantRevenue(merchantName, amount) {
    const key = String(merchantName || "").trim().toLowerCase();
    let revenueMap = {};
    try {
        revenueMap = JSON.parse(localStorage.getItem("sisarasa_revenue_by_merchant") || "{}");
    } catch (e) {
        revenueMap = {};
    }
    const current = getMerchantRevenue(merchantName);
    revenueMap[key] = current + Number(amount || 0);
    localStorage.setItem("sisarasa_revenue_by_merchant", JSON.stringify(revenueMap));
}

function renderMerchantDashboard() {
    const tbody = document.getElementById("merchant-table-body");
    if (!tbody) return;

    // Jika belum ada merchant yang login, kosongkan tabel
    if (!currentUser || currentUser.role !== "merchant") {
        document.getElementById("merchant-active-count").textContent = "0 Item";
        document.getElementById("merchant-revenue").textContent = formatRupiah(0);
        tbody.innerHTML = "";
        return;
    }

    const myMerchantName = currentUser.organization || currentUser.name;

    // Set otomatis & kunci input nama toko agar tidak salah mengunggah atas nama toko lain
    const merchantInput = document.getElementById("input-merchant");
    if (merchantInput) {
        merchantInput.value = myMerchantName;
        merchantInput.readOnly = true;
    }

    // Filter hanya makanan milik merchant yang sedang login
    const myFoodItems = foodItems.filter(item => isOwnedByCurrentMerchant(item));
    const activeCount = myFoodItems.filter(f => f.status === "active").length;
    const myRevenue = getMerchantRevenue(myMerchantName);

    document.getElementById("merchant-active-count").textContent = `${activeCount} Item`;
    document.getElementById("merchant-revenue").textContent = formatRupiah(myRevenue);

    if (myFoodItems.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 2.5rem; color: var(--text-secondary);">
                    <div class="empty-state-icon" style="font-size: 2rem; margin-bottom: 0.5rem;">📦</div>
                    Belum ada produk lelang untuk toko <strong>${escapeHTML(myMerchantName)}</strong>.<br>
                    Silakan unggah makanan surplus pertama Anda melalui formulir di samping.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = myFoodItems.map(item => {
        const itemId = Number(item.id);
        const safeTitle = escapeHTML(item.title);
        const safeMerchant = escapeHTML(item.merchant);
        const safeStock = Number(item.stock);

        let badgeHtml = `<span class="status-tag status-active">Dilelang (${safeStock} pkt)</span>`;
        if (item.status === "sold") badgeHtml = `<span class="status-tag status-sold">Terjual Habis</span>`;
        if (item.status === "donated") badgeHtml = `<span class="status-tag status-donated">Dialihkan ke Donasi</span>`;

        return `
            <tr>
                <td>
                    <strong>${safeTitle}</strong><br>
                    <small style="color: var(--text-secondary);">${safeMerchant}</small>
                </td>
                <td>${formatRupiah(item.normalPrice)}</td>
                <td><strong>${formatRupiah(item.currentBid)}</strong></td>
                <td data-merchant-timer="${itemId}">${item.status === "active" ? formatTime(item.remainingSeconds) : "-"}</td>
                <td>${badgeHtml}</td>
                <td>
                    ${item.status === "active"
                        ? `<button class="btn btn-secondary btn-sm" onclick="convertToDonation(${itemId})">Salurkan Donasi</button>`
                        : `<span style="color: var(--text-muted); font-size: 0.82rem;">Selesai</span>`
                    }
                </td>
            </tr>
        `;
    }).join("");
}

// ==========================================================================
// 3. RENDER PORTAL PENERIMA DONASI
// ==========================================================================
function renderDonationPortal() {
    const grid = document.getElementById("donation-grid");
    const historyBody = document.getElementById("donation-history-body");
    if (!grid || !historyBody) return;

    if (donationPool.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <div class="empty-state-icon">📋</div>
                <h3>Semua Paket Telah Diklaim</h3>
                <p class="subtitle">Seluruh paket donasi saat ini telah diklaim. Pantau kembali secara berkala.</p>
            </div>
        `;
    } else {
        grid.innerHTML = donationPool.map(d => {
            const donId = Number(d.id);
            return `
                <div class="donation-card">
                    <div>
                        <span class="merchant-name">${escapeHTML(d.merchant)}</span>
                        <h4>${escapeHTML(d.title)}</h4>
                        <p class="subtitle" style="margin-top: 6px;">Kuantitas: <strong>${escapeHTML(d.portions)}</strong></p>
                        <p class="subtitle">Batas Penjemputan: ${escapeHTML(d.pickupDeadline)}</p>
                        <p class="subtitle">${escapeHTML(d.location)}</p>
                    </div>
                    <button class="btn btn-cta full-width" onclick="claimDonation(${donId})">Klaim Makanan Ini</button>
                </div>
            `;
        }).join("");
    }

    historyBody.innerHTML = donationHistory.map(h => `
        <tr>
            <td>${escapeHTML(h.time)}</td>
            <td><strong>${escapeHTML(h.merchant)}</strong></td>
            <td>${escapeHTML(h.item)}</td>
            <td>${escapeHTML(h.portions)}</td>
            <td>${escapeHTML(h.receiver)}</td>
            <td><span class="status-tag status-sold">${escapeHTML(h.status)}</span></td>
        </tr>
    `).join("");
}

// ==========================================================================
// TRANSAKSI LELANG, BELI LANGSUNG, UNGGAH MERCHANT, DAN KLAIM DONASI
// ==========================================================================
function requireBuyerLogin() {
    if (!currentUser) {
        showToast("Silakan masuk terlebih dahulu untuk mengajukan tawaran atau membeli.", "warning");
        showView("view-login");
        return false;
    }
    return true;
}

function openBidModal(itemId) {
    if (!requireBuyerLogin()) return;

    const item = foodItems.find(f => Number(f.id) === Number(itemId));
    if (!item) return;

    document.getElementById("bid-item-id").value = item.id;
    document.getElementById("modal-food-title").textContent = item.title;
    document.getElementById("modal-merchant-name").textContent = `Mitra: ${item.merchant}`;
    document.getElementById("modal-current-bid").textContent = formatRupiah(item.currentBid);
    document.getElementById("modal-buy-now").textContent = formatRupiah(item.buyNowPrice);

    const minBid = Number(item.currentBid) + 2000;
    const input = document.getElementById("bid-amount-input");
    input.min = minBid;
    input.value = minBid;

    document.getElementById("bid-modal").classList.add("open");
    document.body.style.overflow = "hidden";
}

function closeModal() {
    document.getElementById("bid-modal").classList.remove("open");
    document.body.style.overflow = "";
}

document.getElementById("bid-form").addEventListener("submit", async function (e) {
    e.preventDefault();
    const id = parseInt(document.getElementById("bid-item-id").value);
    const amount = parseInt(document.getElementById("bid-amount-input").value);
    const item = foodItems.find(f => Number(f.id) === id);

    if (!item || amount <= Number(item.currentBid)) {
        showToast("⚠️ Nominal tawaran harus lebih tinggi dari tawaran saat ini!", "warning");
        return;
    }

    try {
        const res = await fetch(`${API_URL}?action=place_bid`, {
            method: "POST",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                itemId: id,
                amount: amount,
                userId: currentUser ? currentUser.id : null
            })
        });
        if (res.ok) {
            const data = await res.json();
            if (!data.success) {
                showToast(`⚠️ ${data.message}`, "warning");
                return;
            }
        }
    } catch (err) {}

    item.currentBid = amount;
    saveLocalState();
    closeModal();
    renderBuyerCatalog();
    renderMerchantDashboard();
    showToast(`🎉 Tawaran ${formatRupiah(amount)} untuk "${item.title}" berhasil dicatat!`, "success");
});

// Beli Langsung (Pendapatan masuk ke akun Merchant pemilik produk)
async function buyNowItem(itemId) {
    if (!requireBuyerLogin()) return;

    const item = foodItems.find(f => Number(f.id) === Number(itemId));
    if (!item || Number(item.stock) <= 0) return;

    let syncedFromServer = false;
    try {
        const res = await fetch(`${API_URL}?action=buy_now`, {
            method: "POST",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                itemId: item.id,
                userId: currentUser ? currentUser.id : null
            })
        });
        if (res.ok) {
            const data = await res.json();
            if (!data.success) {
                showToast(`⚠️ ${data.message}`, "warning");
                return;
            }
            if (data.newStock !== undefined && data.newStatus !== undefined) {
                item.stock = Number(data.newStock);
                item.status = data.newStatus;
                syncedFromServer = true;
            }
        }
    } catch (err) {}

    if (!syncedFromServer) {
        item.stock = Number(item.stock) - 1;
        if (item.stock <= 0) {
            item.status = "sold";
        }
    }

    // Tambahkan pendapatan khusus ke merchant pemilik makanan ini
    addMerchantRevenue(item.merchant, item.buyNowPrice);

    saveLocalState();
    renderBuyerCatalog();
    renderMerchantDashboard();
    showToast(`✅ Berhasil membeli "${item.title}" seharga ${formatRupiah(item.buyNowPrice)}!`, "success");
}

// Unggah Makanan Surplus oleh Merchant
document.getElementById("merchant-upload-form").addEventListener("submit", async function (e) {
    e.preventDefault();
    if (!currentUser || currentUser.role !== "merchant") {
        showToast("⚠️ Hanya Mitra Merchant yang dapat mengunggah makanan surplus.", "warning");
        return;
    }

    const payload = {
        merchant: document.getElementById("input-merchant").value.trim(),
        title: document.getElementById("input-title").value.trim(),
        category: document.getElementById("input-category").value,
        distance: parseFloat(document.getElementById("input-distance").value),
        normalPrice: parseInt(document.getElementById("input-normal-price").value),
        currentBid: parseInt(document.getElementById("input-start-bid").value),
        buyNowPrice: parseInt(document.getElementById("input-buy-now").value),
        stock: parseInt(document.getElementById("input-stock").value),
        durationMinutes: parseInt(document.getElementById("input-duration").value),
        role: currentUser.role
    };

    // Validasi harga
    if (payload.currentBid >= payload.buyNowPrice) {
        showToast("⚠️ Harga awal lelang harus lebih rendah dari harga beli langsung.", "warning");
        return;
    }
    if (payload.buyNowPrice >= payload.normalPrice) {
        showToast("⚠️ Harga beli langsung harus lebih rendah dari harga normal.", "warning");
        return;
    }

    const durationSecs = payload.durationMinutes * 60;
    const endTime = Date.now() + (durationSecs * 1000);
    let createdItem = null;

    // Show loading
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="btn-spinner"></span> Mengunggah...';
    submitBtn.disabled = true;

    try {
        const res = await fetch(`${API_URL}?action=upload_food`, {
            method: "POST",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            const data = await res.json();
            if (!data.success) {
                showToast(`⚠️ ${data.message}`, "warning");
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                return;
            }
            if (data.item) {
                createdItem = {
                    ...data.item,
                    id: Number(data.item.id),
                    distance: Number(data.item.distance),
                    normalPrice: Number(data.item.normalPrice),
                    currentBid: Number(data.item.currentBid),
                    buyNowPrice: Number(data.item.buyNowPrice),
                    stock: Number(data.item.stock),
                    remainingSeconds: Number(data.item.remainingSeconds),
                    endTime: endTime
                };
            }
        }
    } catch (err) {}

    if (!createdItem) {
        const fallbackId = foodItems.reduce((max, f) => Math.max(max, Number(f.id) || 0), 0) + 1;
        createdItem = {
            id: fallbackId,
            merchant: payload.merchant,
            title: payload.title,
            category: payload.category,
            distance: payload.distance,
            normalPrice: payload.normalPrice,
            currentBid: payload.currentBid,
            buyNowPrice: payload.buyNowPrice,
            stock: payload.stock,
            remainingSeconds: durationSecs,
            endTime: endTime,
            status: "active",
            image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=700&q=80"
        };
    }

    try {
        const savedEndTimes = JSON.parse(localStorage.getItem("sisarasa_timers") || "{}");
        savedEndTimes[createdItem.id] = endTime;
        localStorage.setItem("sisarasa_timers", JSON.stringify(savedEndTimes));
    } catch (e) {}

    foodItems.unshift(createdItem);
    saveLocalState();

    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
    this.reset();
    if (currentUser && currentUser.organization) {
        document.getElementById("input-merchant").value = currentUser.organization;
    }
    renderBuyerCatalog();
    renderMerchantDashboard();
    showToast(`🚀 "${createdItem.title}" berhasil diunggah ke katalog lelang!`, "success");
});

// Konversi Makanan ke Program Donasi
async function convertToDonation(itemId) {
    const item = foodItems.find(f => Number(f.id) === Number(itemId));
    if (!item || item.status === "donated") return;

    item.status = "donated";
    item.remainingSeconds = 0;

    let createdDonation = null;
    try {
        const res = await fetch(`${API_URL}?action=convert_donation`, {
            method: "POST",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ itemId: item.id })
        });
        if (res.ok) {
            const data = await res.json();
            if (data.success && data.donation) {
                createdDonation = {
                    ...data.donation,
                    id: Number(data.donation.id)
                };
            }
        }
    } catch (err) {}

    if (!createdDonation) {
        const fallbackDonId = donationPool.reduce((max, d) => Math.max(max, Number(d.id) || 100), 100) + 1;
        createdDonation = {
            id: fallbackDonId,
            merchant: item.merchant,
            title: item.title,
            portions: `${item.stock} Paket`,
            pickupDeadline: "Hari ini, 21:30 WIB",
            location: `${item.distance} km dari lokasi Anda`
        };
    }

    donationPool.unshift(createdDonation);
    saveLocalState();

    renderBuyerCatalog();
    renderMerchantDashboard();
    renderDonationPortal();
    showToast(`🤝 "${item.title}" telah dialihkan ke Portal Donasi Pangan.`, "info");
}

// Klaim Donasi oleh Pemilik Yayasan
async function claimDonation(donationId) {
    if (!currentUser || currentUser.email.toLowerCase() !== "pedulikasih@gmail.com") {
        showToast("⚠️ Hanya Pemilik Yayasan (pedulikasih@gmail.com) yang berhak mengklaim donasi!", "error");
        return;
    }

    const index = donationPool.findIndex(d => Number(d.id) === Number(donationId));
    if (index === -1) return;

    let claimedAtText = "Baru saja";
    let receiverText = `Yayasan Peduli Kasih (${currentUser.email})`;

    try {
        const res = await fetch(`${API_URL}?action=claim_donation`, {
            method: "POST",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ donationId: Number(donationId), email: currentUser.email })
        });
        if (res.ok) {
            const data = await res.json();
            if (!data.success) {
                showToast(`⚠️ ${data.message}`, "warning");
                return;
            }
            if (data.claimedAt) claimedAtText = data.claimedAt;
            if (data.claimedBy) receiverText = data.claimedBy;
        }
    } catch (err) {}

    const claimed = donationPool.splice(index, 1)[0];
    donationHistory.unshift({
        time: claimedAtText,
        merchant: claimed.merchant,
        item: claimed.title,
        portions: claimed.portions,
        receiver: receiverText,
        status: "Siap Dijemput"
    });

    saveLocalState();
    renderDonationPortal();
    showToast(`🎉 Donasi "${claimed.title}" berhasil diklaim oleh Pemilik Yayasan!`, "success");
}

// ==========================================================================
// FILTER KATEGORI, JARAK, PENCARIAN, & COUNTDOWN TIMER REAL-TIME
// ==========================================================================
document.querySelectorAll(".pill").forEach(pill => {
    pill.addEventListener("click", () => {
        document.querySelectorAll(".pill").forEach(p => p.classList.remove("active"));
        pill.classList.add("active");
        selectedCategory = pill.dataset.category;
        renderBuyerCatalog();
    });
});

document.getElementById("distance-select").addEventListener("change", function () {
    maxDistance = parseFloat(this.value);
    renderBuyerCatalog();
});

const searchInput = document.getElementById("search-input");
if (searchInput) {
    let searchTimer;
    searchInput.addEventListener("input", function () {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
            searchQuery = this.value.trim().toLowerCase();
            renderBuyerCatalog();
        }, 300); // Debounce 300ms
    });
}

// Loop Hitung Mundur Setiap 1 Detik + Sinkronisasi Saat Tab Kembali Aktif
function tickCountdowns() {
    const now = Date.now();

    foodItems.forEach(item => {
        if (item.status === "active") {
            if (!item.endTime) {
                item.endTime = now + (Number(item.remainingSeconds || 0) * 1000);
            }

            const secondsLeft = Math.max(0, Math.floor((item.endTime - now) / 1000));
            item.remainingSeconds = secondsLeft;

            if (secondsLeft === 0) {
                convertToDonation(item.id);
            }
        }
    });

    document.querySelectorAll("[data-timer-id]").forEach(el => {
        const id = Number(el.getAttribute("data-timer-id"));
        const item = foodItems.find(f => Number(f.id) === id);
        const timerText = el.querySelector(".timer-text");
        if (item && timerText) {
            timerText.textContent = formatTime(item.remainingSeconds);
            
            // Tambah efek urgent jika < 10 menit
            if (item.remainingSeconds < 600 && item.remainingSeconds > 0) {
                el.classList.add("countdown-urgent");
            }
        }
    });

    document.querySelectorAll("[data-merchant-timer]").forEach(el => {
        const id = Number(el.getAttribute("data-merchant-timer"));
        const item = foodItems.find(f => Number(f.id) === id);
        if (item && item.status === "active") {
            el.textContent = formatTime(item.remainingSeconds);
        }
    });
}

setInterval(tickCountdowns, 1000);

// Saat pengguna kembali membuka tab/aplikasi dari background, langsung perbarui detik seketika
document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
        tickCountdowns();
    }
});

// ==========================================================================
// TOAST NOTIFICATION (DITINGKATKAN)
// ==========================================================================
function showToast(message, type = "info") {
    const cleanMessage = String(message).replace(/^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FAFF}\s]+/u, '').trim();
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <span class="toast-message">${escapeHTML(cleanMessage)}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
    `;
    container.appendChild(toast);

    // Auto remove after 4 seconds
    setTimeout(() => {
        toast.classList.add("toast-exit");
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ==========================================================================
// MOBILE MENU TOGGLE
// ==========================================================================
function toggleMobileMenu() {
    const nav = document.getElementById("mobile-nav-menu");
    const btn = document.querySelector(".mobile-menu-btn");
    if (nav && btn) {
        const isOpen = nav.classList.toggle("open");
        btn.classList.toggle("active", isOpen);
        btn.setAttribute("aria-expanded", isOpen);
        document.body.style.overflow = isOpen ? "hidden" : "";
    }
}

function closeMobileMenu() {
    const nav = document.getElementById("mobile-nav-menu");
    const btn = document.querySelector(".mobile-menu-btn");
    if (nav) {
        nav.classList.remove("open");
        if (btn) {
            btn.classList.remove("active");
            btn.setAttribute("aria-expanded", "false");
        }
        document.body.style.overflow = "";
    }
}

// ==========================================================================
// BACK TO TOP BUTTON
// ==========================================================================
function initBackToTop() {
    const btn = document.getElementById("back-to-top");
    if (!btn) return;

    window.addEventListener("scroll", () => {
        if (window.scrollY > 400) {
            btn.classList.add("visible");
        } else {
            btn.classList.remove("visible");
        }
    }, { passive: true });

    btn.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });
}

// ==========================================================================
// NAVBAR SCROLL EFFECT
// ==========================================================================
function initNavbarScroll() {
    const navbar = document.querySelector(".navbar");
    if (!navbar) return;

    let lastScroll = 0;
    window.addEventListener("scroll", () => {
        const currentScroll = window.scrollY;
        if (currentScroll > 60) {
            navbar.classList.add("navbar-scrolled");
        } else {
            navbar.classList.remove("navbar-scrolled");
        }
        lastScroll = currentScroll;
    }, { passive: true });
}

// ==========================================================================
// SCROLL REVEAL & COUNTER ANIMATION
// ==========================================================================
function initScrollReveal() {
    const reveals = document.querySelectorAll(".reveal-up");
    if (!reveals.length) return;

    if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("revealed");
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12 });

        reveals.forEach(el => observer.observe(el));
    } else {
        reveals.forEach(el => el.classList.add("revealed"));
    }
}

// Counter animation for Trust Badges
function initStatCounters() {
    const badges = document.querySelectorAll(".stat-counter-card strong[data-target]");
    if (!badges.length) return;

    const runCount = (el) => {
        const target = parseInt(el.getAttribute("data-target"), 10);
        if (isNaN(target)) return;
        const duration = 1200;
        const start = performance.now();
        const update = (now) => {
            const progress = Math.min((now - start) / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(ease * target);
            if (target >= 1000) {
                el.textContent = current.toLocaleString("id-ID") + "+";
            } else if (target === 100) {
                el.textContent = current + "%";
            } else {
                el.textContent = current + "+";
            }
            if (progress < 1) {
                requestAnimationFrame(update);
            }
        };
        requestAnimationFrame(update);
    };

    if ("IntersectionObserver" in window) {
        const obs = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    runCount(entry.target);
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        badges.forEach(b => obs.observe(b));
    }
}

// ==========================================================================
// FITUR AI: SMART PRICING & FOOD SHELF-LIFE ADVISOR (IT RUSH 2026)
// ==========================================================================
async function runAiPricingAnalysis() {
    const titleInput = document.getElementById("input-title").value.trim();
    const category = document.getElementById("input-category").value;
    const normalPrice = parseInt(document.getElementById("input-normal-price").value) || 0;
    const distance = parseFloat(document.getElementById("input-distance").value) || 1.2;
    const statusEl = document.getElementById("ai-pricing-status");
    const runBtn = document.getElementById("btn-run-ai-pricing");

    if (!normalPrice || normalPrice < 5000) {
        showToast("⚠️ Masukkan harga normal valid (min Rp 5.000) terlebih dahulu.", "warning");
        document.getElementById("input-normal-price").focus();
        return;
    }

    const originalBtnText = runBtn.innerHTML;
    runBtn.innerHTML = '<span class="btn-spinner"></span> Menganalisis...';
    runBtn.disabled = true;

    try {
        throw new Error("Local heuristic mode");

        if (result.success && result.data) {
            document.getElementById("input-start-bid").value = result.data.suggestedBid;
            document.getElementById("input-buy-now").value = result.data.suggestedBuyNow;
            document.getElementById("input-duration").value = result.data.suggestedDuration;

            statusEl.innerHTML = `<strong>Rekomendasi AI Diterapkan:</strong> ${escapeHTML(result.data.analysis)}`;
            statusEl.style.color = "var(--gold-light)";
            showToast("✨ AI Pricing & Estimasi Ketahanan berhasil diterapkan!", "success");
        } else {
            throw new Error(result.message || "Gagal mendapatkan rekomendasi AI");
        }
    } catch (err) {
        // Fallback Client-side Heuristic
        const minBidRatio = category === "berat" ? 0.4 : 0.35;
        const buyNowRatio = category === "berat" ? 0.6 : 0.55;
        const calcBid = Math.round((normalPrice * minBidRatio) / 1000) * 1000;
        const calcBuy = Math.round((normalPrice * buyNowRatio) / 1000) * 1000;
        const calcDuration = category === "berat" ? 45 : 60;

        document.getElementById("input-start-bid").value = calcBid;
        document.getElementById("input-buy-now").value = calcBuy;
        document.getElementById("input-duration").value = calcDuration;

        statusEl.innerHTML = `<strong>Rekomendasi AI (Offline):</strong> Estimasi ketahanan 4-8 jam. Diskon optimal 40-65% diterapkan.`;
        statusEl.style.color = "var(--gold-light)";
        showToast("✨ Estimasi AI offline diterapkan.", "info");
    } finally {
        runBtn.innerHTML = originalBtnText;
        runBtn.disabled = false;
    }
}

// ==========================================================================
// INISIALISASI APLIKASI
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
    fetchInitialData();

    const savedUser = localStorage.getItem("sisarasa_user");
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            redirectByRole(currentUser);
        } catch (e) {
            localStorage.removeItem("sisarasa_user");
        }
    }

    initBackToTop();
    initNavbarScroll();
    initScrollReveal();
    initStatCounters();

    // Close modal on overlay click
    const modalOverlay = document.getElementById("bid-modal");
    if (modalOverlay) {
        modalOverlay.addEventListener("click", function(e) {
            if (e.target === this) closeModal();
        });
    }

    // Close modal on Escape key
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            closeModal();
            closeMobileMenu();
        }
    });
});
