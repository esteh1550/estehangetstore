# Catatan Perubahan (Changelog) - E STORE

## [1.2.0] - 2026-08-13

### 🎨 Pembaruan Logo & Branding
- Menambahkan logo resmi toko (`https://cdn.phototourl.com/free/2026-08-13-b62f43fb-a043-44e5-bc93-ad3a57c3c330.png`) ke seluruh komponen:
  - Header Navbar (`src/components/Navbar.tsx`)
  - Hero Banner Editorial (`src/components/Hero.tsx`)
  - Footer Toko (`src/components/Footer.tsx`)
  - Halaman Kontak (`src/pages/ContactPage.tsx`)
  - Konfigurasi Konstanta (`src/constants.ts`)
  - Tab Favicon Browser (`index.html`)

### ⚡ Layar Pembuka (Splash Screen)
- Membuat komponen `src/components/SplashScreen.tsx` yang dilengkapi dengan:
  - Animasi pembuka berdurasi 2.8 detik.
  - Mekanisme *pre-loading* gambar berbasis JavaScript (`new Image()`) agar logo langsung terlihat instan saat halaman dibuka atau di-*reload*.
  - Indikator pemuatan (*progress bar*) terakota dan transisi *fade-out* halus.

### 🔗 Navigasi Header Top Bar
- Memperbarui tautan navigasi di bar bagian atas dengan warna Terracotta (`#B83A0E`) yang dapat diklik langsung mengarahkan pengunjung ke lokasi tujuan:
  - `PRODUK TERBARU` → `/?sort=newest#produk-list`
  - `KOLEKSI KLASIK` → `/?model=Sepatu Kasual / Lifestyle#produk-list`
  - `SEPATU FORMAL` → `/?model=Sepatu Formal & Semi-Formal#produk-list`
  - `SEPATU OLAHRAGA` → `/?model=Sepatu Olahraga#produk-list`
  - `MEREK` → `/#filter-merek`
  - `KONTAK` → `/contact`
  - `PROMO DISKON` → `/#new-arrival`

### ✏️ Teks & Slogan Resmi
- Mengubah nama merek dari *HERITAGE* menjadi **E STORE**.
- Mengubah slogan pendukung menjadi **SHOES STORE TERPERCAYA**.

## Security & checkout hardening (2026-08-22)
- Tightened Firestore store/product/review/customer-order payload validation with exact allowed fields.
- Fixed review identity to use Firebase Auth UID instead of a hard-coded user id.
- Removed public client-side product view writes under admin-only product rules.
- Product-detail checkout now records to `customer_orders` and supports guest checkout without undefined Firestore fields.
- Added guest order field/length validation in Firestore rules.
