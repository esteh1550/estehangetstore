# Dokumentasi Teknis & Prompt Blueprint: ESTEHANGET

Dokumen ini berisi spesifikasi lengkap yang digunakan untuk membangun dan menjalankan aplikasi ESTEHANGET, termasuk prompt AI untuk fitur-fiturnya.

## 1. Visi & Identitas Visual
**Prompt Desain:**
"Bangun UI E-commerce yang mengusung tema 'Modern Brutalism mixed with Minimalist Luxury'. Gunakan font 'Display' yang tebal (Space Grotesk) untuk heading dan 'Sans' yang bersih (Inter) untuk konten. Warna utama adalah `#1A3C34` (Tea Main) dan aksen `#E6F4F1` (Tea Light). Hindari penggunaan border radius yang standar, gunakan 3xl (24px) untuk kartu produk agar terlihat ikonik."

## 2. Struktur Data (Firebase Firestore)
Aplikasi ini menggunakan struktur koleksi sebagai berikut:
- **`products`**: Nama, Harga, Kategori, Stok, Gambar (Array), Deskripsi, Spesifikasi (Array).
- **`orders`**: UserID, Item (Array), Total Harga, Status (Pending, Processing, Shipped, Completed), Alamat Kirim.
- **`newsletter`**: Nomor WhatsApp pendaftar.
- **`users`**: Profil admin dan pelanggan.

## 3. Fitur AI: ESA (Estehanget Smart Assistant)
**System Instructions untuk Chatbot:**
"Anda adalah ESA, asisten pintar dari ESTEHANGET. Karakter Anda: Sopan, profesional, minimalis dalam berbicara namun sangat membantu. Tugas Anda adalah membantu navigasi user (misal: mengarahkan ke halaman Produk jika ditanya harga), menjelaskan detail produk, dan mencatat pertanyaan pelanggan. Jika ditanya soal stok, mintalah user untuk login agar bisa melihat data real-time."

## 4. Logika AI: Import Link (Scraper)
**Prompt Engineering:**
"Bertindaklah sebagai parser data marketplace. Dari URL berikut: [URL], ekstraksi elemen:
1. Nama Produk (Hapus tag promo yang mengganggu).
2. Harga (Konversi ke angka murni dalam Rupiah).
3. Klasifikasi Kategori (Digital/Gadget/Pakaian/Sepatu).
4. Ringkasan Deskripsi (Buat lebih profesional).
Pastikan format output adalah JSON murni yang sesuai dengan schema Firestore aplikasi."

## 5. Komponen Utama & Library
- **Animasi Navigasi**: Menggunakan `AnimatePresence` dari Framer Motion untuk transisi 'fade-and-slide' antar halaman.
- **Keranjang Belanja**: State management lokal yang disinkronkan ke LocalStorage sebelum checkout.
- **Auth**: Google Popup Provider dengan filter domain admin.

## 6. Prompt Pengembangan Lanjutan
Jika ingin menambahkan fitur, gunakan format prompt ini:
"Tambahkan modul [Nama Fitur] pada file [Nama File]. Pastikan gayanya konsisten dengan komponen yang sudah ada menggunakan Tailwind class 'dark:bg-[#1a1a1a]' dan 'border-black/5'. Gunakan Lucide-React untuk ikon dan pastikan responsif di mobile."
