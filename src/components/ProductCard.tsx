import React from 'react';
import { Heart, ShoppingCart, Eye, Star, MapPin, Share2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Product } from '../types';
import { formatPrice, cn } from '../lib/utils';
import { STORE } from '../constants';

interface ProductCardProps {
  key?: React.Key;
  product: Product;
  isWishlisted: boolean;
  onAddToCart: (p: Product) => void;
  onToggleWishlist: (id: string) => void;
  onViewDetails: (p: Product) => void;
}

const ProductCard = React.memo(({ product, isWishlisted, onAddToCart, onToggleWishlist }: ProductCardProps) => {
  const store = STORE;
  
  // Use product.id to generate consistent "random" values
  const rating = React.useMemo(() => {
    const seed = product.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return (4.5 + (seed % 5) / 10).toFixed(1);
  }, [product.id]);

  const soldCount = React.useMemo(() => {
    const seed = product.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return (seed % 450) + 50;
  }, [product.id]);

  const location = store?.location || 'Jakarta';
  
  const stockInfo = React.useMemo(() => {
    if (product.stock === undefined) return null;
    if (product.stock === 0) return { label: 'Habis', color: 'bg-red-500 text-white' };
    if (product.stock <= 5) return { label: `Sisa ${product.stock}`, color: 'bg-orange-500 text-white' };
    return { label: 'Tersedia', color: 'bg-green-500/10 text-green-600' };
  }, [product.stock]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -5 }}
      className="bg-white dark:bg-[#1a1a1a] rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all group border border-black/5 dark:border-white/5 flex flex-col h-full"
    >
      <div className="relative aspect-square overflow-hidden bg-bg-light dark:bg-white/5">
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {store?.isStar && (
            <span className="bg-sky-blue text-black text-[8px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-tighter">Star+</span>
          )}
          {store?.isMall && (
            <span className="bg-black text-white dark:bg-white dark:text-black text-[8px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-tighter">Mall</span>
          )}
          {stockInfo && (
            <span className={cn("text-[8px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-tighter", stockInfo.color)}>
              {stockInfo.label}
            </span>
          )}
        </div>
        
        <div className="absolute top-3 right-3 flex flex-col gap-2 translate-x-12 group-hover:translate-x-0 transition-transform duration-300">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleWishlist(product.id);
            }}
            className={`p-2 rounded-full shadow-md transition-colors ${isWishlisted ? 'bg-red-500 text-white' : 'bg-white dark:bg-black text-black dark:text-white hover:bg-red-50 dark:hover:bg-red-900/20'}`}
          >
            <Heart size={16} fill={isWishlisted ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const url = `${window.location.origin}/product/${product.id}`;
              navigator.clipboard.writeText(url);
              alert('Link produk disalin!');
            }}
            className="p-2 bg-white dark:bg-black text-black dark:text-white rounded-full shadow-md hover:bg-sky-blue hover:text-black transition-all"
            title="Bagikan"
          >
            <Share2 size={16} />
          </button>
        </div>
      </div>

      <div className="p-2 md:p-3 flex flex-col flex-1 space-y-2">
        <Link to={`/product/${product.id}`} className="flex-1">
          <h3 className="font-medium text-xs md:text-sm line-clamp-2 text-black dark:text-white leading-snug hover:text-sky-blue transition-colors">
            {product.name}
          </h3>
        </Link>
        
        <div className="space-y-1">
          <p className="text-sky-blue font-bold text-sm md:text-lg">{formatPrice(product.price)}</p>
          
          <div className="flex items-center justify-between text-[10px] text-black dark:text-white">
            <div className="flex items-center gap-1">
              <div className="flex items-center text-yellow-500">
                <Star size={10} fill="currentColor" />
                <span className="ml-0.5 font-bold text-black dark:text-white">{rating}</span>
              </div>
              <span className="mx-1">|</span>
              <span>Terjual {soldCount}</span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-[10px] text-black dark:text-white pt-1">
            <MapPin size={10} />
            <span>{location}</span>
          </div>
        </div>

        <button
          onClick={() => onAddToCart(product)}
          className="w-full mt-2 border border-sky-blue text-sky-blue hover:bg-sky-blue hover:text-black py-1.5 rounded-lg font-bold text-[10px] md:text-xs transition-colors flex items-center justify-center gap-2"
        >
          <ShoppingCart size={12} /> Beli Sekarang
        </button>
      </div>
    </motion.div>
  );
});

export default ProductCard;
