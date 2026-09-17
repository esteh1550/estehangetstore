import React from 'react';
import { Truck, MapPin, Package, Clock, ShieldCheck, MessageCircle, ChevronDown, Check, Search } from 'lucide-react';
import { formatPrice, cn } from '../lib/utils';
import { CONTACT_INFO } from '../constants';

interface ShippingDestination {
  name: string;
  region: string;
  couriers: {
    courier: string;
    service: string;
    cost: number;
    etd: string; // Estimated Time of Delivery
    badge?: string;
  }[];
}

const DESTINATIONS: ShippingDestination[] = [
  {
    name: 'Kabupaten Majalengka (COD & Ambil di Basecamp)',
    region: 'Lokal Majalengka',
    couriers: [
      { courier: 'COD Titik Temu', service: 'Alun-Alun / Bunderan Munjul / Kadipaten / Jatiwangi', cost: 0, etd: 'Hari Ini (Janjian Jam)', badge: 'GRATIS COD' },
      { courier: 'Ambil di Toko', service: 'Basecamp E STORE Majalengka', cost: 0, etd: 'Bisa Diambil Kapan Saja', badge: 'GRATIS' },
      { courier: 'J&T Express', service: 'EZ (Kirim Lokal se-Kabupaten)', cost: 7000, etd: '1 Hari Sampai' },
      { courier: 'JNE', service: 'REG (Lokal)', cost: 7000, etd: '1 Hari Sampai' },
    ]
  },
  {
    name: 'Bandung & Sekitarnya (Jawa Barat)',
    region: 'Jawa Barat',
    couriers: [
      { courier: 'JNE', service: 'REG', cost: 10000, etd: '1 - 2 Hari', badge: 'Terhemat' },
      { courier: 'J&T Express', service: 'EZ', cost: 11000, etd: '1 - 2 Hari' },
      { courier: 'SiCepat', service: 'REG', cost: 10000, etd: '1 - 2 Hari' },
      { courier: 'JNE', service: 'YES (Yakin Esok Sampai)', cost: 18000, etd: '1 Hari (Besok Sampai)', badge: 'Tercepat' },
    ]
  },
  {
    name: 'Cirebon / Kuningan / Indramayu (Ciayumajakuning)',
    region: 'Jawa Barat',
    couriers: [
      { courier: 'J&T Express', service: 'EZ', cost: 9000, etd: '1 Hari (Lokal)', badge: 'Rekomendasi' },
      { courier: 'JNE', service: 'REG', cost: 9000, etd: '1 Hari' },
      { courier: 'SiCepat', service: 'REG', cost: 9000, etd: '1 Hari' },
    ]
  },
  {
    name: 'DKI Jakarta (Pusat, Selatan, Barat, Timur, Utara)',
    region: 'Jabodetabek',
    couriers: [
      { courier: 'JNE', service: 'REG', cost: 12000, etd: '1 - 2 Hari', badge: 'Terfavorit' },
      { courier: 'J&T Express', service: 'EZ', cost: 13000, etd: '1 - 2 Hari' },
      { courier: 'SiCepat', service: 'REG', cost: 12000, etd: '1 - 2 Hari' },
      { courier: 'JNE', service: 'YES', cost: 22000, etd: '1 Hari (Express)' },
    ]
  },
  {
    name: 'Bogor, Depok, Tangerang, Bekasi (BODETABEK)',
    region: 'Jabodetabek',
    couriers: [
      { courier: 'JNE', service: 'REG', cost: 13000, etd: '1 - 2 Hari' },
      { courier: 'J&T Express', service: 'EZ', cost: 13000, etd: '1 - 2 Hari' },
      { courier: 'SiCepat', service: 'REG', cost: 13000, etd: '1 - 2 Hari' },
      { courier: 'JNE', service: 'YES', cost: 24000, etd: '1 Hari' },
    ]
  },
  {
    name: 'Semarang, Solo, Yogyakarta (Jawa Tengah & DIY)',
    region: 'Jawa Tengah',
    couriers: [
      { courier: 'JNE', service: 'REG', cost: 17000, etd: '2 - 3 Hari' },
      { courier: 'J&T Express', service: 'EZ', cost: 18000, etd: '2 - 3 Hari' },
      { courier: 'SiCepat', service: 'REG', cost: 17000, etd: '2 - 3 Hari' },
      { courier: 'JNE', service: 'YES', cost: 30000, etd: '1 - 2 Hari' },
    ]
  },
  {
    name: 'Surabaya, Malang, Sidoarjo (Jawa Timur)',
    region: 'Jawa Timur',
    couriers: [
      { courier: 'JNE', service: 'REG', cost: 20000, etd: '2 - 3 Hari' },
      { courier: 'J&T Express', service: 'EZ', cost: 21000, etd: '2 - 3 Hari' },
      { courier: 'SiCepat', service: 'REG', cost: 20000, etd: '2 - 3 Hari' },
    ]
  },
  {
    name: 'Denpasar & Badung (Bali)',
    region: 'Bali & Nusa Tenggara',
    couriers: [
      { courier: 'JNE', service: 'REG', cost: 26000, etd: '2 - 4 Hari' },
      { courier: 'J&T Express', service: 'EZ', cost: 28000, etd: '2 - 3 Hari' },
      { courier: 'SiCepat', service: 'REG', cost: 27000, etd: '2 - 4 Hari' },
    ]
  },
  {
    name: 'Lampung, Palembang (Sumatera Selatan)',
    region: 'Sumatera',
    couriers: [
      { courier: 'JNE', service: 'REG', cost: 28000, etd: '2 - 4 Hari' },
      { courier: 'J&T Express', service: 'EZ', cost: 30000, etd: '2 - 3 Hari' },
    ]
  },
  {
    name: 'Medan, Pekanbaru, Padang (Sumatera Utara/Tengah)',
    region: 'Sumatera',
    couriers: [
      { courier: 'JNE', service: 'REG', cost: 38000, etd: '3 - 5 Hari' },
      { courier: 'J&T Express', service: 'EZ', cost: 40000, etd: '3 - 4 Hari' },
    ]
  },
  {
    name: 'Balikpapan, Banjarmasin, Pontianak (Kalimantan)',
    region: 'Kalimantan',
    couriers: [
      { courier: 'JNE', service: 'REG', cost: 42000, etd: '3 - 5 Hari' },
      { courier: 'J&T Express', service: 'EZ', cost: 44000, etd: '3 - 5 Hari' },
    ]
  },
  {
    name: 'Makassar, Manado (Sulawesi)',
    region: 'Sulawesi',
    couriers: [
      { courier: 'JNE', service: 'REG', cost: 46000, etd: '3 - 6 Hari' },
      { courier: 'J&T Express', service: 'EZ', cost: 48000, etd: '3 - 5 Hari' },
    ]
  },
];

