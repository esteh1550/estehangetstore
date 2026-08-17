import React from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '../lib/utils';

import { Product } from '../types';

interface HeroProps {
  featuredProducts?: Product[];
}

const DEFAULT_BANNERS = [
  {
    id: 1,
    title: "E STORE Sneaker Collection",
    subtitle: "Koleksi Sepatu Original Terlengkap dengan Harga Terbaik",
    image: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&q=80&w=1200",
    color: "bg-tea-main/20"
  },
  {
    id: 2,
    title: "Sepatu Lari & Olahraga",
    subtitle: "Teknologi Performa Tinggi untuk Kenyamanan Maksimal",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=1200",
    color: "bg-blue-50"
  },
  {
    id: 3,
    title: "Sepatu Lifestyle & Casual",
    subtitle: "Tampil Trendy dengan Nike, Adidas, New Balance, Converse & Vans",
    image: "https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&q=80&w=1200",
    color: "bg-white"
  }
];

export default function Hero({ featuredProducts = [] }: HeroProps) {
  return (
    <section className="pt-24 pb-10 px-4 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Editorial Card */}
        <div className="lg:col-span-5 bg-[#FAF4ED] border border-[#E8DEC9] rounded-2xl p-8 lg:p-12 flex flex-col justify-between shadow-sm relative overflow-hidden min-h-[380px]">
          <div className="space-y-6 z-10">
            <div className="flex items-center gap-3">
              <img 
                src="https://cdn.phototourl.com/free/2026-08-13-b62f43fb-a043-44e5-bc93-ad3a57c3c330.png" 
                alt="E STORE Logo" 
                referrerPolicy="no-referrer"
                className="w-10 h-10 object-contain drop-shadow-sm"
              />
              <span className="text-[11px] font-bold tracking-[0.25em] text-[#8C8375] uppercase block">
                E STORE HERITAGE SELECTION
              </span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#B83A0E] tracking-tight leading-[1.15]">
              GAYA ELEGAN DI SETIAP LANGKAH
            </h1>
            <p className="text-xs sm:text-sm text-[#5C5549] font-medium leading-relaxed tracking-wide uppercase">
              KOLEKSI KLASIK PILIHAN | RASAKAN SENSASI RETRO & SNEAKER 100% ORIGINAL.
            </p>
          </div>

          <div className="pt-8 z-10">
            <button 
              onClick={() => {
                document.getElementById('produk-list')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-[#B83A0E] text-white px-8 py-3.5 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-[#9E300B] transition-all shadow-md hover:shadow-lg hover:scale-105"
            >
              BELI SEKARANG
            </button>
          </div>

          {/* Decorative subtle texture watermark */}
          <div className="absolute -bottom-10 -right-10 text-[120px] font-serif font-black text-black/[0.03] select-none pointer-events-none">
            EST
          </div>
        </div>

        {/* Center Lifestyle Image */}
        <div className="lg:col-span-4 relative rounded-2xl overflow-hidden border border-[#E8DEC9] min-h-[320px] group shadow-sm">
          <img 
            src="https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&q=80&w=1000" 
            alt="Heritage Lifestyle Sneakers"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-6">
            <div className="text-white space-y-1">
              <span className="text-[10px] font-bold tracking-widest text-[#E8DEC9] uppercase">GAYA TERPOPULER</span>
              <p className="font-serif text-xl font-normal tracking-wide text-white">Klasik Denim & Canvas</p>
            </div>
          </div>
        </div>

        {/* Right "EDISI VINTAGE" Grid Card */}
        <div className="lg:col-span-3 bg-[#FAF4ED] border border-[#E8DEC9] rounded-2xl p-5 flex flex-col justify-between shadow-sm relative overflow-hidden min-h-[320px]">
          <div className="space-y-3">
            <div className="aspect-[4/3] rounded-xl overflow-hidden border border-[#E5DEC9] bg-white">
              <img 
                src="https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&q=80&w=800" 
                alt="Vintage Edit Sneakers"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="bg-[#EADDC9] p-3 rounded-xl text-center border border-[#DFCFA9]">
              <span className="font-serif text-base font-normal tracking-widest text-[#181512] uppercase block">
                EDISI VINTAGE
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="aspect-square rounded-lg overflow-hidden border border-[#E5DEC9] bg-white">
              <img 
                src="https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&q=80&w=400" 
                alt="Chuck 70"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="aspect-square rounded-lg overflow-hidden border border-[#E5DEC9] bg-white">
              <img 
                src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=400" 
                alt="Vans Old Skool"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
