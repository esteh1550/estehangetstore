import React from 'react';
import { ShoppingCart, Heart, Search, Menu, X, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { CONTACT_INFO } from '../constants';
import { cn } from '../lib/utils';

interface NavbarProps {
  cartCount: number;
  wishlistCount: number;
  onOpenCart: () => void;
  onOpenWishlist: () => void;
}

export default function Navbar({ cartCount, wishlistCount, onOpenCart, onOpenWishlist }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [searchVal, setSearchVal] = React.useState('');
  const [user, setUser] = React.useState<any>(null);
  const navigate = useNavigate();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/?q=${encodeURIComponent(searchVal.trim())}`);
    } else {
      navigate('/');
    }
  };

  React.useEffect(() => {
    const checkUser = () => {
      try {
        const savedUser = localStorage.getItem('user_session');
        if (savedUser && savedUser !== 'undefined') {
          setUser(JSON.parse(savedUser));
        } else {
          setUser(null);
        }
      } catch (e) {
        setUser(null);
      }
    };
    
    checkUser();
    // Listen for storage changes in other tabs
    window.addEventListener('storage', checkUser);
    // Interval check for local changes within same window if not using events
    const interval = setInterval(checkUser, 1000);
    
    return () => {
      window.removeEventListener('storage', checkUser);
      clearInterval(interval);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user_session');
    setUser(null);
    navigate('/');
  };

  React.useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const location = useLocation();
  const isSpecialPage = location.pathname.startsWith('/admin') || location.pathname.startsWith('/seller');

  return (
    <>
      {/* Top Black / Dark Espresso Bar with Navigation Links */}
      <div className="fixed top-0 left-0 right-0 z-[60] bg-[#181512] text-white py-2 px-4 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between sm:justify-center overflow-x-auto no-scrollbar gap-6 sm:gap-8 text-[11px] font-bold tracking-widest uppercase">
          <Link to="/?sort=newest#produk-list" className="text-[#B83A0E] hover:text-white transition-colors whitespace-nowrap">PRODUK TERBARU</Link>
          <Link to="/?model=Sepatu Kasual / Lifestyle#produk-list" className="text-[#B83A0E] hover:text-white transition-colors whitespace-nowrap">KOLEKSI KLASIK</Link>
          <Link to="/?model=Sepatu Formal & Semi-Formal#produk-list" className="text-[#B83A0E] hover:text-white transition-colors whitespace-nowrap">SEPATU FORMAL</Link>
          <Link to="/?model=Sepatu Olahraga#produk-list" className="text-[#B83A0E] hover:text-white transition-colors whitespace-nowrap">SEPATU OLAHRAGA</Link>
          <Link to="/#filter-merek" className="text-[#B83A0E] hover:text-white transition-colors whitespace-nowrap">MEREK</Link>
          <Link to="/contact" className="text-[#B83A0E] hover:text-white transition-colors whitespace-nowrap">KONTAK</Link>
          <Link to="/#new-arrival" className="text-[#B83A0E] hover:text-white transition-colors whitespace-nowrap">PROMO DISKON</Link>
        </div>
      </div>

      <nav className={cn(
        "fixed top-9 left-0 right-0 z-50 transition-all duration-300 px-4 py-3 border-b border-[#E8DEC9]",
        isScrolled 
          ? "bg-[#FAF7F2]/95 backdrop-blur-md shadow-md" 
          : "bg-[#FAF7F2]"
      )}>
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Mobile menu & Search Form */}
        <div className="flex items-center gap-3">
          <button 
            className="md:hidden p-1.5 hover:bg-black/5 rounded-lg transition-colors text-[#181512]"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          
          <form onSubmit={handleSearchSubmit} className="hidden sm:flex items-center relative w-48 lg:w-64">
            <input 
              type="text" 
              placeholder="Cari sepatu..."
              className="w-full bg-[#FAF6F0] border border-[#E0D6C3] rounded-full pl-3 pr-8 py-1.5 text-xs text-[#181512] placeholder-[#8C8375] focus:outline-none focus:border-[#B83A0E]"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
            />
            <button type="submit" className="absolute right-2 text-[#181512] hover:text-[#B83A0E]">
              <Search size={14} />
            </button>
          </form>
        </div>

        {/* Center: Brand Serif Logo & Image */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <img 
            src="https://cdn.phototourl.com/free/2026-08-13-b62f43fb-a043-44e5-bc93-ad3a57c3c330.png" 
            alt="E STORE Logo" 
            referrerPolicy="no-referrer"
            className="w-9 h-9 sm:w-11 sm:h-11 object-contain drop-shadow-sm group-hover:scale-105 transition-transform"
          />
          <div className="flex flex-col items-start">
            <span className="font-serif text-xl sm:text-2xl font-bold tracking-[0.18em] text-[#181512] uppercase group-hover:text-[#B83A0E] transition-colors leading-none">
              E STORE
            </span>
            <span className="text-[7.5px] sm:text-[8.5px] font-bold tracking-[0.2em] text-[#8C8375] uppercase mt-0.5">
              SHOES STORE TERPERCAYA
            </span>
          </div>
        </Link>

        {/* Right: Actions (Search, Heart, Cart, User) */}
        <div className="flex items-center gap-2 sm:gap-4">
          <button 
            onClick={onOpenWishlist}
            className="p-2 hover:bg-black/5 rounded-full transition-colors relative text-[#181512]"
            title="Wishlist"
          >
            <Heart size={20} />
            {wishlistCount > 0 && (
              <span className="absolute top-0 right-0 bg-[#B83A0E] text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                {wishlistCount}
              </span>
            )}
          </button>

          <button 
            onClick={onOpenCart}
            className="p-2 hover:bg-black/5 rounded-full transition-colors relative text-[#181512]"
            title="Keranjang"
          >
            <ShoppingCart size={20} />
            {cartCount > 0 && (
              <span className="absolute top-0 right-0 bg-[#B83A0E] text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                {cartCount}
              </span>
            )}
          </button>

          {user && isSpecialPage && (
            <div className="relative group">
              <button className="flex items-center gap-2 p-1 pr-3 bg-black/5 rounded-full hover:bg-black/10 transition-all">
                <div className="w-7 h-7 bg-[#B83A0E] rounded-full flex items-center justify-center text-white font-bold text-xs">
                  {user.displayName?.[0].toUpperCase() || 'A'}
                </div>
                <span className="text-xs font-bold text-[#181512] hidden sm:inline">{user.displayName || 'Admin'}</span>
              </button>
              <div className="absolute top-full right-0 mt-2 w-48 bg-[#FAF7F2] rounded-xl shadow-2xl border border-[#E5DEC9] py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[100]">
                <Link to="/admin" className="block px-4 py-2 text-xs font-bold text-[#181512] hover:bg-black/5">Dashboard Admin</Link>
                <Link to="/seller" className="block px-4 py-2 text-xs font-bold text-[#B83A0E] hover:bg-black/5">Seller Center</Link>
                <button 
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50"
                >
                  Keluar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 right-0 bg-[#FAF7F2] border-b border-[#E5DEC9] p-4 flex flex-col gap-3 md:hidden shadow-xl"
          >
            <form onSubmit={handleSearchSubmit} className="relative w-full mb-2">
              <input 
                type="text" 
                placeholder="Cari sepatu (Nike, Vans, Converse)..."
                className="w-full bg-[#FAF6F0] border border-[#E0D6C3] rounded-full pl-4 pr-10 py-2 text-sm text-[#181512]"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
              />
              <button type="submit" className="absolute right-3 top-2.5 text-[#181512]">
                <Search size={18} />
              </button>
            </form>
            <Link to="/" onClick={() => setIsMenuOpen(false)} className="text-sm font-bold uppercase tracking-wider text-[#181512] p-2 hover:bg-black/5 rounded-lg">Beranda</Link>
            <Link to="/?model=Sepatu Kasual / Lifestyle#produk-list" onClick={() => setIsMenuOpen(false)} className="text-sm font-bold uppercase tracking-wider text-[#181512] p-2 hover:bg-black/5 rounded-lg">Koleksi Klasik</Link>
            <Link to="/?model=Sepatu Formal & Semi-Formal#produk-list" onClick={() => setIsMenuOpen(false)} className="text-sm font-bold uppercase tracking-wider text-[#181512] p-2 hover:bg-black/5 rounded-lg">Sepatu Formal</Link>
            <Link to="/?model=Sepatu Olahraga#produk-list" onClick={() => setIsMenuOpen(false)} className="text-sm font-bold uppercase tracking-wider text-[#181512] p-2 hover:bg-black/5 rounded-lg">Sepatu Olahraga</Link>
            <Link to="/#filter-merek" onClick={() => setIsMenuOpen(false)} className="text-sm font-bold uppercase tracking-wider text-[#181512] p-2 hover:bg-black/5 rounded-lg">Merek Populer</Link>
            <Link to="/orders" onClick={() => setIsMenuOpen(false)} className="text-sm font-bold uppercase tracking-wider text-[#181512] p-2 hover:bg-black/5 rounded-lg">Riwayat Pesanan</Link>
            <Link to="/contact" onClick={() => setIsMenuOpen(false)} className="text-sm font-bold uppercase tracking-wider text-[#181512] p-2 hover:bg-black/5 rounded-lg">Kontak Kami</Link>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
    </>
  );
}