interface ShippingCalculatorProps {
  productName?: string;
  className?: string;
}

export default function ShippingCalculator({ productName, className }: ShippingCalculatorProps) {
  const [selectedDestIndex, setSelectedDestIndex] = React.useState(0);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);

  const filteredDestinations = React.useMemo(() => {
    if (!searchQuery.trim()) return DESTINATIONS;
    const q = searchQuery.toLowerCase();
    return DESTINATIONS.filter(d => 
      d.name.toLowerCase().includes(q) || d.region.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const currentDest = DESTINATIONS[selectedDestIndex] || DESTINATIONS[0];

  const handleAskCourierWA = (courierName: string, service: string, cost: number) => {
    const text = encodeURIComponent(
      `Halo Admin Estehanget, saya ingin menanyakan ongkir sepatu${productName ? ` "${productName}"` : ''} dari Majalengka ke ${currentDest.name} menggunakan kurir ${courierName} (${service}) perkiraan tarif ${formatPrice(cost)}. Apakah barang siap kirim?`
    );
    window.open(`https://wa.me/${CONTACT_INFO.whatsapp}?text=${text}`, '_blank');
  };

  return (
    <div className={cn("bg-white rounded-2xl border border-black/10 p-5 space-y-4 shadow-sm", className)}>
      <div className="flex items-center justify-between border-b border-black/5 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center">
            <Truck size={18} />
          </div>
          <div>
            <h4 className="font-bold text-sm text-black">Kalkulator Estimasi Ongkir</h4>
            <p className="text-[11px] text-black/50 flex items-center gap-1">
              <MapPin size={11} className="text-tea-main" />
              Pengiriman Dari: <span className="font-semibold text-black/70">Majalengka, Jawa Barat</span>
            </p>
          </div>
        </div>
        <span className="text-[10px] font-black uppercase tracking-wider bg-black/5 text-black/60 px-2 py-0.5 rounded-md">
          1 Kg / Pasang
        </span>
      </div>

      {/* Destination Selector */}
      <div className="space-y-1.5 relative">
        <label className="text-xs font-bold uppercase tracking-wider text-black/60">
          Pilih Kota / Wilayah Tujuan
        </label>
        
        <div 
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full bg-black/5 hover:bg-black/10 transition-colors border border-black/10 rounded-xl px-3.5 py-2.5 flex items-center justify-between cursor-pointer text-sm font-bold text-black"
        >
          <span className="truncate">{currentDest.name}</span>
          <ChevronDown size={16} className={cn("transition-transform text-black/40", isDropdownOpen && "rotate-180")} />
        </div>

        {isDropdownOpen && (
          <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-black/15 rounded-xl shadow-xl z-30 p-2 space-y-1 max-h-64 overflow-y-auto">
            <div className="relative mb-2">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/30" />
              <input
                type="text"
                placeholder="Cari nama kota atau provinsi..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-black/5 rounded-lg border-none focus:ring-1 focus:ring-black/20"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onClick={e => e.stopPropagation()}
              />
            </div>
            {filteredDestinations.map((dest) => {
              const originalIndex = DESTINATIONS.findIndex(d => d.name === dest.name);
              const isSelected = selectedDestIndex === originalIndex;
              return (
                <button
                  key={dest.name}
                  type="button"
                  onClick={() => {
                    setSelectedDestIndex(originalIndex);
                    setIsDropdownOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-between",
                    isSelected ? "bg-tea-main text-white" : "hover:bg-black/5 text-black/80"
                  )}
                >
                  <span className="truncate">{dest.name}</span>
                  {isSelected && <Check size={14} />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Courier Options List */}
      <div className="space-y-2 pt-1">
        <span className="text-[11px] font-bold text-black/40 uppercase tracking-widest block">
          Pilihan Kurir & Tarif
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {currentDest.couriers.map((c, i) => (
            <div 
              key={i} 
              className="p-3 rounded-xl border border-black/10 bg-[#FAF8F5] hover:border-black/25 transition-all flex flex-col justify-between space-y-2 group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-xs text-black">{c.courier}</span>
                    <span className="text-[10px] font-semibold text-black/60 bg-black/5 px-1.5 py-0.2 rounded">
                      {c.service}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-black/50 pt-0.5">
                    <Clock size={11} className="text-black/40" />
                    <span>{c.etd}</span>
                  </div>
                </div>

                {c.badge && (
                  <span className={cn(
                    "text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded",
                    c.badge === 'Tercepat' ? "bg-blue-100 text-blue-800" : "bg-emerald-100 text-emerald-800"
                  )}>
                    {c.badge}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-black/5">
                <span className="font-black text-sm text-tea-main">
                  {formatPrice(c.cost)}
                </span>
                <button
                  type="button"
                  onClick={() => handleAskCourierWA(c.courier, c.service, c.cost)}
                  className="text-[10px] font-bold text-black/70 hover:text-green-600 flex items-center gap-1 transition-colors"
                  title="Tanyakan via WhatsApp"
                >
                  <MessageCircle size={12} className="text-green-600" />
                  <span>Kirim via WA</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-2.5 flex items-start gap-2 text-[11px] text-blue-900/80">
        <ShieldCheck size={16} className="text-blue-600 shrink-0 mt-0.5" />
        <span>
          Pengemasan rapi menggunakan box sepatu tebal + double bubble wrap aman untuk seluruh kota se-Indonesia.
        </span>
      </div>
    </div>
  );
}
