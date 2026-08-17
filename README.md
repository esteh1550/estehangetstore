# E STORE — Shoes Store Terpercaya

Aplikasi e-commerce toko sepatu online resmi **E STORE** bertema *Warm Heritage / Vintage Classic* yang dikembangkan menggunakan React, TypeScript, Tailwind CSS, dan Firebase.

![E STORE Logo](https://cdn.phototourl.com/free/2026-08-13-b62f43fb-a043-44e5-bc93-ad3a57c3c330.png)

## 📌 Fitur Utama

- **Layar Pembuka (Splash Screen)**: Animasi pembuka berdurasi 2.8 detik menampilkan logo resmi E STORE dan indikator pemuatan dengan mekanisme *pre-loading* gambar otomatis pada setiap pemuatan ulang (*reload*).
- **Identitas Merek**: Logo resmi (`https://cdn.phototourl.com/free/2026-08-13-b62f43fb-a043-44e5-bc93-ad3a57c3c330.png`) terpasang pada Header Navbar, Hero Banner, Footer, Halaman Kontak, dan Favicon browser.
- **Navigasi Presisi**:
  - **PRODUK TERBARU**: Urutkan koleksi sepatu terbaru (`/?sort=newest#produk-list`).
  - **KOLEKSI KLASIK**: Filter otomatis kategori *Sepatu Kasual / Lifestyle*.
  - **SEPATU FORMAL**: Filter otomatis kategori *Sepatu Formal & Semi-Formal*.
  - **SEPATU OLAHRAGA**: Filter otomatis kategori *Sepatu Olahraga*.
  - **MEREK**: Meluncur langsung ke filter merek sepatu populer (`/#filter-merek`).
  - **KONTAK**: Halaman Kontak Kami (`/contact`).
  - **PROMO DISKON**: Meluncur langsung ke bagian koleksi promo *New Arrival* (`/#new-arrival`).
- **Katalog & Filter Produk**: Pencarian langsung, penyaringan berdasarkan harga, ukuran, jenis, dan merek sepatu.
- **Keranjang & Wishlist**: Manajemen belanja dan daftar favorit berbasis *local storage*.
- **Integrasi Firebase**: Manajemen produk dan otentikasi.

---

## 🛠️ Teknologi yang Digunakan

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Motion (Framer Motion)
- **Icons**: Lucide React
- **Routing**: React Router DOM v6
- **Backend/Database**: Firebase Firestore & Auth
