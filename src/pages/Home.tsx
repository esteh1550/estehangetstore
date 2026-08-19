import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Filter, Star, ChevronDown, ChevronUp, Zap, Footprints, Eye, Package, Check, Sparkles, Ruler, Crown } from 'lucide-react';
import Hero from '../components/Hero';
import ProductCard from '../components/ProductCard';
import { PRODUCTS, CONTACT_INFO, STORE } from '../constants';
import { Product } from '../types';
import { cn, formatPrice } from '../lib/utils';
import { Link, useSearchParams } from 'react-router-dom';
import { getAllProducts } from '../lib/sellerService';
import { useProductHistory } from '../lib/useProductHistory';
import { useToast } from '../components/Toast';
import { SHOE_BRANDS, SHOE_MODELS } from '../constants/shoeCategories';
import { isLuxuryProduct, LUXURY_PRICE_THRESHOLD } from '../lib/luxury';

const ALL_SHOE_SIZES = ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'];

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
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = React.useState('');
  const [category, setCategory] = React.useState<string>('all');
  const [selectedBrand, setSelectedBrand] = React.useState<string>('all');
  const [selectedShoeModel, setSelectedShoeModel] = React.useState<string>('all');
  const [selectedShoeType, setSelectedShoeType] = React.useState<string>('all');
  const [selectedSize, setSelectedSize] = React.useState<string>('all');
  const [onlyLuxury, setOnlyLuxury] = React.useState(false);

  React.useEffect(() => {
    const q = searchParams.get('q');
    const cat = searchParams.get('category');
    const brand = searchParams.get('brand');
    const model = searchParams.get('model');
    const type = searchParams.get('type');
    const sz = searchParams.get('size');
    const sort = searchParams.get('sort');
    const lux = searchParams.get('luxury');

    setSearch(q !== null ? q : '');
    setCategory(cat !== null ? cat : 'all');
    setSelectedBrand(brand !== null ? brand : 'all');
    setSelectedShoeModel(model !== null ? model : 'all');
    setSelectedShoeType(type !== null ? type : 'all');
    setSelectedSize(sz !== null ? sz : 'all');
    if (lux === 'true') {
      setOnlyLuxury(true);
    }
    if (sort === 'price-low' || sort === 'price-high' || sort === 'newest') {
      setSortBy(sort);
    }

    if (window.location.hash) {
      const targetId = window.location.hash.replace('#', '');
      setTimeout(() => {
        document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    }
  }, [searchParams]);

  const [sortBy, setSortBy] = React.useState<'newest' | 'price-low' | 'price-high'>('newest');
  const [minPrice, setMinPrice] = React.useState<string>('');
  const [maxPrice, setMaxPrice] = React.useState<string>('');
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

  // Available sub-types based on current selected Shoe Model
  const availableSubTypes = React.useMemo(() => {
    if (selectedShoeModel === 'all') {
      return SHOE_MODELS.flatMap(m => m.subTypes);
    }
    const modelObj = SHOE_MODELS.find(m => m.id === selectedShoeModel);
    return modelObj ? modelObj.subTypes : [];
  }, [selectedShoeModel]);

  const suggestions = React.useMemo(() => {
    if (!search.trim()) return [];
    const searchLower = search.toLowerCase();
    
    const productSuggestions = allProducts
      .filter(p => p.name.toLowerCase().includes(searchLower))
      .map(p => ({ type: 'product', value: p.name }));

    const brandSuggestions = SHOE_BRANDS
      .filter(b => b.toLowerCase().includes(searchLower))
      .map(b => ({ type: 'brand', value: b }));
      
    return [...productSuggestions, ...brandSuggestions].slice(0, 5);
  }, [search, allProducts]);

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
                         p.description.toLowerCase().includes(searchLower) ||
                         (p.brand && p.brand.toLowerCase().includes(searchLower)) ||
                         (p.shoeModel && p.shoeModel.toLowerCase().includes(searchLower)) ||
                         (p.shoeType && p.shoeType.toLowerCase().includes(searchLower));

    const matchesCategory = category === 'all' || p.category === category;
    
    const matchesBrand = selectedBrand === 'all' || 
                         (p.brand && p.brand.toLowerCase() === selectedBrand.toLowerCase());

    const matchesShoeModel = selectedShoeModel === 'all' || 
                             (p.shoeModel && p.shoeModel === selectedShoeModel);

    const matchesShoeType = selectedShoeType === 'all' || 
                            (p.shoeType && p.shoeType === selectedShoeType);

    const matchesSize = selectedSize === 'all' ||
                        (p.sizes && p.sizes.includes(selectedSize)) ||
                        (!p.sizes && ['38', '39', '40', '41', '42', '43', '44'].includes(selectedSize));

    const pMin = minPrice ? parseInt(minPrice) : 0;
    const pMax = maxPrice ? parseInt(maxPrice) : Infinity;
    const matchesPrice = p.price >= pMin && p.price <= pMax;
    const matchesLuxury = !onlyLuxury || isLuxuryProduct(p);
    
    return matchesSearch && matchesCategory && matchesBrand && matchesShoeModel && matchesShoeType && matchesSize && matchesPrice && matchesLuxury;
  }).sort((a, b) => {
    // Sold out items always go to the bottom
    const aSold = (a.stock || 0) <= 0;
    const bSold = (b.stock || 0) <= 0;
    if (aSold && !bSold) return 1;
    if (!aSold && bSold) return -1;

    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    return 0; // 'newest' is default order in constants
  });

  const luxuryProducts = React.useMemo(() => {
    return allProducts.filter(p => isLuxuryProduct(p) && (p.stock || 0) > 0);
  }, [allProducts]);

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
            <h1 className="text-4xl font-display font-bold tracking-tighter text-black uppercase italic">Katalog Sepatu E STORE</h1>
            <p className="text-black font-medium">Temukan koleksi sepatu original Nike, Adidas, New Balance, Converse, dan Vans dengan harga terbaik.</p>
          </div>
        </section>
      )}

      {/* Filter Box */}
      <section className="max-w-7xl mx-auto px-4 space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-black/5">
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-black/60" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-black">Filter & Katalog Sepatu</h3>
            </div>
            {(selectedSize !== 'all' || selectedBrand !== 'all' || selectedShoeModel !== 'all' || selectedShoeType !== 'all' || search !== '') && (
              <button 
                onClick={() => {
                  setCategory('all');
                  setSelectedBrand('all');
                  setSelectedShoeModel('all');
                  setSelectedShoeType('all');
                  setSelectedSize('all');
                  setSearch('');
                }}
                className="text-xs font-extrabold text-red-600 hover:underline flex items-center gap-1"
              >
                Reset Semua Filter
              </button>
            )}
          </div>

          {/* Filter Ukuran Sepatu (Size) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-black/60 flex items-center gap-1.5">
                <Ruler size={14} className="text-blue-600" />
                Filter Ukuran Sepatu (Size)
              </span>
              {selectedSize !== 'all' && (
                <button 
                  onClick={() => setSelectedSize('all')}
                  className="text-[10px] font-bold text-blue-600 hover:underline"
                >
                  Lihat Semua Size
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setSelectedSize('all')}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-all border",
                  selectedSize === 'all'
                    ? "bg-black text-white border-black shadow-sm"
                    : "bg-black/5 text-black border-transparent hover:bg-black/10"
                )}
              >
                Semua Size
              </button>
              {ALL_SHOE_SIZES.map(sz => (
                <button
                  key={sz}
                  onClick={() => {
                    setSelectedSize(selectedSize === sz ? 'all' : sz);
                    document.getElementById('produk-list')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-black transition-all border flex items-center gap-1",
                    selectedSize === sz
                      ? "bg-black text-white border-black shadow-md scale-105"
                      : "bg-white text-black/80 border-black/10 hover:border-black/30 hover:bg-black/5"
                  )}
                >
                  <span>{sz}</span>
                  {selectedSize === sz && <Check size={12} />}
                </button>
              ))}
            </div>
          </div>

          {/* Filter Brand Sepatu */}
          <div id="filter-merek" className="pt-4 border-t border-black/5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-black/60 flex items-center gap-1.5">
                <Footprints size={14} className="text-blue-600" />
                Brand Sepatu Populer
              </span>
              {selectedBrand !== 'all' && (
                <button 
                  onClick={() => setSelectedBrand('all')}
                  className="text-[10px] font-bold text-blue-600 hover:underline"
                >
                  Lihat Semua Brand
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedBrand('all')}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-all border",
                  selectedBrand === 'all'
                    ? "bg-black text-white border-black shadow-sm"
                    : "bg-black/5 text-black border-transparent hover:bg-black/10"
                )}
              >
                Semua Brand
              </button>
              {SHOE_BRANDS.map(brand => (
                <button
                  key={brand}
                  onClick={() => {
                    setSelectedBrand(selectedBrand === brand ? 'all' : brand);
                    document.getElementById('produk-list')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={cn(
                    "px-3.5 py-1.5 rounded-xl text-xs font-black transition-all border flex items-center gap-1.5",
                    selectedBrand === brand
                      ? "bg-blue-600 text-white border-blue-600 shadow-md scale-105"
                      : "bg-blue-50/70 text-blue-900 border-blue-100 hover:bg-blue-100"
                  )}
                >
                  <span>{brand}</span>
                  {selectedBrand === brand && <Check size={12} />}
                </button>
              ))}
            </div>
          </div>

          {/* Filter Kategori Model Sepatu */}
          <div className="pt-3 border-t border-black/5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-black/60">
                Model & Tipe Sepatu
              </span>
              {selectedShoeModel !== 'all' && (
                <button 
                  onClick={() => {
                    setSelectedShoeModel('all');
                    setSelectedShoeType('all');
                  }}
                  className="text-[10px] font-bold text-blue-600 hover:underline"
                >
                  Semua Model
                </button>
              )}
            </div>

            {/* Main Shoe Model Tabs */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setSelectedShoeModel('all');
                  setSelectedShoeType('all');
                }}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all border",
                  selectedShoeModel === 'all'
                    ? "bg-black text-white border-black"
                    : "bg-black/5 text-black border-transparent hover:bg-black/10"
                )}
              >
                Semua Model
              </button>
              {SHOE_MODELS.map(model => (
                <button
                  key={model.id}
                  onClick={() => {
                    if (selectedShoeModel === model.id) {
                      setSelectedShoeModel('all');
                      setSelectedShoeType('all');
                    } else {
                      setSelectedShoeModel(model.id);
                      setSelectedShoeType('all');
                    }
                    document.getElementById('produk-list')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={cn(
                    "px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all border",
                    selectedShoeModel === model.id
                      ? "bg-tea-main text-white border-tea-main shadow-sm"
                      : "bg-black/5 text-black border-transparent hover:bg-black/10"
                  )}
                >
                  {model.name}
                </button>
              ))}
            </div>

            {/* Sub-types Badges */}
            {availableSubTypes.length > 0 && (
              <div className="pt-2 flex flex-wrap gap-1.5 bg-black/5 p-3 rounded-2xl border border-black/5">
                <span className="text-[10px] font-black text-black/40 uppercase tracking-widest mr-2 self-center">
                  Tipe:
                </span>
                <button
                  onClick={() => setSelectedShoeType('all')}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all",
                    selectedShoeType === 'all'
                      ? "bg-black text-white"
                      : "bg-white text-black/70 hover:bg-white/80"
                  )}
                >
                  Semua Tipe
                </button>
                {availableSubTypes.map(st => (
                  <button
                    key={st}
                    onClick={() => {
                      setSelectedShoeType(selectedShoeType === st ? 'all' : st);
                      document.getElementById('produk-list')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all border",
                      selectedShoeType === st
                        ? "bg-black text-white border-black shadow-sm"
                        : "bg-white text-black border-black/10 hover:border-black/30"
                    )}
                  >
                    {st}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* New Arrival Section */}
      {!isShop && allProducts.length > 0 && (
        <section id="new-arrival" className="max-w-7xl mx-auto px-4">
          <div className="bg-[#FAF4ED] rounded-2xl border border-[#E8DEC9] shadow-sm overflow-hidden">
            <div className="p-5 border-b border-[#E8DEC9] flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#F2EADF]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#B83A0E] text-white rounded-xl shadow-sm">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-serif font-bold uppercase tracking-wider text-[#181512]">New Arrival</h2>
                  <p className="text-xs text-[#7A7163]">Rilis Terbaru Koleksi Sepatu Original</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setCategory('all');
                  document.getElementById('produk-list')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-[#B83A0E] font-bold text-xs sm:text-sm hover:underline uppercase tracking-wider transition-colors"
              >
                Lihat Semua &gt;
              </button>
            </div>
            <div className="p-6 overflow-x-auto no-scrollbar">
              <div className="flex gap-4 min-w-max">
                 {allProducts.slice(0, 8).map((product) => {
                  const isSoldOut = product.stock === 0;
                  return (
                    <div 
                      key={product.id} 
                      onClick={() => onViewDetails(product)}
                      className="w-44 space-y-2 group cursor-pointer bg-white p-2.5 rounded-xl border border-[#E8DEC9] shadow-sm hover:shadow-md transition-all"
                    >
                      <div className="relative aspect-square rounded-lg overflow-hidden bg-[#FAF6F0] border border-[#E8DEC9]">
                        <img 
                          src={product.images[0]} 
                          alt={product.name} 
                          className={cn(
                            "w-full h-full object-cover group-hover:scale-105 transition-transform duration-300",
                            isSoldOut && "filter grayscale-[30%] opacity-80"
                          )} 
                          referrerPolicy="no-referrer" 
                        />
                        
                        {/* Top Badge */}
                        {isSoldOut ? (
                          <div className="absolute top-0 left-0 bg-red-700 text-white text-[9px] font-bold px-2 py-0.5 rounded-br-lg z-10 shadow-sm">
                            SOLD
                          </div>
                        ) : (
                          <div className="absolute top-0 left-0 bg-[#B83A0E] text-white text-[9px] font-bold px-2 py-0.5 rounded-br-lg z-10 shadow-sm uppercase tracking-wider">
                            NEW
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <p className={cn(
                          "text-xs font-serif font-bold uppercase tracking-wide line-clamp-1 transition-colors",
                          isSoldOut ? "line-through text-black/40" : "text-[#181512] group-hover:text-[#B83A0E]"
                        )}>
                          {product.name}
                        </p>
                        
                        <p className={cn("font-bold text-xs text-[#B83A0E]", isSoldOut && "text-black/40 line-through")}>
                          {formatPrice(product.price)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
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

      {/* Luxury Showcase (Products > 500rb) */}
      {!isShop && luxuryProducts.length > 0 && !search && (
        <section className="max-w-7xl mx-auto px-4">
          <div className="rounded-3xl bg-gradient-to-br from-[#12100E] via-[#1F1A14] to-[#2B2319] p-6 md:p-10 border border-[#D4AF37]/40 shadow-2xl text-white relative overflow-hidden">
            {/* Background luxury accent */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 relative z-10 border-b border-white/10 pb-6">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#E5C158] text-xs font-black tracking-widest uppercase">
                  <Crown size={14} className="text-[#D4AF37]" />
                  <span>Koleksi Produk Mewah (&gt; Rp 500.000)</span>
                </div>
                <h2 className="text-2xl md:text-4xl font-display font-bold tracking-tight text-white">
                  Koleksi Eksklusif & <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#FFF0B8]">Sepatu Pilihan</span>
                </h2>
                <p className="text-xs md:text-sm text-[#C4B9A7] max-w-2xl leading-relaxed">
                  Pilihan produk sepatu mewah berkelas dengan material premium dan desain eksklusif untuk penampilan istimewa.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setOnlyLuxury(true);
                    document.getElementById('produk-list')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black font-extrabold text-xs uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-[#D4AF37]/20"
                >
                  <Crown size={15} /> Lihat Semua ({luxuryProducts.length})
                </button>
              </div>
            </div>

            {/* Luxury Products Horizontal / Grid Slider */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
              {luxuryProducts.slice(0, 4).map((product) => (
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
                onClick={() => {
                  setCategory('all');
                  setOnlyLuxury(false);
                }}
                className={cn(
                  "px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                  category === 'all' && !onlyLuxury
                    ? "bg-tea-main text-black shadow-lg shadow-tea-main/20" 
                    : "bg-white text-black hover:bg-black/5"
                )}
              >
                Semua Produk
              </button>

              <button
                onClick={() => setOnlyLuxury(prev => !prev)}
                className={cn(
                  "px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-1.5 border",
                  onlyLuxury 
                    ? "bg-[#161311] text-[#E5C158] border-[#D4AF37] shadow-lg shadow-[#D4AF37]/20" 
                    : "bg-[#FDFBF7] text-[#8C6D1F] border-[#D4AF37]/40 hover:bg-[#F8F4EB]"
                )}
              >
                <Crown size={14} className="text-[#D4AF37]" />
                <span>Produk Mewah (&gt; 500rb)</span>
                {onlyLuxury && <Check size={14} className="text-[#E5C158]" />}
              </button>
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

      {/* Why Us Section */}
      <section className="bg-tea-main/20 py-20 px-4 border-y border-tea-main/10">
        <div className="max-w-7xl mx-auto flex justify-center">
          <div className="text-center space-y-4 max-w-sm">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm border border-black/5 overflow-hidden p-1">
              <img src={CONTACT_INFO.logo} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
            </div>
            <h3 className="text-xl font-display font-bold text-black">Layanan 24/7</h3>
            <p className="text-sm text-black/70 font-medium">Tim admin kami siap membantu kendala belanja Anda kapan saja.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
