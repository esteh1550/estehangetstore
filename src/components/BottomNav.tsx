import React from 'react';
import { Home, ShoppingBag, Search, User, Heart } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';

export default function BottomNav() {
  const location = useLocation();
  const user = React.useMemo(() => {
    try {
      const saved = localStorage.getItem('user_session');
      return (saved && saved !== 'undefined') ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  }, []);
  
  const navItems = [
    { icon: <Home size={20} />, label: 'Beranda', path: '/' },
    { icon: <ShoppingBag size={20} />, label: 'Belanja', path: '/shop' },
    { icon: <Search size={20} />, label: 'Cari', path: '/search' },
    { icon: <Heart size={20} />, label: 'Favorit', path: '/wishlist' },
    { icon: <User size={20} />, label: 'Saya', path: user ? '/admin' : '/login' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white/80 dark:bg-black/80 backdrop-blur-lg border-t border-black/5 dark:border-white/5 px-2 py-2">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all",
                isActive ? "text-tea-main" : "text-black/40 dark:text-white/40"
              )}
            >
              <div className={cn(
                "transition-transform",
                isActive && "scale-110"
              )}>
                {item.icon}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-tighter">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
