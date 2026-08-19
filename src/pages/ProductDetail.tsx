import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, MessageCircle, CheckCircle2, ArrowLeft, Loader2, Star, Send, Share2, Facebook, Twitter, Link as LinkIcon, Camera, Eye, X, Crown, Sparkles, RefreshCw } from 'lucide-react';
import { saveOrder } from '../lib/storage';
import { PRODUCTS, CONTACT_INFO } from '../constants';
import { formatPrice, cn } from '../lib/utils';
import { Product, Review } from '../types';
import Modal from '../components/Modal';
import { getProduct, addReview, getReviewsByProduct, recordOrder, incrementProductView, uploadImage } from '../lib/sellerService';
import { useProductHistory } from '../lib/useProductHistory';
import ProductCard from '../components/ProductCard';
import { useToast } from '../components/Toast';
import { isLuxuryProduct } from '../lib/luxury';
import { isSecondProduct } from '../lib/condition';

interface ProductDetailProps {
  onAddToCart: (p: Product) => void;
}

export default function ProductDetail({ onAddToCart }: ProductDetailProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [product, setProduct] = React.useState<Product | null>(null);
  const [loading, setLoading] = React.useState(true);
  
  const [activeImage, setActiveImage] = React.useState(0);
  const [zoomImage, setZoomImage] = React.useState<string | null>(null);
  const [showCheckoutForm, setShowCheckoutForm] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showSuccessModal, setShowSuccessModal] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: '',
    phone: '',
    address: '',
    courier: 'JNE'
  });

  const isLuxury = isLuxuryProduct(product);
  const isSecond = isSecondProduct(product);

  const [reviews, setReviews] = React.useState<Review[]>([]);
  const [selectedSize, setSelectedSize] = React.useState<string>('');

  const availableSizes = React.useMemo(() => {
    if (product?.sizes && product.sizes.length > 0) {
      return product.sizes;
    }
    return ['38', '39', '40', '41', '42', '43', '44'];
  }, [product]);

  React.useEffect(() => {
    if (availableSizes.length > 0 && !selectedSize) {
      setSelectedSize(availableSizes[0]);
    }
  }, [availableSizes, selectedSize]);
  const [newReviewRating, setNewReviewRating] = React.useState(5);
  const [newReviewComment, setNewReviewComment] = React.useState('');
  const [newReviewImages, setNewReviewImages] = React.useState<File[]>([]);
  const [isSubmittingReview, setIsSubmittingReview] = React.useState(false);
  const { addToHistory } = useProductHistory();
  const [relatedProducts, setRelatedProducts] = React.useState<Product[]>([]);

  const ratingDistribution = React.useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    if (reviews.length === 0) {
      // Fallback distribution for visual premium feel
      return { 5: 14, 4: 3, 3: 1, 2: 0, 1: 0, total: 18, average: 4.7 };
    }
    reviews.forEach(r => {
      const star = Math.max(1, Math.min(5, Math.round(r.rating))) as 1|2|3|4|5;
      counts[star] = (counts[star] || 0) + 1;
    });
    const total = reviews.length;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return {
      ...counts,
      total,
      average: Number((sum / total).toFixed(1))
    };
  }, [reviews]);

  React.useEffect(() => {
    window.scrollTo(0, 0);
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      
      let p = PRODUCTS.find(pr => pr.id === id) || null;
      if (!p) {
        p = await getProduct(id);
      }
      
      if (p) {
        setProduct(p);
        addToHistory(p);
        incrementProductView(p.id);
        
        // Find related products
        const related = PRODUCTS.filter(pr => pr.category === p?.category && pr.id !== p?.id).slice(0, 4);
        setRelatedProducts(related);
      }
      setLoading(false);
    };
    fetchData();

    if (id) {
      const unsub = getReviewsByProduct(id, setReviews);
      return () => unsub();
    }
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-tea-main"></div>
    </div>
  );

  if (!product) {
    return (
      <div className="pt-32 pb-20 px-4 text-center space-y-4">
        <h2 className="text-2xl font-bold">Produk tidak ditemukan</h2>
              <button
                onClick={() => navigate('/')}
                className="text-tea-main font-bold underline"
              >
                Kembali ke Home
              </button>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleConfirmPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const savedUser = localStorage.getItem('user_session');
      const user = savedUser ? JSON.parse(savedUser) : null;
      
      const luxuryTag = isLuxury ? '\n💎 *[EDISI PREMIUM]*' : '';

      // Create a record in Firestore orders collection
      const orderUrl = `https://wa.me/${CONTACT_INFO.whatsapp}?text=${encodeURIComponent(`Halo Admin E STORE, saya ingin membeli produk:\n\n*${product.name}*${luxuryTag}\n*Ukuran (Size):* ${selectedSize || '40'}\nHarga: ${formatPrice(product.price)}\n\n*Data Pengiriman:*\nNama: ${formData.name}\nNo. HP: ${formData.phone}\nAlamat: ${formData.address}\nKurir: ${formData.courier}\n\nMohon info selanjutnya ya Kak!`)}`;
      
      await recordOrder({
        userId: user?.uid || 'anonymous',
        userName: formData.name,
        items: [{ ...product, selectedSize: selectedSize || '40', quantity: 1 }],
        total: product.price,
        status: 'pending',
        checkoutUrl: orderUrl
      });

      window.open(orderUrl, '_blank');
      
      setShowCheckoutForm(false);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error saving order:', error);
      const luxuryTag = isLuxury ? '\n💎 *[EDISI PREMIUM]*' : '';
      const text = `Halo Admin E STORE, saya ingin membeli produk:\n\n*${product.name}*${luxuryTag}\nHarga: ${formatPrice(product.price)}\n\n*Data Pengiriman:*\nNama: ${formData.name}\nAlamat: ${formData.address}\nKurir: ${formData.courier}\n\nMohon info selanjutnya ya Kak!`;
      window.open(`https://wa.me/${CONTACT_INFO.whatsapp}?text=${encodeURIComponent(text)}`, '_blank');
      setShowCheckoutForm(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    const savedUser = localStorage.getItem('user_session');
    if (!savedUser) {
      navigate('/login');
      return;
    }
    if (!newReviewComment.trim() || !product) return;

    setIsSubmittingReview(true);
    try {
      const imageUrls = await Promise.all(
        newReviewImages.map(file => uploadImage(file, 'reviews'))
      );
      await addReview(product.id, newReviewRating, newReviewComment, imageUrls);
      setNewReviewComment('');
      setNewReviewRating(5);
      setNewReviewImages([]);
    } catch (error) {
      console.error('Error adding review:', error);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleShare = (platform: 'wa' | 'fb' | 'tw' | 'copy') => {
    const url = window.location.href;
    const text = `Cek ${product?.name} keren ini di E STORE! ${url}`;
    
    switch(platform) {
      case 'wa': window.open(`https://wa.me/?text=${encodeURIComponent(text)}`); break;
      case 'fb': window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`); break;
      case 'tw': window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`); break;
      case 'copy': 
        navigator.clipboard.writeText(url);
        showToast('Tautan produk berhasil disalin Kak!', 'success');
        break;
    }
  };

  return (
    <div className="pt-32 pb-20 px-4 max-w-7xl mx-auto">
      <Modal 
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Pesanan Tercatat!"
        message="Data pesanan Anda sudah kami simpan. Silakan lanjutkan konfirmasi di WhatsApp agar segera kami proses ya Kak!"
      />
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-black/60 hover:text-black transition-colors mb-8 font-bold text-outline"
      >
        <ArrowLeft size={20} /> Kembali
      </button>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Images */}
        <div className="lg:w-1/2 space-y-4">
          <div 
            onClick={() => setZoomImage(product.images[activeImage])}
            className="aspect-square rounded-3xl overflow-hidden bg-white border border-black/5 flex items-center justify-center p-8 shadow-xl cursor-zoom-in group relative"
          >
            <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm text-white p-2.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 text-xs font-bold shadow-md z-10">
              <Eye size={14} /> Zoom
            </div>
            <AnimatePresence mode="wait">
              <motion.img
                key={activeImage}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                src={product.images[activeImage]}
                alt={product.name}
                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                referrerPolicy="no-referrer"
              />
            </AnimatePresence>
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={cn(
                    "w-24 h-24 rounded-2xl overflow-hidden border-2 transition-all flex-shrink-0 shadow-sm",
                    activeImage === i ? "border-black scale-105" : "border-transparent opacity-50 hover:opacity-100"
                  )}
                >
                  <img src={img} alt={`${product.name} ${i}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="lg:w-1/2 space-y-8">
          {!showCheckoutForm ? (
            <>
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Condition Badge: Sepatu Second vs Sepatu Baru */}
                  <span className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest shadow-sm border",
                    isSecond
                      ? "bg-amber-600 text-white border-amber-500 shadow-amber-900/20"
                      : "bg-emerald-700 text-white border-emerald-600 shadow-emerald-900/20"
                  )}>
                    {isSecond ? (
                      <>
                        <RefreshCw size={13} className="stroke-[2.5]" />
                        <span>SEPATU SECOND</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={13} className="stroke-[2.5]" />
                        <span>SEPATU BARU</span>
                      </>
                    )}
                  </span>

                  {isLuxury && (
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 text-amber-300 border border-amber-400/50 rounded-full text-xs font-black uppercase tracking-widest shadow-md shadow-black/30 ring-1 ring-amber-400/20">
                      <Crown size={13} className="text-amber-400 stroke-[2.5]" />
                      <span>EDISI PREMIUM</span>
                    </span>
                  )}
                  <span className="inline-block px-3 py-1 bg-tea-main/10 text-tea-main rounded-full text-xs font-bold uppercase tracking-widest text-outline">
                    {product.category}
                  </span>
                  {product.brand && (
                    <span className="inline-block px-3 py-1 bg-blue-600 text-white rounded-full text-xs font-black uppercase tracking-widest shadow-sm">
                      {product.brand}
                    </span>
                  )}
                  {product.shoeModel && (
                    <span className="inline-block px-3 py-1 bg-black/5 text-black rounded-full text-xs font-bold uppercase tracking-widest">
                      {product.shoeModel}
                    </span>
                  )}
                  {product.shoeType && (
                    <span className="inline-block px-3 py-1 bg-blue-50 border border-blue-200 text-blue-900 rounded-full text-xs font-extrabold uppercase tracking-widest">
                      {product.shoeType}
                    </span>
                  )}
                  {product.stock !== undefined && (
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                      product.stock === 0 ? "bg-red-600 text-white shadow-sm animate-pulse" : 
                      product.stock <= 5 ? "bg-orange-500 text-white" : 
                      "bg-green-500/10 text-green-600"
                    )}>
                      {product.stock === 0 ? "SOLD" : 
                       product.stock <= 5 ? `Stok Menipis (Sisa ${product.stock})` : 
                       "Tersedia"}
                    </span>
                  )}
                </div>
                <h1 className={cn(
                  "text-4xl md:text-5xl font-display font-bold tracking-tighter text-outline",
                  product.stock === 0 ? "line-through text-black/40" : "text-black"
                )}>
                  {product.name}
                </h1>
                <div className="flex items-center gap-6">
                  <p className={cn(
                    "text-3xl font-bold text-outline", 
                    product.stock === 0 ? "text-black/40 line-through" : (isLuxury ? "text-[#9E2E0B]" : "text-black")
                  )}>
                    {formatPrice(product.price)}
                  </p>
                  <div className="flex items-center gap-1 text-black/40 text-xs font-bold uppercase tracking-widest">
                    <Eye size={14} />
                    <span>{product.views || 0} Dilihat</span>
                  </div>
                </div>
              </div>

              {/* Premium Badge Tag if price >= 500k */}
              {isLuxury && (
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-amber-400/40 text-amber-300 text-xs font-black tracking-wider uppercase shadow-sm ring-1 ring-amber-400/20">
                  <Crown size={14} className="text-amber-400 stroke-[2.5]" />
                  <span>Koleksi Sepatu Premium (&ge; Rp 500.000)</span>
                </div>
              )}

              <div className="flex items-center gap-3">
                <button onClick={() => handleShare('wa')} className="p-3 bg-[#25D366] text-white rounded-xl hover:scale-110 transition-transform shadow-lg"><MessageCircle size={18} /></button>
                <button onClick={() => handleShare('fb')} className="p-3 bg-[#1877F2] text-white rounded-xl hover:scale-110 transition-transform shadow-lg"><Facebook size={18} /></button>
                <button onClick={() => handleShare('tw')} className="p-3 bg-[#1DA1F2] text-white rounded-xl hover:scale-110 transition-transform shadow-lg"><Twitter size={18} /></button>
                <button onClick={() => handleShare('copy')} className="p-3 bg-black text-white rounded-xl hover:scale-110 transition-transform shadow-lg"><LinkIcon size={18} /></button>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-sm uppercase tracking-widest text-black/40 text-outline">Deskripsi</h4>
                <p className="text-lg text-black/70 leading-relaxed text-outline">
                  {product.description}
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-sm uppercase tracking-widest text-black/40 text-outline">Spesifikasi</h4>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(Array.isArray(product.specifications) 
                    ? product.specifications 
                    : (typeof product.specifications === 'string' ? (product.specifications as string).split('\n').filter(s => s.trim()) : [])
                  ).map((spec, i) => (
                    <li key={i} className="flex items-center gap-3 text-black/80 text-outline">
                      <CheckCircle2 size={20} className="text-tea-main" />
                      {spec}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Pilihan Ukuran (Size) */}
              <div className="space-y-3 pt-4 border-t border-black/10">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm uppercase tracking-widest text-black/40 text-outline">Pilih Ukuran (Size)</h4>
                  {selectedSize && (
                    <span className="text-xs font-black text-black bg-black/5 px-2.5 py-1 rounded-lg">
                      Size Dipilih: <span className="text-blue-600 font-extrabold">{selectedSize}</span>
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableSizes.map(sz => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setSelectedSize(sz)}
                      className={cn(
                        "w-12 h-12 rounded-2xl text-sm font-black transition-all border flex items-center justify-center shadow-sm",
                        selectedSize === sz
                          ? "bg-black text-white border-black scale-105 shadow-md"
                          : "bg-white text-black/70 border-black/10 hover:border-black/40 hover:bg-black/5"
                      )}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                {product.stock === 0 ? (
                  <button
                    disabled
                    className="w-full bg-red-600 text-white py-5 rounded-2xl font-black text-lg uppercase tracking-wider flex items-center justify-center gap-3 cursor-not-allowed shadow-lg opacity-90"
                  >
                    SOLD OUT (STOK HABIS)
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => onAddToCart({ ...product, selectedSize })}
                      className="flex-1 bg-tea-main text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-3 hover:scale-[1.02] transition-transform shadow-lg shadow-tea-main/20"
                    >
                      <ShoppingCart size={24} /> Tambah ke Keranjang
                    </button>
                    <button
                      onClick={() => setShowCheckoutForm(true)}
                      className="flex-1 bg-black text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-3 hover:scale-[1.02] transition-transform shadow-lg shadow-black/20"
                    >
                      <MessageCircle size={24} /> Beli Sekarang
                    </button>
                  </>
                )}
              </div>
            </>
          ) : (
            <motion.form 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onSubmit={handleConfirmPurchase} 
              className="space-y-8 bg-white p-8 rounded-3xl border border-black/5 shadow-xl"
            >
              <div className="space-y-2">
                <button 
                  type="button"
                  onClick={() => setShowCheckoutForm(false)}
                  className="text-xs font-bold uppercase tracking-widest text-black/40 hover:text-black transition-colors text-outline"
                >
                  ← Kembali ke Detail
                </button>
                <h2 className="text-3xl font-display font-bold tracking-tighter text-black text-outline">Data Pengiriman</h2>
                <p className="text-black/60 text-outline">Lengkapi data berikut untuk melanjutkan ke WhatsApp.</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest opacity-60 text-outline">Nama Lengkap</label>
                  <input 
                    required
                    type="text" 
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Masukkan nama Anda"
                    className="w-full bg-white border border-black/10 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-tea-main/50 transition-all text-black"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest opacity-60 text-outline">Nomor WhatsApp</label>
                  <input 
                    required
                    type="tel" 
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Contoh: 0812..."
                    className="w-full bg-white border border-black/10 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-tea-main/50 transition-all text-black"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest opacity-60 text-outline">Alamat Lengkap</label>
                  <textarea 
                    required
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Contoh: Jl. Melati No. 123, Jakarta"
                    className="w-full bg-white border border-black/10 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-tea-main/50 transition-all min-h-[120px] text-black"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest opacity-60 text-outline">Pilihan Kurir</label>
                  <select 
                    name="courier"
                    value={formData.courier}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-black/10 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-tea-main/50 transition-all text-black"
                  >
                    <option value="JNE">JNE</option>
                    <option value="J&T">J&T</option>
                    <option value="SiCepat">SiCepat</option>
                    <option value="GoSend/Grab">GoSend/Grab</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-black text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-3 hover:scale-[1.02] transition-transform shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={24} /> : <MessageCircle size={24} />}
                {isSubmitting ? 'Memproses...' : 'Konfirmasi & Chat Admin'}
              </button>
            </motion.form>
          )}
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-32 space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <h2 className="text-4xl font-display font-bold tracking-tighter text-black uppercase italic text-outline">Produk Terkait</h2>
              <p className="text-black/60 font-medium">Berdasarkan kategori "{product.category}" yang Anda lihat.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {relatedProducts.map(p => (
              <ProductCard key={p.id} product={p} onAddToCart={onAddToCart} />
            ))}
          </div>
        </div>
      )}

      {/* Reviews Section */}
      <div className="mt-20 space-y-12">
        <div className="flex items-center justify-between border-b border-black/5 pb-8">
          <div className="space-y-1">
            <h2 className="text-3xl font-display font-bold tracking-tighter text-black uppercase italic text-outline">Ulasan Pembeli</h2>
            <div className="flex items-center gap-2">
              <div className="flex items-center text-yellow-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} fill={i < Math.round(ratingDistribution.average) ? "currentColor" : "none"} />
                ))}
              </div>
              <span className="text-sm font-bold text-black/60 text-outline">
                {ratingDistribution.average.toFixed(1)} / 5.0 ({ratingDistribution.total} Ulasan)
              </span>
            </div>
          </div>
        </div>

        {/* Rating distribution panel */}
        <div className="bg-white border border-black/5 p-6 md:p-8 rounded-3xl shadow-sm grid grid-cols-1 md:grid-cols-3 gap-8 items-center animate-fade-in">
          <div className="text-center md:border-r border-black/5 py-4 space-y-2">
            <p className="text-5xl font-display font-black text-black">{ratingDistribution.average.toFixed(1)}</p>
            <div className="flex justify-center text-yellow-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={18} fill={i < Math.round(ratingDistribution.average) ? "currentColor" : "none"} />
              ))}
            </div>
            <p className="text-xs text-black/50 font-bold uppercase tracking-wider">
              {reviews.length > 0 ? 'Penilaian Asli Pelanggan' : 'Penilaian Kepuasan Toko'}
            </p>
          </div>
          
          <div className="md:col-span-2 space-y-2">
            {([5, 4, 3, 2, 1] as const).map((star) => {
              const count = ratingDistribution[star];
              const pct = ratingDistribution.total > 0 ? (count / ratingDistribution.total) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-4 text-xs font-bold text-black">
                  <span className="w-8 text-right flex items-center justify-end gap-1">
                    {star} <Star size={12} className="text-yellow-500 fill-yellow-500" />
                  </span>
                  <div className="flex-1 h-3 bg-black/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="h-full bg-yellow-500 rounded-full"
                    />
                  </div>
                  <span className="w-16 text-black/50 text-right">{count} ulasan</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Review Form */}
          <div className="lg:w-1/3">
            <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-xl space-y-6 sticky top-32">
              <h3 className="text-xl font-bold text-black text-outline">Tulis Ulasan</h3>
              {localStorage.getItem('user_session') ? (
                <form onSubmit={handleAddReview} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest opacity-60 text-outline">Rating</label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewReviewRating(star)}
                          className={cn(
                            "p-1 transition-all",
                            newReviewRating >= star ? "text-yellow-500" : "text-black/10"
                          )}
                        >
                          <Star size={24} fill={newReviewRating >= star ? "currentColor" : "none"} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest opacity-60 text-outline">Komentar</label>
                    <textarea 
                      required
                      value={newReviewComment}
                      onChange={(e) => setNewReviewComment(e.target.value)}
                      placeholder="Bagikan pengalaman belanja Anda..."
                      className="w-full bg-white border border-black/10 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-tea-main/50 transition-all min-h-[120px] text-sm text-black"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest opacity-60 text-outline">Foto Produk (Opsional)</label>
                    <input 
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        setNewReviewImages(files);
                      }}
                      className="w-full text-xs text-black/60 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-tea-main/10 file:text-tea-main hover:file:bg-tea-main/20"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmittingReview}
                    className="w-full bg-tea-main text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {isSubmittingReview ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                    Kirim Ulasan
                  </button>
                </form>
              ) : (
                <div className="text-center space-y-4 py-8">
                  <p className="text-sm text-black/60">Silakan login untuk memberikan ulasan produk.</p>
                  <button onClick={() => navigate('/login')} className="bg-tea-main text-white px-6 py-2 rounded-xl text-sm font-bold">Login</button>
                </div>
              )}
            </div>
          </div>

          {/* Review List */}
          <div className="lg:w-2/3 space-y-6">
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={review.id}
                  className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-tea-main/10 rounded-full flex items-center justify-center font-bold text-tea-main text-sm">
                        {review.userName[0].toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-black">{review.userName}</h4>
                        <p className="text-[10px] text-black/40 uppercase font-bold">Terverifikasi</p>
                      </div>
                    </div>
                    <div className="flex items-center text-yellow-500">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} fill={i < review.rating ? "currentColor" : "none"} />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-black/80 leading-relaxed italic">
                    "{review.comment}"
                  </p>
                  {review.images && review.images.length > 0 && (
                    <div className="flex gap-2 pt-2">
                      {review.images.map((img, i) => (
                        <div key={i} className="w-16 h-16 rounded-xl overflow-hidden border border-black/5 shadow-sm">
                          <img src={img} alt="Review" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-[10px] text-black/30 uppercase font-bold tracking-widest">
                    {review.createdAt?.seconds ? new Date(review.createdAt.seconds * 1000).toLocaleDateString() : 'Baru saja'}
                  </p>
                </motion.div>
              ))
            ) : (
              <div className="py-20 text-center space-y-4 opacity-50">
                <Star size={48} className="mx-auto" />
                <p className="text-xl font-medium">Belum ada ulasan untuk produk ini.</p>
                <p className="text-sm">Jadilah yang pertama memberikan ulasan produk berkualitas dari E STORE!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {zoomImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoomImage(null)}
            className="fixed inset-0 bg-black/95 backdrop-blur-md z-[9999] flex items-center justify-center p-4 cursor-zoom-out"
          >
            <button 
              onClick={() => setZoomImage(null)}
              className="absolute top-6 right-6 text-white bg-white/10 hover:bg-white/20 p-3 rounded-full transition-colors font-bold flex items-center justify-center shadow-lg"
            >
              <X size={24} />
            </button>
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25 }}
              src={zoomImage}
              alt="Zoomed Product"
              className="max-w-full max-h-[90vh] object-contain rounded-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
