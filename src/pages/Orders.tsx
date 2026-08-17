import React from 'react';
import { motion } from 'motion/react';
import { ShoppingBag, MessageCircle, Calendar, CreditCard, MapPin, ExternalLink, ArrowRight } from 'lucide-react';
import { getLocalOrders, OrderRecord } from '../lib/storage';
import { formatPrice } from '../lib/utils';
import { CONTACT_INFO } from '../constants';
import { Link } from 'react-router-dom';

export default function Orders() {
  const [orders, setOrders] = React.useState<OrderRecord[]>([]);

  React.useEffect(() => {
    // Scroll to top
    window.scrollTo(0, 0);
    // Load local orders
    const savedOrders = getLocalOrders();
    setOrders(savedOrders);
  }, []);

  const getStatusColor = (status: OrderRecord['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      case 'shipped': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'processing': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-orange-100 text-orange-700 border-orange-200'; // pending
    }
  };

  const getStatusLabel = (status: OrderRecord['status']) => {
    switch (status) {
      case 'completed': return 'Selesai';
      case 'cancelled': return 'Dibatalkan';
      case 'shipped': return 'Dikirim';
      case 'processing': return 'Diproses';
      default: return 'Menunggu Konfirmasi';
    }
  };

  const handleRecontactAdmin = (order: OrderRecord) => {
    const itemsList = order.items.map(item => `- ${item.name} (${item.quantity}x)`).join('\n');
    const text = `Halo Admin ESTEHANGET, saya ingin mengonfirmasi pesanan saya sebelumnya dengan ID *${order.id}*:\n\n*Nama:* ${order.customerName}\n*No. HP:* ${order.customerPhone}\n*Alamat:* ${order.address}\n\n*Daftar Pesanan:*\n${itemsList}\n\n*Total Akhir: ${formatPrice(order.total)}*\n*Metode Pembayaran: ${order.paymentMethod}*\n\nMohon bantu cek status pesanan saya ya Kak!`;
    window.open(`https://wa.me/${CONTACT_INFO.whatsapp}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="pt-32 pb-24 px-4 max-w-4xl mx-auto min-h-[80vh]">
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tighter text-black uppercase italic">
          Riwayat Pesanan
        </h1>
        <p className="text-black/60 text-sm">
          Semua pesanan Anda disimpan secara lokal di browser ini agar mudah dilacak.
        </p>
      </div>

      {orders.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-12 text-center border border-black/5 shadow-sm space-y-6 flex flex-col items-center justify-center"
        >
          <div className="w-16 h-16 bg-tea-main/10 text-tea-main rounded-full flex items-center justify-center">
            <ShoppingBag size={32} />
          </div>
          <div className="space-y-2">
            <h3 className="font-bold text-lg text-black">Belum Ada Transaksi</h3>
            <p className="text-black/50 text-sm max-w-sm">
              Kamu belum memiliki riwayat pembelian di ESTEHANGET. Yuk, cari produk favoritmu sekarang!
            </p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-black hover:bg-black/80 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all"
          >
            Mulai Belanja <ArrowRight size={16} />
          </Link>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {orders.map((order, idx) => (
            <motion.div
              key={order.id || idx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden"
            >
              {/* Order Header */}
              <div className="p-6 bg-bone flex flex-wrap items-center justify-between gap-4 border-b border-black/5">
                <div className="flex items-center gap-3">
                  <div className="text-xs bg-black/5 px-2.5 py-1 rounded-lg font-mono font-bold text-black">
                    ID: {order.id?.substring(0, 12) || `ORDER_${idx}`}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-black/50">
                    <Calendar size={14} />
                    <span>
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : '-'}
                    </span>
                  </div>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider border ${getStatusColor(order.status)}`}>
                  {getStatusLabel(order.status)}
                </span>
              </div>

              {/* Order Items */}
              <div className="p-6 space-y-4">
                <div className="divide-y divide-black/5">
                  {order.items.map((item, itemIdx) => (
                    <div key={item.id || itemIdx} className="flex gap-4 py-3 first:pt-0 last:pb-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-xl border border-black/5"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-black truncate">{item.name}</h4>
                        <p className="text-xs text-black/50">
                          {item.quantity}x @ {formatPrice(item.price)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm text-black">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Shipping & Delivery Details */}
                <div className="pt-4 border-t border-black/5 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-2">
                    <p className="font-bold uppercase tracking-widest text-black/40">Alamat Pengiriman</p>
                    <div className="flex gap-2 text-black/70">
                      <MapPin size={14} className="flex-shrink-0 mt-0.5 text-black/40" />
                      <div>
                        <p className="font-bold text-black">{order.customerName} ({order.customerPhone})</p>
                        <p className="leading-relaxed">{order.address}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="font-bold uppercase tracking-widest text-black/40">Pembayaran</p>
                    <div className="flex gap-2 text-black/70">
                      <CreditCard size={14} className="flex-shrink-0 mt-0.5 text-black/40" />
                      <div>
                        <p className="font-bold text-black">{order.paymentMethod}</p>
                        <p>Total Tagihan: <span className="font-bold text-tea-accent text-sm">{formatPrice(order.total)}</span></p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Footer Actions */}
              <div className="p-4 bg-bone border-t border-black/5 flex justify-end">
                <button
                  onClick={() => handleRecontactAdmin(order)}
                  className="flex items-center gap-2 bg-tea-main hover:bg-tea-main/95 text-black px-5 py-2.5 rounded-xl font-bold text-xs transition-colors shadow-sm"
                >
                  <MessageCircle size={14} fill="currentColor" />
                  Hubungi Admin WA <ExternalLink size={12} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
