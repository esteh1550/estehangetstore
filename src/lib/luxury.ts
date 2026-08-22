import { Product } from '../types';

export const LUXURY_PRICE_THRESHOLD = 500000; // Rp 500.000

export const isLuxuryProduct = (product?: { price?: number } | null): boolean => {
  if (!product || typeof product.price !== 'number') return false;
  return product.price >= LUXURY_PRICE_THRESHOLD;
};

export interface LuxuryPrivilege {
  id: string;
  iconName: 'Crown' | 'ShieldCheck' | 'Package' | 'Video' | 'Sparkles' | 'Truck';
  title: string;
  subtitle: string;
  description: string;
  tag: string;
}

export const LUXURY_PRIVILEGES: LuxuryPrivilege[] = [
  {
    id: 'packaging',
    iconName: 'Package',
    title: 'Kemasan Hardbox Ganda & Dustbag Satin',
    subtitle: 'Double-Box Armor Packaging',
    description: 'Setiap sepatu mewah dikemas menggunakan kotak hardcase ekstra kuat berlapis bubble wrap tebal dan dustbag satin eksklusif pelindung debu.',
    tag: 'Eksklusif'
  },
  {
    id: 'authenticity',
    iconName: 'ShieldCheck',
    title: 'Sertifikat Keaslian 100% Original',
    subtitle: 'Certificate of Authenticity Verified',
    description: 'Dilengkapi kartu sertifikat fisik resmi bernomor seri unik dari E STORE, bergaransi uang kembali 100% + 100% jika terbukti tidak original.',
    tag: 'Garansi 200%'
  },
  {
    id: 'insurance',
    iconName: 'Truck',
    title: 'Asuransi Pengiriman Penuh & Prioritas Kilat',
    subtitle: 'Full Transit Insurance & Fast Track',
    description: 'Gratis biaya asuransi pengiriman resmi hingga barang sampai di tangan Anda, dengan antrean packing prioritas di hari yang sama.',
    tag: 'Gratis Asuransi'
  },
  {
    id: 'video_qc',
    iconName: 'Video',
    title: 'Video Quality Check Sebelum Dikirim',
    subtitle: 'Pre-Shipping 360° Inspection Video',
    description: 'Tim kami mengirimkan rekaman video pengecekan fisik 360° dan kelengkapan sepatu secara personal ke nomor WhatsApp Anda sebelum barang dipaketkan.',
    tag: 'Layanan Personal'
  },
  {
    id: 'care_kit',
    iconName: 'Sparkles',
    title: 'Free Premium Shoe Care & Scented Silica',
    subtitle: 'Bonus Perawatan Sepatu Mewah',
    description: 'Disertai paket lap microfiber premium dan gel silika beraroma untuk menjaga kondisi kulit dan material sepatu tetap prima selama penyimpanan.',
    tag: 'Free Gift'
  },
  {
    id: 'concierge',
    iconName: 'Crown',
    title: 'Layanan VIP Concierge 24/7',
    subtitle: 'Dedicated WhatsApp Priority Line',
    description: 'Jalur komunikasi prioritas khusus dengan senior stylist E STORE untuk konsultasi ukuran, styling rekomendasi, dan after-sales service tanpa antre.',
    tag: 'Akses VIP'
  }
];
