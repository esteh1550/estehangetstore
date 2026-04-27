import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Filter, Star, ChevronDown, ChevronUp, Zap, Smartphone, Shirt, Footprints, Laptop, Gift, Store as StoreIcon, Eye, Package } from 'lucide-react';
import Hero from '../components/Hero';
import ProductCard from '../components/ProductCard';
import { PRODUCTS, CONTACT_INFO, STORE } from '../constants';
import { Product } from '../types';
import { cn, formatPrice } from '../lib/utils';
import { Link } from 'react-router-dom';
import { getAllProducts } from '../lib/sellerService';
import { useProductHistory } from '../lib/useProductHistory';

interface HomeProps {
  onAddToCart: (p: Product) => void;
  onToggleWishlist: (id: string) => void;
  onViewDetails: (p: Product) => void;
  wishlist: string[];
  isShop?: boolean;
}

function FlashSaleTimer() {
  const [timeLeft, setTimeLeft] = React.useState({ h: 2, m: 45, s: 30 });

  React.useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.s > 0) return { ...prev, s: prev.s - 1 };
        if (prev.m > 0) return { ...prev, m: prev.m - 1, s: 59 };
        if (prev.h > 0) return { h: prev.h - 1, m: 59, s: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-1">
      <span className="bg-tea-main text-black px-1.5 py-0.5 rounded text-xs font-bold">{timeLeft.h.toString().padStart(2, '0')}</span>
      <span className="text-black font-bold">:</span>
      <span className="bg-tea-main text-black px-1.5 py-0.5 rounded text-xs font-bold">{timeLeft.m.toString().padStart(2, '0')}</span>
      <span className="text-black font-bold">:</span>
      <span className="bg-tea-main text-black px-1.5 py-0.5 rounded text-xs font-bold">{timeLeft.s.toString().padStart(2, '0')}</span>
    </div>
  );
}

