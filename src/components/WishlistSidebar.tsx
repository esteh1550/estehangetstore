import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Heart, ShoppingCart, Trash2, ArrowRight, Crown } from 'lucide-react';
import { Product } from '../types';
import { formatPrice } from '../lib/utils';
import { isSecondProduct } from '../lib/condition';
import { isLuxuryProduct } from '../lib/luxury';

interface WishlistSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  wishlist: string[];
  allProducts: Product[];
  onToggleWishlist: (id: string) => void;
  onAddToCart: (p: Product) => void;
}

export default function WishlistSidebar({
  isOpen,
  onClose,
  wishlist,
  allProducts,
  onToggleWishlist,
  onAddToCart,
}: WishlistSidebarProps) {
  
  // Filter products that are in the wishlist
  const wishlistedProducts = React.useMemo(() => {
    return allProducts.filter(p => wishlist.includes(p.id));
  }, [wishlist, allProducts]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-bone z-[101] shadow-2xl flex flex-col"
          >
            <div className="p-6 flex items-center justify-between border-b border-black/10">
              <div className="flex items-center gap-2">
                <Heart className="text-red-500 fill-red-500" />
                <h2 className="text-xl font-display font-bold text-black">Wishlist Saya</h2>
                <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">
                  {wishlistedProducts.length}
                </span>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors text-black">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {wishlistedProducts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50 text-black py-12">
                  <Heart size={64} className="text-black/30" />
                  <p className="font-medium text-sm">Wishlist kamu masih kosong nih Kak.</p>
                  <button onClick={onClose} className="text-black font-bold underline text-xs">Ayo cari produk keren!</button>
                </div>
              ) : (
                <div className="space-y-4">
                  {wishlistedProducts.map((product) => (
                    <div key={product.id} className="flex gap-4 bg-white p-3 rounded-2xl shadow-sm border border-black/5">
                      <img 
                        src={product.images[0]} 
                        alt={product.name} 
                        className="w-20 h-20 object-cover rounded-xl" 
                        referrerPolicy="no-referrer" 
                      />
                      <div className="flex-1 flex flex-col justify-between">
                        <div className="space-y-1">
                          <div className="flex justify-between items-start gap-2">
                            <h3 className="font-bold text-xs md:text-sm leading-tight text-black line-clamp-1">{product.name}</h3>
                            <button 
                              onClick={() => onToggleWishlist(product.id)} 
                              className="text-red-400 hover:text-red-600 p-0.5"
                              title="Hapus dari Wishlist"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          <p className="text-xs font-bold text-tea-accent">{formatPrice(product.price)}</p>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="inline-block text-[9px] px-2 py-0.5 bg-black/5 text-black/60 rounded-full font-bold uppercase">
                              {product.category}
                            </span>
                            <span className={`inline-block text-[8.5px] px-2 py-0.5 rounded-full font-black uppercase text-white ${isSecondProduct(product) ? 'bg-amber-600' : 'bg-emerald-600'}`}>
                              {isSecondProduct(product) ? 'Second' : 'Baru'}
                            </span>
                            {isLuxuryProduct(product) && (
                              <span className="inline-flex items-center gap-0.5 text-[8.5px] px-2 py-0.5 rounded-full font-black uppercase bg-gradient-to-r from-zinc-950 to-zinc-900 text-amber-300 border border-amber-400/40 shadow-sm">
                                <Crown size={9} className="text-amber-400" /> PREMIUM
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="pt-2 flex justify-end">
                          <button
                            onClick={() => {
                              onAddToCart(product);
                              onClose();
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-tea-main hover:bg-tea-main/80 text-black text-[10px] font-bold rounded-lg transition-colors"
                          >
                            <ShoppingCart size={12} />
                            Beli Sekarang
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {wishlistedProducts.length > 0 && (
              <div className="p-6 border-t border-black/10 bg-white space-y-4">
                <button
                  onClick={onClose}
                  className="w-full bg-black hover:bg-black/80 text-white py-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  Lanjut Belanja <ArrowRight size={14} />
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
