import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Crown, ShieldCheck, Package, Video, Sparkles, Truck, CheckCircle, ExternalLink, Award } from 'lucide-react';
import { Product } from '../types';
import { formatPrice } from '../lib/utils';
import { LUXURY_PRIVILEGES, LUXURY_PRICE_THRESHOLD } from '../lib/luxury';
import { CONTACT_INFO } from '../constants';

interface LuxuryCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
}

export default function LuxuryCertificateModal({ isOpen, onClose, product }: LuxuryCertificateModalProps) {
  if (!isOpen) return null;

  const serialNumber = product?.id 
    ? `ESTORE-LUX-${product.id.slice(-6).toUpperCase()}`
    : 'ESTORE-LUX-ORIGINAL';

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'Package': return <Package size={20} className="text-[#D4AF37]" />;
      case 'ShieldCheck': return <ShieldCheck size={20} className="text-[#D4AF37]" />;
      case 'Truck': return <Truck size={20} className="text-[#D4AF37]" />;
      case 'Video': return <Video size={20} className="text-[#D4AF37]" />;
      case 'Sparkles': return <Sparkles size={20} className="text-[#D4AF37]" />;
      case 'Crown': return <Crown size={20} className="text-[#D4AF37]" />;
      default: return <Award size={20} className="text-[#D4AF37]" />;
    }
  };

  const handleConsultVIP = () => {
    const text = `Halo Senior Stylist E STORE, saya tertarik dengan Produk Mewah:\n*${product?.name || 'Koleksi Mewah E STORE'}*\nHarga: ${product?.price ? formatPrice(product.price) : 'Di atas Rp 500.000'}\n\nSaya ingin konsultasi VIP mengenai perlakuan khusus, ketersediaan ukuran, dan video review fisik sebelum pembelian.`;
    window.open(`https://wa.me/${CONTACT_INFO.whatsapp}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-2xl bg-[#141210] border border-[#D4AF37]/40 rounded-3xl p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.8)] z-10 text-white overflow-hidden my-8"
        >
          {/* Subtle gold radial background */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#B83A0E]/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors z-20"
          >
            <X size={18} />
          </button>

          {/* Header */}
          <div className="text-center space-y-2 mb-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#E5C158] text-xs font-bold uppercase tracking-widest">
              <Crown size={14} className="text-[#D4AF37]" />
              <span>E STORE LUXURY TIER ( &gt; Rp 500.000 )</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-wide">
              Perlakuan Khusus Produk Mewah
            </h2>
            <p className="text-xs sm:text-sm text-[#C8BFB0] max-w-md mx-auto">
              Setiap produk di atas Rp 500.000 secara otomatis mendapatkan standar penanganan VIP dan kemasan eksklusif.
            </p>
          </div>

          {/* Digital Certificate Preview Card */}
          {product && (
            <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-[#1E1B18] to-[#2B2620] border border-[#D4AF37]/40 relative overflow-hidden shadow-inner">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                {product.images && product.images[0] && (
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-white/5 border border-[#D4AF37]/30 shrink-0">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
                <div className="flex-1 text-center sm:text-left space-y-1">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <span className="text-[10px] font-mono tracking-widest text-[#D4AF37] uppercase bg-[#D4AF37]/10 px-2 py-0.5 rounded border border-[#D4AF37]/30">
                      {serialNumber}
                    </span>
                    <span className="text-[10px] font-bold text-green-400 flex items-center gap-1">
                      <CheckCircle size={11} /> 100% Original Verified
                    </span>
                  </div>
                  <h4 className="font-serif font-bold text-sm sm:text-base text-white line-clamp-1">
                    {product.name}
                  </h4>
                  <p className="text-xs font-bold text-[#E5C158]">
                    {formatPrice(product.price)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Privileges Grid */}
          <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
            {LUXURY_PRIVILEGES.map((privilege) => (
              <div
                key={privilege.id}
                className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/[0.04] border border-white/5 hover:border-[#D4AF37]/30 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                  {renderIcon(privilege.iconName)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-bold text-white group-hover:text-[#E5C158] transition-colors">
                      {privilege.title}
                    </h4>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-0.5 rounded-full shrink-0">
                      {privilege.tag}
                    </span>
                  </div>
                  <p className="text-xs text-[#A89E90] mt-1 leading-relaxed">
                    {privilege.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Footer CTA */}
          <div className="mt-6 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-center sm:text-left">
              <p className="text-[11px] text-[#A89E90]">
                Butuh inspeksi video atau fitting personal?
              </p>
              <p className="text-xs font-bold text-[#E5C158]">
                Konsultasi Bebas Biaya dengan Stylist VIP
              </p>
            </div>
            <button
              onClick={handleConsultVIP}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] text-[#141210] font-bold text-xs uppercase tracking-wider hover:opacity-95 active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <Crown size={15} /> Hubungi VIP Concierge
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
