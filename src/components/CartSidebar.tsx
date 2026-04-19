import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingBag, Trash2, Plus, Minus, MessageSquare, CreditCard, Wallet, Building2, QrCode, Loader2 } from 'lucide-react';
import { CartItem } from '../types';
import { formatPrice, cn } from '../lib/utils';
import { CONTACT_INFO } from '../constants';
import { saveOrder } from '../lib/storage';

const PAYMENT_METHODS = [
  { id: 'transfer', name: 'Transfer Bank', icon: <Building2 size={18} />, desc: 'BCA, Mandiri, BNI' },
  { id: 'ewallet', name: 'E-Wallet', icon: <Wallet size={18} />, desc: 'OVO, Dana, GoPay' },
  { id: 'qris', name: 'QRIS', icon: <QrCode size={18} />, desc: 'Scan & Bayar Instan' },
  { id: 'cod', name: 'COD', icon: <CreditCard size={18} />, desc: 'Bayar di Tempat' },
];

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
}

export default function CartSidebar({ isOpen, onClose, items, onUpdateQuantity, onRemove }: CartSidebarProps) {
  const [selectedPayment, setSelectedPayment] = React.useState(PAYMENT_METHODS[0].id);
  const [customerName, setCustomerName] = React.useState('');
  const [customerPhone, setCustomerPhone] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [shippingCost, setShippingCost] = React.useState(0);
  const [isCheckingOut, setIsCheckingOut] = React.useState(false);
  
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal + shippingCost;

  const handleCheckout = async () => {
    if (!customerName || !customerPhone || !address) {
      alert('Mohon lengkapi data pengiriman Kak!');
      return;
    }

    setIsCheckingOut(true);
    const payment = PAYMENT_METHODS.find(p => p.id === selectedPayment);
    
    // Save to DB
    await saveOrder({
      customerName,
      customerPhone,
      address,
      items: items.map(i => ({
        id: i.id,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        image: i.images[0]
      })),
      total,
      paymentMethod: payment?.name || selectedPayment
    });

    const itemsList = items.map(item => `- ${item.name} (${item.quantity}x)`).join('\n');
    const text = `Halo Admin ESTEHANGET, saya ingin memesan:\n\n*Nama:* ${customerName}\n*No. HP:* ${customerPhone}\n*Alamat:* ${address}\n\n*Daftar Pesanan:*\n${itemsList}\n\n*Total: ${formatPrice(total)}*\n*Metode Pembayaran: ${payment?.name}*\n\nMohon instruksi pembayaran selanjutnya ya Kak!`;
    
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
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-bone dark:bg-[#1a1a1a] z-[101] shadow-2xl flex flex-col"
          >
            <div className="p-6 flex items-center justify-between border-b border-black/10 dark:border-white/10">
              <div className="flex items-center gap-2">
                <ShoppingBag className="text-black dark:text-white" />
                <h2 className="text-xl font-display font-bold text-black dark:text-white">Keranjang</h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors text-black dark:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50 text-black dark:text-white">
                  <ShoppingBag size={64} />
                  <p className="font-medium">Keranjang masih kosong nih Kak.</p>
                  <button onClick={onClose} className="text-black dark:text-white font-bold underline">Mulai Belanja</button>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-black/40 dark:text-white/40">Daftar Produk</h3>
                    {items.map((item) => (
                      <div key={item.id} className="flex gap-4 bg-white dark:bg-black p-3 rounded-2xl shadow-sm border border-black/5 dark:border-white/5">
                        <img src={item.images[0]} alt={item.name} className="w-20 h-20 object-cover rounded-xl" referrerPolicy="no-referrer" />
                        <div className="flex-1 space-y-2">
                          <div className="flex justify-between items-start">
                            <h3 className="font-bold text-sm leading-tight text-black dark:text-white">{item.name}</h3>
                            <button onClick={() => onRemove(item.id)} className="text-red-400 hover:text-red-600">
                              <Trash2 size={16} />
                            </button>
                          </div>
                          <p className="text-xs font-bold text-black/60 dark:text-white/60">{formatPrice(item.price)}</p>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center border border-black/10 dark:border-white/10 rounded-lg overflow-hidden">
                              <button onClick={() => onUpdateQuantity(item.id, -1)} className="p-1 hover:bg-black/5 dark:hover:bg-white/10 text-black dark:text-white"><Minus size={14} /></button>
                              <span className="px-3 text-xs font-bold text-black dark:text-white">{item.quantity}</span>
                              <button onClick={() => onUpdateQuantity(item.id, 1)} className="p-1 hover:bg-black/5 dark:hover:bg-white/10 text-black dark:text-white"><Plus size={14} /></button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-black/40 dark:text-white/40">Data Pengiriman</h3>
                    <div className="space-y-3">
                      <input 
                        type="text" 
                        placeholder="Nama Lengkap" 
                        className="w-full bg-white dark:bg-black border border-black/5 dark:border-white/5 rounded-xl px-4 py-3 text-sm text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-blue/50"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                      />
                      <input 
                        type="tel" 
                        placeholder="Nomor WhatsApp (Aktif)" 
                        className="w-full bg-white dark:bg-black border border-black/5 dark:border-white/5 rounded-xl px-4 py-3 text-sm text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-blue/50"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                      />
                      <textarea 
                        placeholder="Alamat Lengkap" 
                        rows={3}
                        className="w-full bg-white dark:bg-black border border-black/5 dark:border-white/5 rounded-xl px-4 py-3 text-sm text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-blue/50"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-black/40 dark:text-white/40">Estimasi Ongkir</h3>
                    <div className="p-4 bg-sky-blue/5 dark:bg-sky-blue/10 rounded-2xl border border-sky-blue/10 space-y-4">
                      <select 
                        className="w-full bg-transparent border-b border-black/10 dark:border-white/10 py-2 text-sm text-black dark:text-white focus:outline-none"
                        onChange={(e) => {
                          const val = e.target.value;
                          const costs: Record<string, number> = { 'Jkt': 10000, 'Bdg': 15000, 'Sby': 20000, 'Mdn': 30000 };
                          setShippingCost(costs[val] || 0);
                        }}
                      >
                        <option value="">Pilih Kota (Simulasi)</option>
                        <option value="Jkt">Jakarta (Rp 10rb)</option>
                        <option value="Bdg">Bandung (Rp 15rb)</option>
                        <option value="Sby">Surabaya (Rp 20rb)</option>
                        <option value="Mdn">Medan (Rp 30rb)</option>
                      </select>
                      {shippingCost > 0 && (
                        <div className="flex justify-between items-center text-xs font-bold text-sky-blue uppercase tracking-widest">
                          <span>Biaya Kurir:</span>
                          <span>{formatPrice(shippingCost)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-black/40 dark:text-white/40">Metode Pembayaran</h3>
                    <div className="grid grid-cols-1 gap-2">
                      {PAYMENT_METHODS.map((method) => (
                        <button
                          key={method.id}
                          onClick={() => setSelectedPayment(method.id)}
                          className={cn(
                            "flex items-center gap-4 p-4 rounded-2xl border transition-all text-left",
                            selectedPayment === method.id
                              ? "bg-sky-blue/10 border-sky-blue shadow-sm"
                              : "bg-white dark:bg-black border-black/5 dark:border-white/5 hover:border-black/20 dark:hover:border-white/20"
                          )}
                        >
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center",
                            selectedPayment === method.id ? "bg-tea-main text-white" : "bg-bone dark:bg-white/5 text-black/60 dark:text-white/60"
                          )}>
                            {method.icon}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-black dark:text-white">{method.name}</p>
                            <p className="text-[10px] text-black/40 dark:text-white/40">{method.desc}</p>
                          </div>
                          <div className={cn(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                            selectedPayment === method.id ? "border-tea-main" : "border-black/10 dark:border-white/10"
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
              <div className="p-6 bg-white dark:bg-black border-t border-black/10 dark:border-white/10 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm text-black/60 dark:text-white/60">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  {shippingCost > 0 && (
                    <div className="flex justify-between items-center text-sm text-black/60 dark:text-white/60">
                      <span>Ongkos Kirim</span>
                      <span>{formatPrice(shippingCost)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t border-black/5 dark:border-white/5">
                    <span className="font-bold text-black dark:text-white">Total</span>
                    <span className="text-xl font-display font-bold text-black dark:text-white">{formatPrice(total)}</span>
                  </div>
                </div>
                <button
                  onClick={handleCheckout}
                  disabled={isCheckingOut}
                  className="w-full bg-tea-main text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-lg disabled:opacity-50"
                >
                  {isCheckingOut ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <>
                      <MessageSquare size={20} /> Checkout via WhatsApp
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
