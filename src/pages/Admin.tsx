import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { auth, googleProvider, isFirebaseEnabled } from '../lib/firebase';
import { signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { getLocalOrders, getLocalNewsletters, OrderRecord, NewsletterRecord, clearLocalData, updateLocalOrderStatus } from '../lib/storage';
import { formatPrice, cn, getYouTubeVideoId, getYouTubeEmbedUrl } from '../lib/utils';
import { 
  updateOrderStatus,
  getMyProducts,
  updateProduct
} from '../lib/sellerService';
import { Product } from '../types';
import { CONTACT_INFO, ADMIN_EMAIL, ADMIN_EMAILS, isAdminEmail, getAllAdminEmails, addAdminEmail, removeAdminEmail } from '../constants';
import { 
  Loader2, LogOut, ShoppingBag, Mail, CheckCircle, Clock, Trash2, 
  Package, ShieldAlert, Globe, Users, Plus, ShieldCheck, UserCheck, 
  FileText, Printer, Sparkles, ExternalLink, Youtube, Play, Video, 
  Eye, Search, X, Check, Save
} from 'lucide-react';
import InvoiceMaker from '../components/InvoiceMaker';

// Admin dashboard component
export default function Admin() {
  const [user, setUser] = React.useState<{ email: string; displayName: string } | null>(null);
  const [firebaseUser, setFirebaseUser] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [orders, setOrders] = React.useState<OrderRecord[]>([]);
  const [newsletters, setNewsletters] = React.useState<NewsletterRecord[]>([]);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [activeTab, setActiveTab] = React.useState<'orders' | 'products' | 'invoices' | 'newsletter' | 'admins'>('orders');
  const [adminEmailsList, setAdminEmailsList] = React.useState<string[]>([]);
  const [newAdminEmail, setNewAdminEmail] = React.useState('');
  const [loginEmailInput, setLoginEmailInput] = React.useState('');
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = React.useState<OrderRecord | null>(null);
  const [editingVideoProduct, setEditingVideoProduct] = React.useState<Product | null>(null);
  const [videoUrlInput, setVideoUrlInput] = React.useState('');
  const [isSavingVideo, setIsSavingVideo] = React.useState(false);
  const [productSearchQuery, setProductSearchQuery] = React.useState('');

  const refreshAdminList = () => {
    setAdminEmailsList(getAllAdminEmails());
  };

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
      const parsed = JSON.parse(saved);
      if (isAdminEmail(parsed?.email)) {
        setUser(parsed);
      }
    }
    setOrders(getLocalOrders());
    setNewsletters(getLocalNewsletters());
    refreshAdminList();

    const unsubProducts = getMyProducts((prods) => {
      setProducts(prods);
    });

    setLoading(false);

    return () => {
      unsubscribe?.();
      unsubProducts?.();
    };
  }, []);

  const handleLogin = async () => {
    try {
      if (isFirebaseEnabled && auth) {
        setLoading(true);
        const result = await signInWithPopup(auth, googleProvider);
        if (!isAdminEmail(result.user.email)) {
          await signOut(auth);
          alert(`Akses Ditolak: Email ${result.user.email} tidak terdaftar sebagai Admin.`);
          setLoading(false);
          return;
        }

        const adminSession = {
          email: result.user.email || ADMIN_EMAIL,
          displayName: result.user.displayName || 'Administrator'
        };
        setUser(adminSession);
        localStorage.setItem('user_session', JSON.stringify(adminSession));
        return;
      }

      // Local Login Mode
      const targetEmail = loginEmailInput.trim() || ADMIN_EMAIL;
      if (!isAdminEmail(targetEmail)) {
        alert(`Akses Ditolak: Email "${targetEmail}" tidak terdaftar sebagai Admin.`);
        return;
      }

      const adminSession = {
        email: targetEmail,
        displayName: targetEmail.split('@')[0] || 'Administrator'
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

  if (!user || !isAdminEmail(user.email)) {
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
          <h1 className="text-3xl font-display font-bold text-black">Akses Admin</h1>
          <div className="space-y-4">
            <p className="text-black/60 text-sm">
              {isFirebaseEnabled 
                ? "Gunakan akun Google terdaftar untuk mengakses Dashboard Admin."
                : "Masukkan email Admin terdaftar untuk mengakses Dashboard Admin."}
            </p>

            {!isFirebaseEnabled && (
              <div className="text-left space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-black/50">Email Admin</label>
                <input 
                  type="email" 
                  value={loginEmailInput}
                  onChange={(e) => setLoginEmailInput(e.target.value)}
                  placeholder="e.g. eepsyarief20@gmail.com"
                  className="w-full px-4 py-3 rounded-xl border border-black/10 text-sm font-medium focus:outline-none focus:border-tea-main"
                />
              </div>
            )}
            
            <button 
              onClick={handleLogin}
              className="w-full bg-tea-main text-white py-4 rounded-2xl font-bold hover:scale-[1.02] transition-transform flex items-center justify-center gap-3 shadow-lg"
            >
              {isFirebaseEnabled && <Globe size={18} />}
              {isFirebaseEnabled ? 'Masuk dengan Google' : 'Masuk sebagai Admin'}
            </button>

            <div className="pt-2 text-left bg-black/5 p-3 rounded-xl space-y-1">
              <p className="text-[10px] uppercase font-bold tracking-widest text-black/40 flex items-center gap-1">
                <ShieldCheck size={12} className="text-tea-main" /> Email Terdaftar:
              </p>
              <div className="flex flex-wrap gap-1 pt-1">
                {getAllAdminEmails().map((em, idx) => (
                  <span key={idx} className="bg-white text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-black/10 text-black/70">
                    {em}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  const handleAddAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim()) return;
    if (addAdminEmail(newAdminEmail)) {
      alert(`Email admin "${newAdminEmail.trim()}" berhasil ditambahkan!`);
      setNewAdminEmail('');
      refreshAdminList();
    } else {
      alert("Format email tidak valid.");
    }
  };

  const handleRemoveAdmin = (email: string) => {
    if (ADMIN_EMAILS.includes(email.toLowerCase())) {
      alert("Email admin bawaan tidak dapat dihapus.");
      return;
    }
    if (confirm(`Hapus email admin "${email}"?`)) {
      removeAdminEmail(email);
      refreshAdminList();
    }
  };

  const handleOpenVideoModal = (prod: Product) => {
    setEditingVideoProduct(prod);
    setVideoUrlInput(prod.youtubeUrl || '');
  };

  const handleSaveProductVideo = async () => {
    if (!editingVideoProduct) return;
    setIsSavingVideo(true);
    try {
      const cleanUrl = videoUrlInput.trim();
      await updateProduct(editingVideoProduct.id, { youtubeUrl: cleanUrl });
      setProducts(prev => prev.map(p => p.id === editingVideoProduct.id ? { ...p, youtubeUrl: cleanUrl } : p));
      alert('Link video YouTube produk berhasil disimpan!');
      setEditingVideoProduct(null);
    } catch (err: any) {
      console.error('Error updating video URL:', err);
      alert('Gagal menyimpan link video: ' + (err?.message || 'Terjadi kesalahan'));
    } finally {
      setIsSavingVideo(false);
    }
  };

  const handleRemoveProductVideo = async () => {
    if (!editingVideoProduct) return;
    if (!confirm('Hapus link video YouTube dari produk ini?')) return;
    setIsSavingVideo(true);
    try {
      await updateProduct(editingVideoProduct.id, { youtubeUrl: '' });
      setProducts(prev => prev.map(p => p.id === editingVideoProduct.id ? { ...p, youtubeUrl: '' } : p));
      setVideoUrlInput('');
      setEditingVideoProduct(null);
      alert('Video YouTube berhasil dihapus dari produk.');
    } catch (err: any) {
      console.error('Error removing video URL:', err);
      alert('Gagal menghapus link video: ' + (err?.message || 'Terjadi kesalahan'));
    } finally {
      setIsSavingVideo(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-light pt-32 pb-20 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h1 className="text-4xl font-display font-bold tracking-tighter text-black text-outline">
              Dashboard Admin
            </h1>
            <p className="text-black/60 text-outline flex items-center gap-2">
              <UserCheck size={16} className="text-tea-main" />
              Halo, <strong>{user.displayName}</strong> ({user.email})!
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
        <div className="flex flex-wrap p-1 bg-black/5 rounded-2xl w-fit mx-auto md:mx-0 gap-1 no-print">
          <button 
            onClick={() => setActiveTab('orders')}
            className={`px-5 sm:px-7 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${activeTab === 'orders' ? 'bg-white text-black shadow-md' : 'text-black/40 hover:text-black'}`}
          >
            <ShoppingBag size={18} /> Pesanan ({orders.length})
          </button>
          <button 
            onClick={() => setActiveTab('products')}
            className={`px-5 sm:px-7 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${activeTab === 'products' ? 'bg-white text-black shadow-md' : 'text-black/40 hover:text-black'}`}
          >
            <Youtube size={18} className="text-red-600" /> Video Produk ({products.filter(p => p.youtubeUrl && getYouTubeVideoId(p.youtubeUrl)).length}/{products.length})
          </button>
          <button 
            onClick={() => setActiveTab('invoices')}
            className={`px-5 sm:px-7 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${activeTab === 'invoices' ? 'bg-white text-black shadow-md' : 'text-black/40 hover:text-black'}`}
          >
            <FileText size={18} /> Invoice & Nota Maker
          </button>
          <button 
            onClick={() => setActiveTab('newsletter')}
            className={`px-5 sm:px-7 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${activeTab === 'newsletter' ? 'bg-white text-black shadow-md' : 'text-black/40 hover:text-black'}`}
          >
            <Mail size={18} /> Newsletter ({newsletters.length})
          </button>
          <button 
            onClick={() => setActiveTab('admins')}
            className={`px-5 sm:px-7 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${activeTab === 'admins' ? 'bg-white text-black shadow-md' : 'text-black/40 hover:text-black'}`}
          >
            <Users size={18} /> Akun Admin ({adminEmailsList.length})
          </button>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 gap-6">
          {activeTab === 'invoices' ? (
            <InvoiceMaker 
              initialOrder={selectedOrderForInvoice}
              onClearInitialOrder={() => setSelectedOrderForInvoice(null)}
              allProducts={products}
            />
          ) : activeTab === 'orders' ? (
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
                    <div className="flex flex-wrap items-start gap-2">
                      <button
                        onClick={() => {
                          setSelectedOrderForInvoice(order);
                          setActiveTab('invoices');
                        }}
                        className="px-4 py-3 rounded-xl bg-tea-main/10 hover:bg-tea-main hover:text-white text-tea-main font-bold text-xs transition-all flex items-center gap-2 border border-tea-main/20"
                        title="Buat Nota Resmi dari Pesanan Ini"
                      >
                        <FileText size={16} /> Buat Nota / Invoice
                      </button>
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
          ) : activeTab === 'newsletter' ? (
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
          ) : activeTab === 'admins' ? (
            <div className="space-y-6">
              {/* Form Tambah Admin */}
              <div className="bg-white p-6 md:p-8 rounded-3xl border border-black/5 shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-tea-main/10 flex items-center justify-center text-tea-main font-bold">
                    <Plus size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-black">Tambah Akun Admin Baru</h3>
                    <p className="text-xs text-black/50">Daftarkan email pengguna baru yang diberikan hak akses sebagai Administrator toko.</p>
                  </div>
                </div>

                <form onSubmit={handleAddAdmin} className="flex flex-col sm:flex-row gap-3 pt-2">
                  <input 
                    type="email" 
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    placeholder="Masukkan email admin (contoh: partner@estore.com)"
                    required
                    className="flex-1 px-4 py-3 rounded-2xl border border-black/10 text-sm font-medium focus:outline-none focus:border-tea-main"
                  />
                  <button 
                    type="submit"
                    className="bg-tea-main text-white px-6 py-3 rounded-2xl font-bold hover:scale-[1.02] transition-all flex items-center justify-center gap-2 shadow-md"
                  >
                    <Plus size={18} /> Tambah Admin
                  </button>
                </form>
              </div>

              {/* Daftar Admin */}
              <div className="bg-white rounded-3xl border border-black/5 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-black/5 flex justify-between items-center">
                  <h3 className="font-bold text-black flex items-center gap-2">
                    <ShieldCheck size={20} className="text-tea-main" /> Daftar Email Admin Terdaftar ({adminEmailsList.length})
                  </h3>
                </div>
                <div className="divide-y divide-black/5">
                  {adminEmailsList.map((email, idx) => {
                    const isDefault = ADMIN_EMAILS.includes(email.toLowerCase());
                    return (
                      <div key={idx} className="p-4 sm:p-6 flex items-center justify-between gap-4 hover:bg-black/[0.01] transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-black/5 flex items-center justify-center text-black/60 shrink-0 font-bold text-xs">
                            {idx + 1}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-black text-sm sm:text-base truncate">{email}</p>
                            <span className={`inline-block mt-0.5 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              isDefault ? 'bg-tea-main/10 text-tea-main' : 'bg-blue-500/10 text-blue-600'
                            }`}>
                              {isDefault ? 'Admin Utama (Permanen)' : 'Admin Tambahan'}
                            </span>
                          </div>
                        </div>

                        {!isDefault && (
                          <button 
                            onClick={() => handleRemoveAdmin(email)}
                            className="p-2.5 text-red-500 hover:bg-red-50 hover:rounded-xl transition-all"
                            title="Hapus Hak Akses Admin"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : activeTab === 'products' ? (
            <div className="space-y-6">
              {/* Header & Stats Banner */}
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-black/5 shadow-sm space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-red-50 text-red-600 rounded-xl">
                        <Youtube size={24} />
                      </div>
                      <h3 className="text-xl font-display font-bold text-black">Kelola Video Preview Produk (YouTube)</h3>
                    </div>
                    <p className="text-black/60 text-sm max-w-2xl">
                      Masukkan tautan video YouTube (review, unboxing, atau katalog) untuk setiap produk. Pelanggan dapat langsung memutar video ini di halaman detail produk.
                    </p>
                  </div>
                  <Link
                    to="/seller"
                    className="inline-flex items-center gap-2 bg-black text-white px-5 py-3 rounded-2xl font-bold text-sm hover:scale-105 transition-all shadow-md shrink-0"
                  >
                    <Plus size={16} /> Buka Seller Center
                  </Link>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="p-4 rounded-2xl bg-black/[0.02] border border-black/5">
                    <p className="text-xs font-bold uppercase tracking-wider text-black/40">Total Produk</p>
                    <p className="text-2xl font-display font-black text-black mt-1">{products.length}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-red-50/70 border border-red-200">
                    <p className="text-xs font-bold uppercase tracking-wider text-red-600 flex items-center gap-1.5">
                      <Youtube size={14} /> Sudah Ada Video
                    </p>
                    <p className="text-2xl font-display font-black text-red-600 mt-1">
                      {products.filter(p => p.youtubeUrl && getYouTubeVideoId(p.youtubeUrl)).length}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-black/[0.02] border border-black/5">
                    <p className="text-xs font-bold uppercase tracking-wider text-black/40">Belum Ada Video</p>
                    <p className="text-2xl font-display font-black text-black/60 mt-1">
                      {products.filter(p => !p.youtubeUrl || !getYouTubeVideoId(p.youtubeUrl)).length}
                    </p>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30" />
                  <input
                    type="text"
                    placeholder="Cari nama produk, kategori, atau brand..."
                    value={productSearchQuery}
                    onChange={(e) => setProductSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-2xl bg-black/[0.03] border border-black/5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 transition-all text-black"
                  />
                  {productSearchQuery && (
                    <button
                      onClick={() => setProductSearchQuery('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-black/40 hover:text-black"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* Product Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products
                  .filter(p => {
                    if (!productSearchQuery.trim()) return true;
                    const q = productSearchQuery.toLowerCase();
                    return (
                      p.name.toLowerCase().includes(q) ||
                      (p.brand && p.brand.toLowerCase().includes(q)) ||
                      (p.category && p.category.toLowerCase().includes(q))
                    );
                  })
                  .map((product) => {
                    const hasValidVideo = Boolean(product.youtubeUrl && getYouTubeVideoId(product.youtubeUrl));
                    const videoId = getYouTubeVideoId(product.youtubeUrl);

                    return (
                      <div
                        key={product.id}
                        className="bg-white rounded-3xl border border-black/5 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                      >
                        <div className="space-y-4">
                          {/* Image & Video Badge */}
                          <div className="aspect-video relative bg-black/5 overflow-hidden group">
                            <img
                              src={product.images[0] || 'https://picsum.photos/400/300'}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            {hasValidVideo ? (
                              <div className="absolute top-3 left-3 bg-red-600 text-white text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5">
                                <Youtube size={14} className="fill-white" /> Ada Video
                              </div>
                            ) : (
                              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                                Belum Ada Video
                              </div>
                            )}

                            {hasValidVideo && (
                              <button
                                onClick={() => handleOpenVideoModal(product)}
                                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-bold text-sm"
                              >
                                <Play size={24} className="fill-white" /> Putar Preview Video
                              </button>
                            )}
                          </div>

                          {/* Info */}
                          <div className="p-5 space-y-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-bold uppercase tracking-wider bg-black/5 px-2 py-0.5 rounded text-black/60">
                                {product.category}
                              </span>
                              {product.brand && (
                                <span className="text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                                  {product.brand}
                                </span>
                              )}
                              <span className={cn(
                                "text-[10px] font-black px-2 py-0.5 rounded ml-auto",
                                product.stock === 0 ? "bg-red-50 text-red-600 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              )}>
                                Stok: {product.stock === 0 ? 'SOLD (0)' : '1'}
                              </span>
                            </div>

                            <h4 className="font-bold text-black text-base line-clamp-1" title={product.name}>
                              {product.name}
                            </h4>

                            <p className="text-lg font-black text-black">
                              {formatPrice(product.price)}
                            </p>

                            {/* Current YouTube URL Display */}
                            {hasValidVideo ? (
                              <div className="p-3 bg-red-50/80 border border-red-200 rounded-2xl space-y-1 text-xs">
                                <div className="flex items-center justify-between text-red-700 font-bold">
                                  <span className="flex items-center gap-1">
                                    <Youtube size={14} /> Link YouTube:
                                  </span>
                                  <span className="font-mono text-[10px] bg-white px-1.5 py-0.5 rounded border border-red-200">
                                    ID: {videoId}
                                  </span>
                                </div>
                                <p className="text-[11px] text-black/60 truncate font-mono">
                                  {product.youtubeUrl}
                                </p>
                              </div>
                            ) : (
                              <div className="p-3 bg-black/[0.02] border border-black/5 rounded-2xl text-xs text-black/50 italic">
                                Belum ada link video YouTube yang dipasang.
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="p-5 pt-0 grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleOpenVideoModal(product)}
                            className={cn(
                              "py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm",
                              hasValidVideo 
                                ? "bg-red-600 text-white hover:bg-red-700" 
                                : "bg-black text-white hover:bg-black/80"
                            )}
                          >
                            <Youtube size={14} />
                            {hasValidVideo ? "Ubah / Test Video" : "+ Pasang Link"}
                          </button>
                          <Link
                            to={`/product/${product.id}`}
                            className="py-2.5 px-3 rounded-xl font-bold text-xs text-black bg-black/5 hover:bg-black/10 flex items-center justify-center gap-1.5 transition-all"
                          >
                            <ExternalLink size={14} /> Lihat di Web
                          </Link>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {products.length === 0 && (
                <div className="bg-white p-12 rounded-3xl border border-black/5 text-center space-y-4">
                  <Package size={48} className="mx-auto text-black/20" />
                  <p className="text-black/40 font-bold">Belum ada produk yang terdaftar.</p>
                  <Link
                    to="/seller"
                    className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-2xl font-bold text-sm"
                  >
                    Tambah Produk Pertama di Seller Center
                  </Link>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Modal: Input / Edit Link Video YouTube */}
        {editingVideoProduct && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-black/10 overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-black/5 flex items-center justify-between bg-black/[0.01]">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-red-600 text-white rounded-2xl shadow-md">
                    <Youtube size={20} />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg text-black">
                      Kelola Video YouTube Produk
                    </h3>
                    <p className="text-xs text-black/50 truncate max-w-md">
                      {editingVideoProduct.name} &bull; {formatPrice(editingVideoProduct.price)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingVideoProduct(null)}
                  className="p-2 text-black/40 hover:text-black hover:bg-black/5 rounded-xl transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-5 overflow-y-auto">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-black/70 flex items-center justify-between">
                    <span>Link Video YouTube</span>
                    {videoUrlInput && (
                      <button
                        type="button"
                        onClick={() => setVideoUrlInput('')}
                        className="text-[11px] text-red-500 font-bold hover:underline"
                      >
                        Bersihkan
                      </button>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={videoUrlInput}
                      onChange={(e) => setVideoUrlInput(e.target.value)}
                      placeholder="Contoh: https://www.youtube.com/watch?v=dQw4w9WgXcQ atau https://youtu.be/..."
                      className="w-full bg-black/[0.03] border-2 border-black/10 focus:border-red-600 rounded-2xl pl-4 pr-10 py-3 text-sm text-black focus:outline-none transition-all placeholder:text-black/30"
                    />
                    <Youtube size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-red-600 pointer-events-none" />
                  </div>
                  <p className="text-[11px] text-black/50">
                    💡 <strong>Tips:</strong> Salin URL dari address bar browser atau tombol "Bagikan" di YouTube. Mendukung video reguler, YouTube Shorts, serta link singkat youtu.be.
                  </p>
                </div>

                {/* Embedded Live Preview */}
                {videoUrlInput.trim() ? (
                  getYouTubeVideoId(videoUrlInput) ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-green-700 flex items-center gap-1.5">
                          <Check size={14} className="text-green-600 stroke-[3]" />
                          Video Terverifikasi & Siap Diputar
                        </span>
                        <span className="text-[11px] font-mono text-black/40">
                          ID: {getYouTubeVideoId(videoUrlInput)}
                        </span>
                      </div>
                      <div className="aspect-video w-full rounded-2xl overflow-hidden border border-black/10 bg-black shadow-md">
                        <iframe
                          src={getYouTubeEmbedUrl(videoUrlInput) || ''}
                          title="Preview Video Produk"
                          className="w-full h-full border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs space-y-1">
                      <p className="font-bold">⚠️ Format Link Belum Dikenali</p>
                      <p className="text-amber-800/80">
                        Pastikan link berformat YouTube yang valid, misalnya:
                        <br />
                        <code className="bg-amber-100/70 px-1 py-0.5 rounded text-[11px]">https://www.youtube.com/watch?v=VIDEO_ID</code> atau <code className="bg-amber-100/70 px-1 py-0.5 rounded text-[11px]">https://youtu.be/VIDEO_ID</code>
                      </p>
                    </div>
                  )
                ) : (
                  <div className="p-8 border-2 border-dashed border-black/10 rounded-2xl text-center space-y-2 bg-black/[0.01]">
                    <Video size={36} className="mx-auto text-black/20" />
                    <p className="text-xs text-black/50 font-medium">
                      Tempel link YouTube di atas untuk melihat preview langsung di sini sebelum disimpan.
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-black/5 bg-black/[0.01] flex items-center justify-between gap-3">
                {editingVideoProduct.youtubeUrl ? (
                  <button
                    type="button"
                    onClick={handleRemoveProductVideo}
                    disabled={isSavingVideo}
                    className="text-xs font-bold text-red-600 hover:text-red-700 px-3 py-2 rounded-xl hover:bg-red-50 transition-all flex items-center gap-1.5"
                  >
                    <Trash2 size={14} /> Hapus Video
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingVideoProduct(null)}
                    disabled={isSavingVideo}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-black/60 hover:text-black hover:bg-black/5 transition-all"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveProductVideo}
                    disabled={isSavingVideo || (Boolean(videoUrlInput.trim()) && !getYouTubeVideoId(videoUrlInput))}
                    className="px-6 py-2.5 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSavingVideo ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Simpan Video
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
