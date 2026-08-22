import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingBag, Trash2, Plus, Minus, MessageSquare, Building2, Banknote, Loader2, Store, Truck, MapPin, CheckCircle2 } from 'lucide-react';
import { CartItem } from '../types';
import { formatPrice, cn } from '../lib/utils';
import { CONTACT_INFO, STORE } from '../constants';
import { saveOrder } from '../lib/storage';
import { useToast } from './Toast';

const PAYMENT_METHODS = [
  { id: 'transfer', name: 'Transfer Bank', icon: <Building2 size={18} />, desc: 'BCA / Mandiri / BNI / BRI (Kirim Bukti Transfer)' },
  { id: 'cash', name: 'Tunai / Cash', icon: <Banknote size={18} />, desc: 'Bayar Tunai Langsung di Toko / Rumah' },
];

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, selectedSize: string | undefined, delta: number) => void;
  onRemove: (id: string, selectedSize: string | undefined) => void;
}

export default function CartSidebar({ isOpen, onClose, items, onUpdateQuantity, onRemove }: CartSidebarProps) {
  const { showToast } = useToast();
  const [deliveryType, setDeliveryType] = React.useState<'pickup' | 'shipping'>('pickup');
  const [selectedPayment, setSelectedPayment] = React.useState(PAYMENT_METHODS[0].id);
  const [customerName, setCustomerName] = React.useState('');
  const [customerPhone, setCustomerPhone] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [shippingCost, setShippingCost] = React.useState(0);
  const [selectedCourier, setSelectedCourier] = React.useState('JNE Regular');
  const [isCheckingOut, setIsCheckingOut] = React.useState(false);
  
  // Promo state variables
  const [promoCode, setPromoCode] = React.useState('');
  const [appliedPromo, setAppliedPromo] = React.useState<string | null>(null);
  const [discountPercent, setDiscountPercent] = React.useState(0);
  const [promoError, setPromoError] = React.useState('');

  const effectiveShippingCost = deliveryType === 'pickup' ? 0 : shippingCost;
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = Math.round(subtotal * (discountPercent / 100));
  const total = subtotal - discountAmount + effectiveShippingCost;

  const handleApplyPromo = () => {
    setPromoError('');
    const codeUpper = promoCode.trim().toUpperCase();
    
    if (codeUpper === 'ESTEHANGET10') {
      setAppliedPromo('ESTEHANGET10');
      setDiscountPercent(10);
      showToast('Kupon ESTEHANGET10 berhasil dipakai! Diskon 10%', 'success');
    } else if (codeUpper === 'DISKON20') {
      setAppliedPromo('DISKON20');
      setDiscountPercent(20);
      showToast('Kupon DISKON20 berhasil dipakai! Diskon 20%', 'success');
    } else if (codeUpper === 'HEMAT50') {
      setAppliedPromo('HEMAT50');
      setDiscountPercent(50);
      showToast('Wow, Kupon HEMAT50 berhasil dipakai! Diskon 50%', 'success');
    } else {
      setPromoError('Yah, kode promo tidak valid nih Kak!');
      showToast('Yah, kode promo tidak valid nih Kak!', 'error');
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setDiscountPercent(0);
    setPromoCode('');
    setPromoError('');
    showToast('Kupon promo telah dihapus.', 'info');
  };

  const handleCheckout = async () => {
    const normalizedPhone = customerPhone.replace(/[^0-9+]/g, '');
    if (!customerName.trim() || !normalizedPhone) {
      showToast('Mohon lengkapi Nama & Nomor WhatsApp Anda Kak!', 'error');
      return;
    }
    if (normalizedPhone.replace(/\D/g, '').length < 10) {
      showToast('Nomor WhatsApp/HP tampaknya belum valid.', 'error');
      return;
    }

    if (deliveryType === 'shipping' && !address.trim()) {
      showToast('Mohon lengkapi alamat pengiriman Kak!', 'error');
      return;
    }

    const invalidStockItem = items.find(item => item.stock <= 0 || item.quantity > item.stock);
    if (invalidStockItem) {
      showToast(`Stok ${invalidStockItem.name} tidak mencukupi. Silakan perbarui keranjang.`, 'error');
      return;
    }

    setIsCheckingOut(true);
    const payment = PAYMENT_METHODS.find(p => p.id === selectedPayment);
    const deliveryMethodLabel = deliveryType === 'pickup' 
      ? 'Ambil Langsung di Rumah / Toko (Self Pickup)' 
      : `Kirim via Kurir (${selectedCourier})`;
    
    const finalAddress = deliveryType === 'pickup' 
      ? `Ambil di Tempat / Toko (${STORE.location || 'Majalengka, Jawa Barat'})` 
      : address.trim();

    // Save to DB
    await saveOrder({
      customerName: customerName.trim(),
      customerPhone: normalizedPhone,
      address: finalAddress,
      items: items.map(i => ({
        id: i.id,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        selectedSize: i.selectedSize,
        image: i.images[0]
      })),
      total,
      paymentMethod: `${payment?.name} (${deliveryType === 'pickup' ? 'Ambil di Toko' : 'Kirim Ekspedisi'})`
    });

    const itemsList = items.map(item => `- ${item.name} (Size: ${item.selectedSize || 'Standard'}) (${item.quantity}x) @ ${formatPrice(item.price)}`).join('\n');
    let text = `Halo Admin E STORE, saya ingin memesan:\n\n` +
      `*Nama:* ${customerName.trim()}\n` +
      `*No. HP/WA:* ${normalizedPhone}\n` +
      `*Metode Penerimaan:* ${deliveryMethodLabel}\n` +
      (deliveryType === 'shipping' ? `*Alamat Kirim:* ${address.trim()}\n` : `*Lokasi Pengambilan:* ${STORE.location || 'Majalengka, Jawa Barat'}\n`) +
      `\n*Daftar Pesanan:*\n${itemsList}\n\n`;
    
    if (appliedPromo) {
      text += `*Subtotal:* ${formatPrice(subtotal)}\n*Promo:* ${appliedPromo} (-${discountPercent}%)\n*Diskon:* -${formatPrice(discountAmount)}\n`;
    }
    
    if (effectiveShippingCost > 0) {
      text += `*Ongkos Kirim (${selectedCourier}):* ${formatPrice(effectiveShippingCost)}\n`;
    } else if (deliveryType === 'pickup') {
      text += `*Ongkir:* Rp 0 (Ambil di Toko / Rumah Penjual)\n`;
    }
    
    text += `\n*TOTAL PEMBAYARAN: ${formatPrice(total)}*\n` +
      `*Metode Pembayaran:* ${payment?.name} (${payment?.id === 'cash' ? 'Bayar Tunai di Tempat' : 'Transfer Bank'})\n\n` +
      `Mohon info konfirmasi dan instruksi selanjutnya ya Kak!`;
    
    window.open(`https://wa.me/${CONTACT_INFO.whatsapp}?text=${encodeURIComponent(text)}`, '_blank');
    setIsCheckingOut(false);
    onClose();
  };

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
            className="fixed top-0 right-0 bottom-0 w-full sm:max-w-lg bg-bone z-[101] shadow-2xl flex flex-col"
          >
            <div className="p-6 flex items-center justify-between border-b border-black/10">
              <div className="flex items-center gap-2">
                <ShoppingBag className="text-black" />
                <h2 className="text-xl font-display font-bold text-black">Keranjang Belanja</h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors text-black">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-7">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50 text-black">
                  <ShoppingBag size={64} />
                  <p className="font-medium">Keranjang masih kosong nih Kak.</p>
                  <button onClick={onClose} className="text-black font-bold underline">Mulai Belanja</button>
                </div>
              ) : (
                <>
                  {/* Item List */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-black/40">Daftar Produk ({items.length})</h3>
                    {items.map((item) => (
                      <div key={`${item.id}::${item.selectedSize || 'standard'}`} className="flex gap-4 bg-white p-3.5 rounded-2xl shadow-sm border border-black/5">
                        <img src={item.images[0]} alt={item.name} className="w-18 h-18 object-cover rounded-xl border border-black/5" referrerPolicy="no-referrer" />
                        <div className="flex-1 space-y-1.5">
                          <div className="flex justify-between items-start">
                            <h3 className="font-bold text-sm leading-tight text-black">{item.name}</h3>
                            <button onClick={() => onRemove(item.id, item.selectedSize)} className="text-red-400 hover:text-red-600 p-1">
                              <Trash2 size={16} />
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-bold text-tea-main">{formatPrice(item.price)}</p>
                            {item.selectedSize && (
                              <span className="text-[10px] font-black bg-black text-white px-2 py-0.5 rounded-md uppercase tracking-wider">
                                Size: {item.selectedSize}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 pt-1">
                            <div className="flex items-center border border-black/10 rounded-lg overflow-hidden bg-black/[0.02]">
                              <button onClick={() => onUpdateQuantity(item.id, item.selectedSize, -1)} className="p-1 hover:bg-black/5 text-black"><Minus size={14} /></button>
                              <span className="px-3 text-xs font-bold text-black">{item.quantity}</span>
                              <button
                                onClick={() => onUpdateQuantity(item.id, item.selectedSize, 1)}
                                disabled={item.stock > 0 && item.quantity >= item.stock}
                                className="p-1 hover:bg-black/5 text-black disabled:opacity-30 disabled:cursor-not-allowed"
                                aria-label="Tambah jumlah"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Delivery / Pickup Method Selector */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-black/40">Metode Penerimaan Barang</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setDeliveryType('pickup');
                          setShippingCost(0);
                        }}
                        className={cn(
                          "p-3.5 rounded-2xl border text-left transition-all flex flex-col gap-1.5",
                          deliveryType === 'pickup'
                            ? "bg-tea-main/10 border-tea-main shadow-xs"
                            : "bg-white border-black/5 hover:border-black/20"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className={cn("p-1.5 rounded-lg", deliveryType === 'pickup' ? "bg-tea-main text-white" : "bg-black/5 text-black/60")}>
                            <Store size={16} />
                          </div>
                          <span className="text-[10px] font-black uppercase text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                            Bebas Ongkir
                          </span>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-black">Ambil di Rumah / Toko</p>
                          <p className="text-[10px] text-black/50 leading-tight">Datang langsung ke tempat penjual</p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeliveryType('shipping')}
                        className={cn(
                          "p-3.5 rounded-2xl border text-left transition-all flex flex-col gap-1.5",
                          deliveryType === 'shipping'
                            ? "bg-tea-main/10 border-tea-main shadow-xs"
                            : "bg-white border-black/5 hover:border-black/20"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className={cn("p-1.5 rounded-lg", deliveryType === 'shipping' ? "bg-tea-main text-white" : "bg-black/5 text-black/60")}>
                            <Truck size={16} />
                          </div>
                          <span className="text-[10px] font-bold text-black/40">
                            Ekspedisi
                          </span>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-black">Kirim ke Alamat</p>
                          <p className="text-[10px] text-black/50 leading-tight">Via JNE, J&T, SiCepat, dll.</p>
                        </div>
                      </button>
                    </div>

                    {deliveryType === 'pickup' && (
                      <div className="p-3.5 bg-tea-main/5 border border-tea-main/15 rounded-2xl flex items-start gap-2.5">
                        <MapPin size={16} className="text-tea-main mt-0.5 shrink-0" />
                        <div className="text-xs text-black/70 leading-relaxed">
                          <p className="font-bold text-black">Lokasi Toko / Rumah:</p>
                          <p>{STORE.location || 'Majalengka, Jawa Barat, Indonesia'}</p>
                          <p className="text-[10px] text-black/50 mt-1 italic">
                            *Silakan datang langsung atau janjian via WhatsApp setelah checkout.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Customer Information */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-black/40">Data Pembeli</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-[11px] font-bold text-black/60 block mb-1">Nama Lengkap *</label>
                        <input 
                          type="text" 
                          placeholder="Masukkan nama lengkap Anda"
                          autoComplete="name"
                          maxLength={80} 
                          className="w-full bg-white border border-black/10 rounded-xl px-4 py-2.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-tea-main"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-black/60 block mb-1">Nomor WhatsApp / HP (Aktif) *</label>
                        <input 
                          type="tel" 
                          placeholder="Contoh: 081234567890" 
                          className="w-full bg-white border border-black/10 rounded-xl px-4 py-2.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-tea-main"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                        />
                      </div>

                      {deliveryType === 'shipping' && (
                        <>
                          <div>
                            <label className="text-[11px] font-bold text-black/60 block mb-1">Alamat Lengkap Pengiriman *</label>
                            <textarea 
                              placeholder="Nama jalan, nomor rumah, RT/RW, kelurahan, kecamatan, kota/kabupaten, kode pos"
                              autoComplete="street-address"
                              maxLength={500} 
                              rows={2}
                              className="w-full bg-white border border-black/10 rounded-xl px-4 py-2.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-tea-main"
                              value={address}
                              onChange={(e) => setAddress(e.target.value)}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[11px] font-bold text-black/60 block mb-1">Pilihan Kurir</label>
                              <select
                                value={selectedCourier}
                                onChange={(e) => setSelectedCourier(e.target.value)}
                                className="w-full bg-white border border-black/10 rounded-xl px-3 py-2 text-xs font-bold text-black focus:outline-none focus:ring-2 focus:ring-tea-main"
                              >
                                <option value="JNE Regular">JNE Regular</option>
                                <option value="J&T Express">J&T Express</option>
                                <option value="SiCepat">SiCepat</option>
                                <option value="GoSend / Grab">GoSend / Grab</option>
                              </select>
                            </div>

                            <div>
                              <label className="text-[11px] font-bold text-black/60 block mb-1">Estimasi Ongkir</label>
                              <select 
                                className="w-full bg-white border border-black/10 rounded-xl px-3 py-2 text-xs font-bold text-black focus:outline-none focus:ring-2 focus:ring-tea-main"
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const costs: Record<string, number> = { 'Jkt': 10000, 'Bdg': 15000, 'Mjl': 10000, 'Sby': 20000, 'Mdn': 30000 };
                                  setShippingCost(costs[val] || 0);
                                }}
                              >
                                <option value="">Pilih Wilayah (Simulasi)</option>
                                <option value="Mjl">Majalengka / Ciayumajakuning (Rp 10rb)</option>
                                <option value="Jkt">Jabodetabek (Rp 10rb)</option>
                                <option value="Bdg">Bandung & Jabar (Rp 15rb)</option>
                                <option value="Sby">Surabaya & Jatim (Rp 20rb)</option>
                                <option value="Mdn">Luar Jawa (Rp 30rb)</option>
                              </select>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Payment Methods (Strictly Transfer Bank & Cash) */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-black/40">Metode Pembayaran (Hanya TF Bank / Cash)</h3>
                    <div className="grid grid-cols-1 gap-2">
                      {PAYMENT_METHODS.map((method) => (
                        <button
                          key={method.id}
                          onClick={() => setSelectedPayment(method.id)}
                          className={cn(
                            "flex items-center gap-3.5 p-3.5 rounded-2xl border transition-all text-left",
                            selectedPayment === method.id
                              ? "bg-tea-main/10 border-tea-main shadow-xs"
                              : "bg-white border-black/5 hover:border-black/20"
                          )}
                        >
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                            selectedPayment === method.id ? "bg-tea-main text-white" : "bg-bone text-black/60"
                          )}>
                            {method.icon}
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-bold text-black">{method.name}</p>
                            <p className="text-[11px] text-black/50">{method.desc}</p>
                          </div>
                          <div className={cn(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
                            selectedPayment === method.id ? "border-tea-main" : "border-black/10"
                          )}>
                            {selectedPayment === method.id && <div className="w-2.5 h-2.5 bg-tea-main rounded-full" />}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {items.length > 0 && (
              <div className="p-6 bg-white border-t border-black/10 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs text-black/60">
                    <span>Subtotal Produk</span>
                    <span className="font-semibold text-black">{formatPrice(subtotal)}</span>
                  </div>
                  {appliedPromo && (
                    <div className="flex justify-between items-center text-xs text-green-600 font-semibold">
                      <span>Promo ({appliedPromo} -{discountPercent}%)</span>
                      <span>-{formatPrice(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-xs text-black/60">
                    <span>Ongkos Kirim</span>
                    {deliveryType === 'pickup' ? (
                      <span className="font-bold text-green-700">Rp 0 (Ambil di Toko)</span>
                    ) : (
                      <span className="font-semibold text-black">{formatPrice(effectiveShippingCost)}</span>
                    )}
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-black/5">
                    <span className="font-bold text-black text-sm">Total Bayar</span>
                    <span className="text-xl font-display font-bold text-tea-main">{formatPrice(total)}</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={isCheckingOut}
                  className="w-full bg-tea-main text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.99] transition-all shadow-lg shadow-tea-main/20 disabled:opacity-50"
                >
                  {isCheckingOut ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <>
                      <MessageSquare size={18} /> Pesan & Konfirmasi via WhatsApp
                    </>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
