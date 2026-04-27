import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, googleProvider, isFirebaseEnabled } from '../lib/firebase';
import { signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { getLocalOrders, getLocalNewsletters, OrderRecord, NewsletterRecord, clearLocalData, updateLocalOrderStatus } from '../lib/storage';
import { formatPrice } from '../lib/utils';
import { 
  updateOrderStatus
} from '../lib/sellerService';
import { CONTACT_INFO, ADMIN_EMAIL } from '../constants';
import { Loader2, LogOut, ShoppingBag, Mail, CheckCircle, Clock, Trash2, Package, ShieldAlert, Globe } from 'lucide-react';

// Admin dashboard component
export default function Admin() {
  const [user, setUser] = React.useState<{ email: string; displayName: string } | null>(null);
  const [firebaseUser, setFirebaseUser] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [orders, setOrders] = React.useState<OrderRecord[]>([]);
  const [newsletters, setNewsletters] = React.useState<NewsletterRecord[]>([]);
  const [activeTab, setActiveTab] = React.useState<'orders' | 'newsletter'>('orders');

  React.useEffect(() => {
    // Sync with Firebase Auth if enabled
    let unsubscribe: any;
    if (isFirebaseEnabled && auth) {
      unsubscribe = onAuthStateChanged(auth, (u) => {
        setFirebaseUser(u);
      });
    }

    // Check for local session
    const saved = localStorage.getItem('user_session');
    if (saved) {
      setUser(JSON.parse(saved));
    }
    setOrders(getLocalOrders());
    setNewsletters(getLocalNewsletters());
    setLoading(false);

    return () => unsubscribe?.();
  }, []);

  const handleLogin = async () => {
    try {
      if (isFirebaseEnabled && auth) {
        setLoading(true);
        const result = await signInWithPopup(auth, googleProvider);
        if (result.user.email !== ADMIN_EMAIL) {
          await signOut(auth);
          alert(`Akses Ditolak: Email ${result.user.email} tidak terdaftar sebagai Admin.`);
          setLoading(false);
          return;
        }
      }

      const adminSession = {
        email: ADMIN_EMAIL,
        displayName: 'Administrator'
      };
      setUser(adminSession);
      localStorage.setItem('user_session', JSON.stringify(adminSession));
    } catch (err) {
      console.error("Login failed:", err);
      alert("Gagal masuk. Pastikan koneksi internet stabil atau coba mode lokal.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (isFirebaseEnabled && auth) {
      await signOut(auth);
    }
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
      <div className="min-h-screen flex items-center justify-center bg-bg-light">
        <Loader2 className="animate-spin text-tea-main" size={40} />
      </div>
    );
  }

  if (!user || user.email !== ADMIN_EMAIL) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-light px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-10 rounded-3xl shadow-2xl border border-black/5 text-center space-y-6 max-w-md w-full"
        >
          <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm border border-black/5 overflow-hidden">
            <img src={CONTACT_INFO.logo} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
          <h1 className="text-3xl font-display font-bold text-black">Admin Access</h1>
          <div className="space-y-4">
            <p className="text-black/60 text-sm">
              {isFirebaseEnabled 
                ? "Gunakan akun Google Anda untuk mensinkronkan data toko dengan database cloud (Vercel Ready)."
                : "Halaman ini menggunakan mode penyimpanan lokal. Data hanya akan tersimpan di browser ini."}
            </p>
            
            <button 
              onClick={handleLogin}
              className="w-full bg-tea-main text-white py-4 rounded-2xl font-bold hover:scale-[1.02] transition-transform flex items-center justify-center gap-3 shadow-lg"
            >
              {isFirebaseEnabled && <Globe size={18} />}
              {isFirebaseEnabled ? 'Masuk & Sinkron Cloud' : 'Masuk sebagai Admin'}
            </button>

            {isFirebaseEnabled && (
              <p className="text-[10px] uppercase font-bold tracking-widest text-black/20">
                Authorized Email: {ADMIN_EMAIL}
              </p>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-light pt-32 pb-20 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h1 className="text-4xl font-display font-bold tracking-tighter text-black text-outline">
              Dashboard Admin
            </h1>
            <p className="text-black/60 text-outline">
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
              className="flex items-center gap-2 px-6 py-3 bg-black/5 text-black rounded-2xl font-bold hover:bg-red-500 hover:text-white transition-all"
            >
              <LogOut size={20} /> Logout
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex p-1 bg-black/5 rounded-2xl w-fit mx-auto md:mx-0">
          <button 
            onClick={() => setActiveTab('orders')}
            className={`px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${activeTab === 'orders' ? 'bg-white text-black shadow-md' : 'text-black/40 hover:text-black'}`}
          >
            <ShoppingBag size={20} /> Pesanan ({orders.length})
          </button>
          <button 
            onClick={() => setActiveTab('newsletter')}
            className={`px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${activeTab === 'newsletter' ? 'bg-white text-black shadow-md' : 'text-black/40 hover:text-black'}`}
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
                  className="bg-white p-6 md:p-8 rounded-3xl border border-black/5 shadow-sm space-y-6"
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
                        <span className="text-xs text-black/40">
                          {new Date(order.createdAt).toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="space-y-4 pt-4">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-4">
                            <img src={item.image} alt={item.name} className="w-16 h-16 rounded-xl object-cover border border-black/5" referrerPolicy="no-referrer" />
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-black truncate">{item.name}</p>
                              <p className="text-sm text-black/40">{item.quantity}x @ {formatPrice(item.price)}</p>
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
                        className={`p-3 rounded-xl transition-all ${order.status === 'processing' ? 'bg-tea-main text-white' : 'bg-black/5 text-black/40 hover:text-tea-main'}`}
                        title="Processing"
                      >
                        <Clock size={20} />
                      </button>
                      <button 
                        onClick={() => updateOrderStatusHandler(order.id, 'shipped')}
                        className={`p-3 rounded-xl transition-all ${order.status === 'shipped' ? 'bg-sky-blue text-white' : 'bg-black/5 text-black/40 hover:text-sky-blue'}`}
                        title="Shipped"
                      >
                        <Package size={20} />
                      </button>
                      <button 
                        onClick={() => updateOrderStatusHandler(order.id, 'delivered')}
                        className={`p-3 rounded-xl transition-all ${order.status === 'delivered' ? 'bg-pastel-peach text-white' : 'bg-black/5 text-black/40 hover:text-pastel-peach'}`}
                        title="Delivered"
                      >
                        <CheckCircle size={20} />
                      </button>
                      <button 
                        onClick={() => updateOrderStatusHandler(order.id, 'completed')}
                        className={`p-3 rounded-xl transition-all ${order.status === 'completed' ? 'bg-green-500 text-white' : 'bg-black/5 text-black/40 hover:text-green-500'}`}
                        title="Completed"
                      >
                        <CheckCircle size={20} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-black/5">
                    <div className="space-y-2">
                      <p className="text-xs font-bold uppercase tracking-widest opacity-40">Pelanggan</p>
                      <p className="font-bold text-black">{order.customerName}</p>
                      <p className="text-sm text-tea-main font-bold">{order.customerPhone}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-bold uppercase tracking-widest opacity-40">Alamat & Pembayaran</p>
                      <p className="text-sm text-black/80">{order.address}</p>
                      <p className="text-xs font-bold text-tea-main">Metode: {order.paymentMethod}</p>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-black/10">
                <p className="text-black/40">Belum ada pesanan masuk.</p>
              </div>
            )
          ) : (
            <div className="bg-white rounded-3xl border border-black/5 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-black/5">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest opacity-60">Nomor WhatsApp</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest opacity-60">Tanggal Daftar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {newsletters.length > 0 ? (
                    newsletters.map((n, index) => (
                      <tr key={`${n.id}-${index}`} className="hover:bg-black/[0.02] transition-colors">
                        <td className="px-6 py-4 font-bold text-black">{n.phone}</td>
                        <td className="px-6 py-4 text-sm text-black/60">
                          {new Date(n.createdAt).toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={2} className="px-6 py-10 text-center text-black/40">Belum ada pendaftar newsletter.</td>
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