export default function Home({ onAddToCart, onToggleWishlist, onViewDetails, wishlist, isShop = false }: HomeProps) {
  const [search, setSearch] = React.useState('');
  const [category, setCategory] = React.useState<string>('all');
  const [sortBy, setSortBy] = React.useState<'newest' | 'price-low' | 'price-high'>('newest');
  const [minPrice, setMinPrice] = React.useState<string>('');
  const [maxPrice, setMaxPrice] = React.useState<string>('');
  const [openFaq, setOpenFaq] = React.useState<number | null>(null);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [dynamicProducts, setDynamicProducts] = React.useState<Product[]>([]);
  const suggestionsRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const unsubProducts = getAllProducts(setDynamicProducts);
    return () => {
      unsubProducts();
    };
  }, []);

  const allProducts = React.useMemo(() => {
    const combined = [...PRODUCTS];
    dynamicProducts.forEach(dp => {
      if (!combined.find(p => p.id === dp.id)) combined.push(dp);
    });
    return combined;
  }, [dynamicProducts]);

  const categories = ['all', 'gadget', 'pakaian', 'sepatu', 'digital'];

  const categoriesData = [
    { id: 'gadget', name: 'Gadget', icon: <Smartphone size={24} />, color: 'bg-tea-main/10 text-black' },
    { id: 'pakaian', name: 'Pakaian', icon: <Shirt size={24} />, color: 'bg-tea-main/5 text-black' },
    { id: 'sepatu', name: 'Sepatu', icon: <Footprints size={24} />, color: 'bg-tea-main/20 text-black' },
    { id: 'digital', name: 'Digital', icon: <Laptop size={24} />, color: 'bg-tea-main/5 text-black' },
    { id: 'gift', name: 'Hadiah', icon: <Gift size={24} />, color: 'bg-tea-main/15 text-black' },
  ];

  const suggestions = React.useMemo(() => {
    if (!search.trim()) return [];
    const searchLower = search.toLowerCase();
    
    const productSuggestions = allProducts
      .filter(p => p.name.toLowerCase().includes(searchLower))
      .map(p => ({ type: 'product', value: p.name }));
      
    const categorySuggestions = categories
      .filter(c => c !== 'all' && c.toLowerCase().includes(searchLower))
      .map(c => ({ type: 'category', value: c }));
      
    return [...productSuggestions, ...categorySuggestions].slice(0, 5);
  }, [search]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredProducts = allProducts.filter(p => {
    const searchLower = search.toLowerCase();
    const matchesSearch = p.name.toLowerCase().includes(searchLower) || 
                         p.description.toLowerCase().includes(searchLower);
    const matchesCategory = category === 'all' || p.category === category;
    
    const pMin = minPrice ? parseInt(minPrice) : 0;
    const pMax = maxPrice ? parseInt(maxPrice) : Infinity;
    const matchesPrice = p.price >= pMin && p.price <= pMax;
    
    return matchesSearch && matchesCategory && matchesPrice;
  }).sort((a, b) => {
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    return 0; // 'newest' is default order in constants
  });

  const faqs = [
    { q: 'Bagaimana cara melakukan pemesanan?', a: 'Pilih produk yang Anda inginkan, klik "Beli Sekarang", isi data pengiriman, dan Anda akan diarahkan ke WhatsApp admin kami untuk konfirmasi pembayaran.' },
    { q: 'Apakah ada biaya pengiriman?', a: 'Kami memberikan gratis ongkir untuk wilayah Jabodetabek dengan minimal belanja Rp 500.000. Untuk wilayah lain, biaya akan dihitung saat konfirmasi di WhatsApp.' },
    { q: 'Berapa lama proses pengiriman?', a: 'Pesanan diproses dalam 1-2 hari kerja. Pengiriman reguler biasanya memakan waktu 2-4 hari tergantung lokasi Anda.' },
    { q: 'Apakah produk digital bisa langsung diakses?', a: 'Ya, setelah pembayaran dikonfirmasi oleh admin, link akses produk digital akan langsung dikirimkan ke WhatsApp atau Email Anda.' },
  ];

  const { getRecommendedProducts, history } = useProductHistory();

  const recommendedProducts = React.useMemo(() => {
    return getRecommendedProducts(allProducts);
  }, [getRecommendedProducts, allProducts]);

  const featuredProducts = React.useMemo(() => {
    return allProducts.slice(0, 3);
  }, [allProducts]);

  return (
    <div className="space-y-12 pb-20">
      {!isShop && <Hero featuredProducts={featuredProducts} />}

      {isShop && (
        <section className="max-w-7xl mx-auto px-4 pt-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-display font-bold tracking-tighter text-black uppercase italic">Katalog Produk</h1>
            <p className="text-black">Temukan berbagai produk berkualitas dari toko-toko mitra kami.</p>
          </div>
        </section>
      )}

      {/* Category Grid */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-widest text-black mb-6 ml-2">Kategori Pilihan</h3>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
            {categoriesData.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setCategory(cat.id);
                  document.getElementById('produk-list')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="flex flex-col items-center gap-3 group"
              >
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 group-hover:shadow-lg",
                  cat.color
                )}>
                  {cat.icon}
                </div>
                <span className="text-xs font-bold text-black transition-colors">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Flash Sale Section */}
      {!isShop && allProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4">
          <div className="bg-white rounded-2xl border border-tea-main/20 shadow-xl overflow-hidden ring-4 ring-tea-main/5">
            <div className="p-6 border-b border-black/5 flex flex-col sm:flex-row items-center justify-between gap-4 bg-tea-light/30">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-red-600">
                  <Zap size={24} fill="currentColor" className="animate-pulse" />
                  <h2 className="text-2xl font-display font-bold italic uppercase tracking-tighter">Flash Sale</h2>
                </div>
                <FlashSaleTimer />
              </div>
              <button 
                onClick={() => {
                  setCategory('all');
                  document.getElementById('produk-list')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-red-600 font-bold text-sm hover:underline"
              >
                Lihat Semua &gt;
              </button>
            </div>
            <div className="p-6 overflow-x-auto no-scrollbar">
              <div className="flex gap-4 min-w-max">
                 {allProducts.slice(0, 6).map((product) => (
                  <div 
                    key={product.id} 
                    onClick={() => onViewDetails(product)}
                    className="w-40 space-y-2 group cursor-pointer"
                  >
                    <div className="relative aspect-square rounded-xl overflow-hidden bg-bg-light animate-shimmer">
                      <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" referrerPolicy="no-referrer" />
                      <div className="absolute top-0 left-0 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-br-lg z-10 animate-pulse">
                        -30%
                      </div>
                      <div className="absolute bottom-2 left-2 right-2 bg-red-600/90 backdrop-blur-sm text-white text-[8px] font-bold py-1 px-2 rounded-lg text-center uppercase tracking-tighter z-10 shadow-sm">
                        Flash Sale
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-col">
                        <p className="text-red-600 font-bold text-sm">{formatPrice(product.price)}</p>
                        <p className="text-[10px] text-black/40 line-through">{formatPrice(product.price / 0.7)}</p>
                      </div>
                      <div className="space-y-1 pt-1">
                        <div className="w-full h-2 bg-black/10 rounded-full overflow-hidden">
                          <div className="h-full bg-red-600 w-3/4" />
                        </div>
                        <p className="text-[8px] md:text-[10px] font-bold text-black/80 uppercase">75% Terjual</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Recommendation History Section */}
      {!isShop && recommendedProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 space-y-8">
          <div className="flex items-center gap-2 text-black">
            <Gift size={20} className="text-tea-accent" />
            <h2 className="text-xl font-display font-bold tracking-tighter uppercase italic">Spesial Untukmu</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
            {recommendedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isWishlisted={wishlist.includes(product.id)}
                onAddToCart={onAddToCart}
                onToggleWishlist={onToggleWishlist}
                onViewDetails={onViewDetails}
              />
            ))}
          </div>
        </section>
      )}

      {/* Recently Viewed */}
      {!isShop && history.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 space-y-8">
          <div className="flex items-center gap-2 text-black">
            <Eye size={20} className="text-tea-main" />
            <h2 className="text-xl font-display font-bold tracking-tighter uppercase italic">Terakhir Dilihat</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4">
            {history.map((product) => (
              <div 
                key={product.id} 
                onClick={() => onViewDetails(product)}
                className="w-32 flex-shrink-0 cursor-pointer group"
              >
                <div className="aspect-square rounded-xl overflow-hidden bg-white border border-black/5 mb-2">
                  <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                </div>
                <p className="text-[10px] font-bold text-black truncate">{product.name}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Product Section */}
      <section id="produk-list" className="max-w-7xl mx-auto px-4 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 bg-white p-6 rounded-2xl border border-black/5 shadow-sm">
          <div className="space-y-2">
            <h2 className="text-2xl font-display font-bold tracking-tighter text-black uppercase italic">Rekomendasi</h2>
            <div className="h-1 w-20 bg-tea-main rounded-full" />
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="grid grid-cols-2 sm:flex sm:flex-row gap-4">
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-white border border-black/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 text-black font-bold cursor-pointer"
              >
                <option value="newest">Terbaru</option>
                <option value="price-low">Harga Terendah</option>
                <option value="price-high">Harga Tertinggi</option>
              </select>
              
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full sm:w-24 bg-white border border-black/5 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 transition-all text-black"
                />
                <span className="text-black/20">-</span>
                <input 
                  type="number" 
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full sm:w-24 bg-white border border-black/5 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 transition-all text-black"
                />
              </div>

              <div className="relative col-span-2 sm:col-span-1" ref={suggestionsRef}>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black" size={18} />
                <input
                  type="text"
                  placeholder="Cari produk..."
                  className="bg-white border border-black/5 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 w-full sm:w-64 transition-all text-black"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                />

                <AnimatePresence>
                  {showSuggestions && suggestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-white border border-black rounded-2xl shadow-2xl overflow-hidden z-20"
                    >
                      {suggestions.map((s, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            if (s.type === 'category') {
                              setCategory(s.value);
                              setSearch('');
                            } else {
                              setSearch(s.value);
                            }
                            setShowSuggestions(false);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-black/5 flex items-center gap-3 transition-colors"
                        >
                          <Search size={14} className="text-black" />
                          <div className="flex-1">
                            <p className="text-sm font-bold text-black">{s.value}</p>
                            <p className="text-[10px] uppercase tracking-widest text-black font-black">
                              {s.type === 'category' ? 'Kategori' : 'Produk'}
                            </p>
                          </div>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
              <button
                onClick={() => setCategory('all')}
                className={cn(
                  "px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                  category === 'all' 
                    ? "bg-tea-main text-black shadow-lg shadow-tea-main/20" 
                    : "bg-white text-black hover:bg-black/5"
                )}
              >
                Semua
              </button>
              {categoriesData.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={cn(
                    "px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                    category === cat.id 
                      ? "bg-tea-main text-black shadow-lg shadow-tea-main/20" 
                      : "bg-white text-black hover:bg-black/5"
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <motion.div 
          layout
          className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8"
        >
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isWishlisted={wishlist.includes(product.id)}
              onAddToCart={onAddToCart}
              onToggleWishlist={onToggleWishlist}
              onViewDetails={onViewDetails}
            />
          ))}
          {filteredProducts.length === 0 && (
            <div className="col-span-full py-20 text-center space-y-4 opacity-50 text-black">
              <Package size={48} className="mx-auto" />
              <p className="text-xl font-medium">Belum ada produk tersedia nih Kak.</p>
              { (search || category !== 'all') && (
                <button onClick={() => { setSearch(''); setCategory('all'); }} className="text-black font-bold underline">Reset Filter</button>
              )}
            </div>
          )}
        </motion.div>
      </section>

      {/* FAQ Section */}
      {!isShop && (
        <section className="bg-white py-20 px-4">
          <div className="max-w-3xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-display font-bold tracking-tighter text-black">Pertanyaan Umum</h2>
              <p className="text-black">Semua yang perlu Anda ketahui tentang belanja di ESTEHANGET.</p>
            </div>
            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <div 
                  key={i}
                  className="border border-black/10 rounded-2xl overflow-hidden"
                >
                  <button 
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-6 text-left hover:bg-black/5 transition-colors"
                  >
                    <span className="font-bold text-black">{faq.q}</span>
                    {openFaq === i ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                  <AnimatePresence>
                    {openFaq === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-6 pt-0 text-black text-sm leading-relaxed">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Why Us Section */}
      <section className="bg-tea-main/20 py-20 px-4 border-y border-tea-main/10">
        <div className="max-w-7xl mx-auto flex justify-center">
          <div className="text-center space-y-4 max-w-sm">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm border border-black/5 overflow-hidden">
              <img src={CONTACT_INFO.logo} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <h3 className="text-xl font-display font-bold text-black">Layanan 24/7</h3>
            <p className="text-sm text-black">ESA dan tim admin kami siap membantu kendala belanja Anda kapan saja.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
