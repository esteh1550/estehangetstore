import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db, isFirebaseEnabled } from '../lib/firebase';
import { getLocalOrders, getLocalNewsletters, OrderRecord, NewsletterRecord, clearLocalData, updateLocalOrderStatus } from '../lib/storage';
import { formatPrice } from '../lib/utils';
import { 
  updateOrderStatus
} from '../lib/sellerService';
import { CONTACT_INFO, ADMIN_EMAIL } from '../constants';
import { Loader2, LogOut, ShoppingBag, Mail, CheckCircle, Clock, Trash2, Package } from 'lucide-react';

// Admin dashboard component
export default function Admin() {
  const [user, setUser] = React.useState<{ email: string; displayName: string } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [orders, setOrders] = React.useState<OrderRecord[]>([]);
  const [newsletters, setNewsletters] = React.useState<NewsletterRecord[]>([]);
  const [activeTab, setActiveTab] = React.useState<'orders' | 'newsletter'>('orders');

  React.useEffect(() => {
    // Check for local session
    const saved = localStorage.getItem('user_session');
    if (saved) {
      setUser(JSON.parse(saved));
    }
    setOrders(getLocalOrders());
    setNewsletters(getLocalNewsletters());
    setLoading(false);
  }, []);

  const handleLogin = () => {
    const adminSession = {
      email: ADMIN_EMAIL,
      displayName: 'Administrator'
    };
    setUser(adminSession);
    localStorage.setItem('user_session', JSON.stringify(adminSession));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user_session');
  };

  const updateOrderStatusHandler = async (id: string, status: any) => {
    let message = '';
    switch(status) {
      case 'processing': message = 'Pesanan Anda sedang diproses oleh tim kami.'; break;
      case 'shipped': message = 'Pesanan Anda telah dikirim. Tracking sedang diupdate.'; break;
      case 'delivered': message = 'Pesanan Anda telah tiba di alamat tujuan.'; break;
      case 'completed': message = 'Pesanan selesai. Terima kasih telah belanja!'; break;
      case 'cancelled': message = 'Pesanan dibatalkan.'; break;
    }

    if (id.startsWith('local_') || !isFirebaseEnabled) {
      updateLocalOrderStatus(id, status);
      setOrders(getLocalOrders()); 
      return;
    }
    
    await updateOrderStatus(id, status, message);
    setOrders(getLocalOrders());
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-light dark:bg-[#0a0a0a]">
        <Loader2 className="animate-spin text-tea-main" size={40} />
      </div>
    );
  }

  if (!user || user.email !== ADMIN_EMAIL) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-light dark:bg-[#0a0a0a] px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-[#1a1a1a] p-10 rounded-3xl shadow-2xl border border-black/5 dark:border-white/5 text-center space-y-6 max-w-md w-full"
        >
          <div className="w-20 h-20 bg-white dark:bg-black rounded-2xl flex items-center justify-center mx-auto shadow-sm border border-black/5 dark:border-white/5 overflow-hidden">
            <img src={CONTACT_INFO.logo} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
          <h1 className="text-3xl font-display font-bold text-black dark:text-white">Admin Access</h1>
          <p className="text-black/60 dark:text-white/60">
            Halaman ini menggunakan mode penyimpanan lokal untuk keamanan data Anda.
          </p>
          
          <button 
            onClick={handleLogin}
            className="w-full bg-tea-main text-white py-4 rounded-2xl font-bold hover:scale-[1.02] transition-transform flex items-center justify-center gap-3 shadow-lg"
          >
            Masuk sebagai Admin
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-light dark:bg-[#0a0a0a] pt-32 pb-20 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h1 className="text-4xl font-display font-bold tracking-tighter text-black dark:text-white text-outline">
              Dashboard Admin
            </h1>
            <p className="text-black/60 dark:text-white/60 text-outline">
              Halo, {user.displayName}! Kelola pesanan dan newsletter di browser ini.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center md:justify-end gap-4">
            <button 
              onClick={() => {
                if (confirm('Hapus semua data pesanan dari browser ini?')) {
                  clearLocalData();
                  window.location.reload();
                }
              }}
              className="flex items-center gap-2 px-6 py-3 bg-red-500/10 text-red-500 rounded-2xl font-bold hover:bg-red-500 hover:text-white transition-all"
            >
              <Trash2 size={20} /> Reset Database Lokal
            </button>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-6 py-3 bg-black/5 dark:bg-white/10 text-black dark:text-white rounded-2xl font-bold hover:bg-red-500 hover:text-white transition-all"
            >
              <LogOut size={20} /> Logout
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex p-1 bg-black/5 dark:bg-white/5 rounded-2xl w-fit mx-auto md:mx-0">
          <button 
            onClick={() => setActiveTab('orders')}
            className={`px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${activeTab === 'orders' ? 'bg-white dark:bg-black text-black dark:text-white shadow-md' : 'text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white'}`}
          >
            <ShoppingBag size={20} /> Pesanan ({orders.length})
          </button>
          <button 
            onClick={() => setActiveTab('newsletter')}
            className={`px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${activeTab === 'newsletter' ? 'bg-white dark:bg-black text-black dark:text-white shadow-md' : 'text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white'}`}
          >
            <Mail size={20} /> Newsletter ({newsletters.length})
          </button>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 gap-6">
          {activeTab === 'orders' ? (
            orders.length > 0 ? (
              orders.map((order, index) => (
                <motion.div 
                  key={`${order.id}-${index}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-[#1a1a1a] p-6 md:p-8 rounded-3xl border border-black/5 dark:border-white/5 shadow-sm space-y-6"
                >
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                          order.status === 'completed' ? 'bg-green-500/20 text-green-500' :
                          order.status === 'processing' ? 'bg-tea-main/20 text-tea-main' :
                          'bg-yellow-500/20 text-yellow-500'
                        }`}>
                          {order.status}
                        </span>
                        <span className="text-xs text-black/40 dark:text-white/40">
                          {new Date(order.createdAt).toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="space-y-4 pt-4">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-4">
                            <img src={item.image} alt={item.name} className="w-16 h-16 rounded-xl object-cover border border-black/5 dark:border-white/5" referrerPolicy="no-referrer" />
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-black dark:text-white truncate">{item.name}</p>
                              <p className="text-sm text-black/40 dark:text-white/40">{item.quantity}x @ {formatPrice(item.price)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="pt-4 flex items-center justify-between">
                        <p className="text-xl font-bold text-tea-main">{formatPrice(order.total)}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button 
                        onClick={() => updateOrderStatusHandler(order.id, 'processing')}
                        className={`p-3 rounded-xl transition-all ${order.status === 'processing' ? 'bg-tea-main text-white' : 'bg-black/5 dark:bg-white/5 text-black/40 dark:text-white/40 hover:text-tea-main'}`}
                        title="Processing"
                      >
                        <Clock size={20} />
                      </button>
                      <button 
                        onClick={() => updateOrderStatusHandler(order.id, 'shipped')}
                        className={`p-3 rounded-xl transition-all ${order.status === 'shipped' ? 'bg-sky-blue text-white' : 'bg-black/5 dark:bg-white/5 text-black/40 dark:text-white/40 hover:text-sky-blue'}`}
                        title="Shipped"
                      >
                        <Package size={20} />
                      </button>
                      <button 
                        onClick={() => updateOrderStatusHandler(order.id, 'delivered')}
                        className={`p-3 rounded-xl transition-all ${order.status === 'delivered' ? 'bg-pastel-peach text-white' : 'bg-black/5 dark:bg-white/5 text-black/40 dark:text-white/40 hover:text-pastel-peach'}`}
                        title="Delivered"
                      >
                        <CheckCircle size={20} />
                      </button>
                      <button 
                        onClick={() => updateOrderStatusHandler(order.id, 'completed')}
                        className={`p-3 rounded-xl transition-all ${order.status === 'completed' ? 'bg-green-500 text-white' : 'bg-black/5 dark:bg-white/5 text-black/40 dark:text-white/40 hover:text-green-500'}`}
                        title="Completed"
                      >
                        <CheckCircle size={20} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-black/5 dark:border-white/5">
                    <div className="space-y-2">
                      <p className="text-xs font-bold uppercase tracking-widest opacity-40">Pelanggan</p>
                      <p className="font-bold text-black dark:text-white">{order.customerName}</p>
                      <p className="text-sm text-tea-main font-bold">{order.customerPhone}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-bold uppercase tracking-widest opacity-40">Alamat & Pembayaran</p>
                      <p className="text-sm text-black/80 dark:text-white/80">{order.address}</p>
                      <p className="text-xs font-bold text-tea-main">Metode: {order.paymentMethod}</p>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-20 bg-white dark:bg-[#1a1a1a] rounded-3xl border border-dashed border-black/10 dark:border-white/10">
                <p className="text-black/40 dark:text-white/40">Belum ada pesanan masuk.</p>
              </div>
            )
          ) : (
            <div className="bg-white dark:bg-[#1a1a1a] rounded-3xl border border-black/5 dark:border-white/5 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-black/5 dark:bg-white/5">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest opacity-60">Nomor WhatsApp</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest opacity-60">Tanggal Daftar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/5">
                  {newsletters.length > 0 ? (
                    newsletters.map((n, index) => (
                      <tr key={`${n.id}-${index}`} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 font-bold text-black dark:text-white">{n.phone}</td>
                        <td className="px-6 py-4 text-sm text-black/60 dark:text-white/60">
                          {new Date(n.createdAt).toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={2} className="px-6 py-10 text-center text-black/40 dark:text-white/40">Belum ada pendaftar newsletter.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
