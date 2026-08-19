import React from 'react';
import { Heart, ShoppingCart, Eye, Star, MapPin, Share2, Crown } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Product } from '../types';
import { formatPrice, cn } from '../lib/utils';
import { STORE } from '../constants';
import { isLuxuryProduct } from '../lib/luxury';

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
  const isLuxury = isLuxuryProduct(product);
  
  // Use product.id to generate consistent "random" values
  const rating = React.useMemo(() => {
    const seed = product.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return (4.5 + (seed % 5) / 10).toFixed(1);
  }, [product.id]);

  const location = store?.location || 'Majalengka';
  
  const stockInfo = React.useMemo(() => {
    if (product.stock === undefined) return null;
    if (product.stock === 0) return { label: 'SOLD', color: 'bg-red-600 text-white font-extrabold' };
    if (product.stock <= 5) return { label: `Sisa ${product.stock}`, color: 'bg-orange-500 text-white font-bold' };
    return { label: 'Tersedia', color: 'bg-green-500/10 text-green-600 font-bold' };
  }, [product.stock]);

  const isSoldOut = product.stock === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      className={cn(
        "bg-[#FAF6F0] rounded-2xl overflow-hidden border shadow-sm hover:shadow-md transition-all group flex flex-col h-full relative p-3",
        isLuxury ? "border-[#D4AF37]/50 shadow-[0_2px_12px_rgba(212,175,55,0.12)] bg-gradient-to-b from-[#FAF7EE] to-[#FAF6F0]" : "border-[#E5DEC9]",
        isSoldOut && "opacity-85"
      )}
    >
      <div className={cn(
        "relative aspect-square overflow-hidden bg-white rounded-xl border",
        isLuxury ? "border-[#D4AF37]/30" : "border-[#EDE4D5]"
      )}>
        <img
          src={product.images[0]}
          alt={product.name}
          className={cn(
            "w-full h-full object-cover group-hover:scale-105 transition-transform duration-500",
            isSoldOut && "filter grayscale-[25%]"
          )}
          referrerPolicy="no-referrer"
        />
        
        {/* Luxury Badge for price > 500k */}
        {isLuxury && (
          <div
            className="absolute top-2 left-2 z-10 bg-gradient-to-r from-[#141210] to-[#2B2620] text-[#D4AF37] border border-[#D4AF37]/60 text-[9px] font-black px-2 py-1 rounded-lg flex items-center gap-1 shadow-md tracking-wider uppercase"
          >
            <Crown size={11} className="text-[#D4AF37]" />
            <span>MEWAH</span>
          </div>
        )}

        {/* SOLD Overlay Badge */}
        {isSoldOut && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-10 pointer-events-none">
            <span className="bg-red-700 text-white font-bold text-xs px-3 py-1 rounded-full uppercase tracking-widest shadow-md">
              SOLD
            </span>
          </div>
        )}

        {/* Wishlist & Share buttons */}
        <div className="absolute top-2 right-2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleWishlist(product.id);
            }}
            className={`p-2 rounded-full shadow-sm transition-colors ${isWishlisted ? 'bg-[#B83A0E] text-white' : 'bg-[#FAF7F2] text-[#181512] hover:bg-white'}`}
          >
            <Heart size={14} fill={isWishlisted ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const url = `${window.location.origin}/product/${product.id}`;
              navigator.clipboard.writeText(url);
            }}
            className="p-2 bg-[#FAF7F2] text-[#181512] rounded-full shadow-sm hover:bg-[#B83A0E] hover:text-white transition-all"
            title="Bagikan"
          >
            <Share2 size={14} />
          </button>
        </div>
      </div>

      <div className="pt-3 pb-1 flex flex-col flex-1 text-center justify-between space-y-2">
        <div className="space-y-1">
          <div className="flex items-center justify-center gap-1.5 flex-wrap">
            {product.brand && (
              <p className="text-[11px] font-medium text-[#7A7163] capitalize">
                {product.brand}
              </p>
            )}
          </div>

          <Link to={`/product/${product.id}`} className="block">
            <h3 className={cn(
              "font-serif font-bold text-xs sm:text-sm tracking-wider uppercase line-clamp-1 transition-colors",
              isSoldOut ? "line-through text-black/40" : "text-[#181512] hover:text-[#B83A0E]"
            )}>
              {product.name}
            </h3>
          </Link>
          
          <p className={cn(
            "font-bold text-xs sm:text-sm tracking-wide pt-0.5",
            isSoldOut ? "text-black/40 line-through" : (isLuxury ? "text-[#9E2E0B]" : "text-[#B83A0E]")
          )}>
            {formatPrice(product.price)}
          </p>
        </div>

        <button
          onClick={() => !isSoldOut && onAddToCart(product)}
          disabled={isSoldOut}
          className={cn(
            "w-full py-2.5 rounded-lg font-bold text-[10px] sm:text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 mt-2 shadow-sm",
            isSoldOut
              ? "bg-red-700 text-white shadow-sm cursor-not-allowed"
              : isLuxury
                ? "bg-gradient-to-r from-[#181512] to-[#362E25] text-[#E5C158] border border-[#D4AF37]/40 hover:to-[#181512] active:scale-[0.98]"
                : "bg-[#B83A0E] text-white hover:bg-[#992F0B] active:scale-[0.98]"
          )}
        >
          <ShoppingCart size={13} className={isLuxury ? "text-[#D4AF37]" : "text-white"} /> 
          {isSoldOut ? 'SOLD OUT' : 'ADD TO CART'}
        </button>
      </div>
    </motion.div>
  );
});

export default ProductCard;
