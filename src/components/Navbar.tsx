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
  const [user, setUser] = React.useState<any>(null);
  const navigate = useNavigate();

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
      <div className="fixed top-0 left-0 right-0 z-[60] bg-sky-blue text-black py-1 overflow-hidden">
        <div className="flex whitespace-nowrap animate-ticker">
          <span className="mx-4 text-[10px] font-bold uppercase tracking-widest">✨ WELLCOME TO ESTEHANGET STORE DIMANA KALIAN BISA MENEMUKAN HAL MENARIK DISINI ✨</span>
          <span className="mx-4 text-[10px] font-bold uppercase tracking-widest">💎 SIAP PASARKAN PRODUK ANDA DI WEBSITE KAMI SEKARANG! 💎</span>
          <span className="mx-4 text-[10px] font-bold uppercase tracking-widest">✨ WELLCOME TO ESTEHANGET STORE DIMANA KALIAN BISA MENEMUKAN HAL MENARIK DISINI ✨</span>
          <span className="mx-4 text-[10px] font-bold uppercase tracking-widest">💎 SIAP PASARKAN PRODUK ANDA DI WEBSITE KAMI SEKARANG! 💎</span>
        </div>
      </div>
      <nav className={cn(
        "fixed top-6 left-0 right-0 z-50 transition-all duration-300 px-2 sm:px-4 py-3",
        isScrolled 
          ? "bg-white/95 backdrop-blur-md shadow-xl border-b border-tea-main/5" 
          : "bg-transparent"
      )}>
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 overflow-hidden">
        <Link to="/" className="flex items-center gap-2 flex-shrink-0">
          <img src={CONTACT_INFO.logo} alt="Logo" className="h-8 w-8 sm:h-10 sm:w-10 object-cover rounded-lg" referrerPolicy="no-referrer" />
          <span className="font-display text-lg sm:text-xl font-bold tracking-tighter text-black text-outline truncate max-w-[200px] sm:max-w-none">ESTEHANGET</span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8 font-medium text-black">
          <Link to="/shop" className="hover:text-tea-accent transition-colors text-outline">Shop</Link>
          <Link to="/about" className="hover:text-tea-accent transition-colors text-outline">About</Link>
          <Link to="/contact" className="hover:text-tea-accent transition-colors text-outline">Contact</Link>
        </div>

        {/* Desktop Search Bar (Shopee Style) */}
        <div className="hidden lg:flex flex-1 max-w-xl mx-8">
          <div className="relative w-full group">
            <input 
              type="text" 
              placeholder="Cari produk impianmu di sini..."
              className="w-full bg-black/5 border-2 border-transparent focus:border-tea-main rounded-xl px-4 py-2 text-sm focus:outline-none transition-all text-black"
            />
            <button className="absolute right-1 top-1 bottom-1 px-4 bg-tea-main text-black rounded-lg hover:bg-tea-main/80 transition-colors">
              <Search size={18} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-4">
          <button className="hidden md:flex p-2 hover:bg-black/5 rounded-full transition-colors text-black">
            <Search size={20} className="icon-outline" />
          </button>
          <button 
            onClick={onOpenWishlist}
            className="hidden md:flex p-2 hover:bg-black/5 rounded-full transition-colors relative text-black"
          >
            <Heart size={20} className="icon-outline" />
            {wishlistCount > 0 && (
              <span className="absolute top-0 right-0 bg-tea-accent text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                {wishlistCount}
              </span>
            )}
          </button>
          <button 
            onClick={onOpenCart}
            className="p-2 hover:bg-black/5 rounded-full transition-colors relative text-black"
          >
            <ShoppingCart size={20} className="icon-outline" />
            {cartCount > 0 && (
              <span className="absolute top-0 right-0 bg-tea-accent text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                {cartCount}
              </span>
            )}
          </button>

          {user && isSpecialPage && (
            <div className="relative group">
              <button className="flex items-center gap-2 p-1 pr-3 bg-black/5 rounded-full hover:bg-black/10 transition-all">
                <div className="w-8 h-8 bg-tea-main rounded-full flex items-center justify-center text-black font-bold text-xs">
                  {user.displayName?.[0].toUpperCase() || 'A'}
                </div>
                <span className="text-xs font-bold text-black hidden sm:inline">{user.displayName || 'Admin'}</span>
              </button>
              <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-black/5 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[100]">
                <Link to="/admin" className="block px-4 py-2 text-sm text-black hover:bg-black/5">Dashboard Admin</Link>
                <Link to="/seller" className="block px-4 py-2 text-sm text-tea-main font-bold hover:bg-black/5">Seller Center</Link>
                <button 
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50"
                >
                  Keluar
                </button>
              </div>
            </div>
          )}

          <button 
            className="md:hidden p-2 hover:bg-black/5 rounded-full transition-colors text-black"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 right-0 bg-white border-t border-black/10 p-4 flex flex-col gap-4 md:hidden shadow-lg"
          >
            <div className="flex items-center justify-around py-4 border-b border-black/5">
              <button 
                onClick={() => {
                  setIsMenuOpen(false);
                }}
                className="flex flex-col items-center gap-1 text-black"
              >
                <div className="p-3 bg-black/5 rounded-2xl">
                  <Search size={20} />
                </div>
                <span className="text-[10px] font-bold uppercase">Cari</span>
              </button>
              <button 
                onClick={() => {
                  setIsMenuOpen(false);
                  onOpenWishlist();
                }}
                className="flex flex-col items-center gap-1 text-black relative"
              >
                <div className="p-3 bg-black/5 rounded-2xl">
                  <Heart size={20} />
                  {wishlistCount > 0 && (
                    <span className="absolute top-2 right-2 bg-tea-accent text-white text-[8px] w-4 h-4 flex items-center justify-center rounded-full font-bold">
                      {wishlistCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-bold uppercase">Wishlist</span>
              </button>
            </div>
            <Link to="/shop" onClick={() => setIsMenuOpen(false)} className="text-lg font-bold text-black text-outline p-2 hover:bg-black/5 rounded-xl">Shop</Link>
            <Link to="/about" onClick={() => setIsMenuOpen(false)} className="text-lg font-bold text-black text-outline p-2 hover:bg-black/5 rounded-xl">About</Link>
            <Link to="/contact" onClick={() => setIsMenuOpen(false)} className="text-lg font-bold text-black text-outline p-2 hover:bg-black/5 rounded-xl">Contact</Link>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
    </>
  );
}
