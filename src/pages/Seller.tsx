import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Store as StoreIcon, 
  Plus, 
  Edit2, 
  Trash2, 
  Image as ImageIcon, 
  Save, 
  X, 
  Package, 
  MapPin, 
  FileText, 
  Tag, 
  DollarSign,
  ChevronRight,
  LayoutDashboard,
  Settings,
  Eye,
  Sparkles,
  Loader2,
  Globe,
  Link as LinkIcon,
  Wand2,
  ShieldAlert,
  Share2,
  Youtube,
  Play,
  Video,
  CheckCircle,
  Ruler,
  Flame,
  Stamp,
  Check,
  BarChart3,
  FileSpreadsheet,
  Download
} from 'lucide-react';
import { db, isFirebaseEnabled, auth, googleProvider } from '../lib/firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { 
  createStore, 
  updateStore, 
  getMyStore, 
  addProduct, 
  updateProduct, 
  deleteProduct, 
  getMyProducts,
  uploadImage,
  MAIN_STORE_ID,
  syncAllProductsStockToOne,
  updateProductStatus
} from '../lib/sellerService';
import { Store, Product } from '../types';
import { cn, formatPrice, getYouTubeVideoId, getYouTubeEmbedUrl, isFreshDrop, isHeicFile, convertHeicToJpeg, downloadImageToDevice } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { ADMIN_EMAIL, CONTACT_INFO, isAdminEmail } from '../constants';
import InvoiceMaker from '../components/InvoiceMaker';

import { SHOE_BRANDS, SHOE_MODELS } from '../constants/shoeCategories';
import { generateShoeDetails } from '../utils/shoeAutoGenerator';

export default function Seller() {
  const [store, setStore] = React.useState<Store | null>(null);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [authLoading, setAuthLoading] = React.useState(isFirebaseEnabled);
  const [isFirebaseAuthed, setIsFirebaseAuthed] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<'dashboard' | 'products' | 'invoices' | 'reports' | 'settings'>('dashboard');
  const [isEditingStore, setIsEditingStore] = React.useState(false);
  const [isAddingProduct, setIsAddingProduct] = React.useState(false);
  const [isImportingLink, setIsImportingLink] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null);
  const [successProductId, setSuccessProductId] = React.useState<string | null>(null);
  const [isSyncingStock, setIsSyncingStock] = React.useState(false);

  const handleExportCSV = () => {
    if (products.length === 0) {
      alert('Tidak ada produk untuk diekspor.');
      return;
    }
    const headers = ['ID', 'Nama Produk', 'Brand', 'Model', 'Kategori', 'Size', 'Insole', 'Kondisi', 'Harga (Rp)', 'Status', 'Views', 'Tanggal Export'];
    const rows = products.map(p => {
      const isSold = (p.stock !== undefined ? p.stock : 1) <= 0;
      const isBooked = Boolean(p.isBooked && !isSold);
      const status = isSold ? 'SOLD' : isBooked ? 'BOOKED' : 'READY';
      return [
        `"${p.id}"`,
        `"${(p.name || '').replace(/"/g, '""')}"`,
        `"${p.brand || '-'}"`,
        `"${p.shoeModel || '-'}"`,
        `"${p.category || '-'}"`,
        `"${(p.sizes || []).join('/')}"`,
        `"${p.insoleLength || '-'}"`,
        `"${p.condition || '-'}"`,
        p.price || 0,
        `"${status}"`,
        p.views || 0,
        `"${new Date().toLocaleDateString('id-ID')}"`
      ].join(',');
    });
    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan-penjualan-estore-majalengka-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSyncStock = async () => {
    if (!confirm('Pastikan dan setel semua produk agar pasti memiliki stok 1?')) return;
    setIsSyncingStock(true);
    try {
      await syncAllProductsStockToOne();
      getMyProducts(setProducts);
      alert('Berhasil! Semua stok produk telah dipastikan menjadi 1.');
    } catch (err: any) {
      console.error(err);
      alert('Gagal menyinkronkan stok.');
    } finally {
      setIsSyncingStock(false);
    }
  };
  
  const navigate = useNavigate();

  React.useEffect(() => {
    // Check local session
    const savedSession = localStorage.getItem('user_session');
    if (!savedSession) {
      navigate('/admin');
      return;
    }
    
    const user = JSON.parse(savedSession);
    if (!isAdminEmail(user?.email)) {
      setError("Akses Ditolak: Hanya administrator yang dapat mengelola produk.");
      setLoading(false);
      return;
    }

    // Load store and products
    const loadData = async (shouldCreateStore = true) => {
      // Don't attempt cloud operations if not authed yet
      if (isFirebaseEnabled && !auth?.currentUser) {
        setLoading(false);
        return;
      }

      getMyStore(async (s) => {
        if (!s) {
          if (!shouldCreateStore) {
            setLoading(false);
            return;
          }
          // If no store exists, create a default one automatically
          try {
            await createStore({
              name: 'E STORE Official',
              location: 'Majalengka, Jawa Barat, Indonesia',
              description: 'Toko resmi E STORE menyuguhkan berbagai pilihan sepatu sneaker, olahraga, formal, dan wanita original terbaik untuk Anda.',
              logo: CONTACT_INFO.logo
            });
            window.location.reload();
          } catch (err) {
            console.error("Auto store creation failed:", err);
            // Don't reload if it failed (might be auth)
            setLoading(false);
          }
          return;
        }
        setStore(s);
        getMyProducts(setProducts);
        setLoading(false);
      });
    };

    // Sync with Firebase Auth
    let unsubscribe: any;
    if (isFirebaseEnabled && auth) {
      unsubscribe = onAuthStateChanged(auth, (u) => {
        const isAuthed = !!u && isAdminEmail(u?.email);
        setIsFirebaseAuthed(isAuthed);
        setAuthLoading(false);
        
        // Load data once auth is determined
        if (isAuthed || !isFirebaseEnabled) {
          loadData(isAuthed); // Only auto-create if we have cloud auth or are in local mode
        } else {
          setLoading(false);
        }
      });
    } else {
      // Local mode
      loadData();
    }

    return () => unsubscribe?.();
  }, [navigate]);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-tea-main"></div>
        <p className="text-black/40 font-medium animate-pulse">
          {authLoading ? 'Memverifikasi Hak Akses Cloud...' : 'Memuat data toko...'}
        </p>
      </div>
    );
  }

  // If Cloud is enabled but not authed, show a warning if trying to perform protected actions
  const isCloudWarningVisible = isFirebaseEnabled && !isFirebaseAuthed;

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center gap-6">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-500">
          <X size={40} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-black">Waduh, Ada Masalah</h2>
          <p className="text-black/60 max-w-md">{error}</p>
        </div>
        <button 
          onClick={() => navigate('/admin')}
          className="bg-tea-main text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-tea-main/20 hover:scale-105 transition-all"
        >
          Kembali ke Login
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-light pb-20 pt-28">
      {/* Header */}
      <div className="bg-white border-b border-black/5 sticky top-[88px] z-30">
      <div className="max-w-7xl mx-auto px-4 h-auto min-h-[4rem] py-2 md:h-16 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-black/5 flex items-center justify-center overflow-hidden">
              {store?.logo ? (
                <img src={store.logo} alt={store.name} className="w-full h-full object-cover" />
              ) : (
                <StoreIcon className="text-black/20" size={20} />
              )}
            </div>
            <div>
              <h1 className="font-bold text-black">{store?.name || 'Toko Belum Siap'}</h1>
              <p className="text-[10px] text-black/40 uppercase font-bold tracking-widest">
                Seller Center ({isFirebaseEnabled ? 'Cloud' : 'Lokal'})
              </p>
            </div>
          </div>
          {store && (
            <div className="flex bg-black/5 p-1 rounded-xl">
              <TabButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={16} />} label="Dashboard" />
              <TabButton active={activeTab === 'products'} onClick={() => setActiveTab('products')} icon={<Package size={16} />} label="Produk" />
              <TabButton active={activeTab === 'invoices'} onClick={() => setActiveTab('invoices')} icon={<FileText size={16} />} label="Invoice & Nota" />
              <TabButton active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} icon={<BarChart3 size={16} />} label="Laporan" />
              <TabButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Settings size={16} />} label="Toko" />
            </div>
          )}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {!isFirebaseAuthed && isFirebaseEnabled && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-yellow-500/10 border-2 border-dashed border-yellow-500/20 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-2xl flex items-center justify-center text-yellow-600">
                <ShieldAlert size={24} />
              </div>
              <div>
                <h3 className="font-bold text-black">Sinkronisasi Cloud Diperlukan</h3>
                <p className="text-sm text-black/40">Data toko ada di Database Cloud. Silakan login Google untuk melihat dan mengelola produk Anda.</p>
              </div>
            </div>
            <button 
              onClick={async () => {
                try {
                  setAuthLoading(true);
                  const result = await signInWithPopup(auth!, googleProvider);
                  if (!isAdminEmail(result.user.email)) {
                    await signOut(auth!);
                    alert(`Akses Ditolak: Email Google ${result.user.email} tidak terdaftar sebagai Admin.`);
                    setAuthLoading(false);
                    return;
                  }
                  const adminSession = {
                    email: result.user.email,
                    displayName: result.user.displayName || 'Administrator'
                  };
                  localStorage.setItem('user_session', JSON.stringify(adminSession));
                  // Reload data after auth
                  window.location.reload();
                } catch (err: any) {
                  console.error("Cloud auth error:", err);
                  alert("Gagal sinkronisasi Cloud: " + (err?.message || "Cek koneksi internet Anda."));
                } finally {
                  setAuthLoading(false);
                }
              }}
              className="bg-yellow-500 text-white px-6 py-3 rounded-2xl font-bold hover:scale-105 transition-all shadow-lg flex items-center gap-2 whitespace-nowrap"
            >
              <Globe size={18} /> Otorisasi Sekarang
            </button>
          </motion.div>
        )}

        {store ? (
          <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              <StatCard title="Total Produk" value={products.length} icon={<Package className="text-tea-main" />} />
              <StatCard title="Total Views" value={products.reduce((sum, p) => sum + (p.views || 0), 0)} icon={<Eye className="text-tea-main" />} />
              <StatCard title="Status Toko" value={isFirebaseEnabled ? (isFirebaseAuthed ? 'Online (Cloud)' : 'Perlu Otorisasi') : 'Aktif (Lokal)'} icon={<Globe className="text-tea-main" />} />
              <StatCard title="Lokasi" value={store.location} icon={<MapPin className="text-tea-main" />} />
            </motion.div>
          )}

          {activeTab === 'products' && (
            <motion.div
              key="products"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-black">Daftar Produk</h2>
                  <p className="text-xs text-black/50">Setiap produk di toko ini memiliki stok 1 (sistem 1 pasang/barang unik)</p>
                </div>
                <div className="flex items-center flex-wrap gap-2 w-full sm:w-auto">
                  <button 
                    onClick={handleSyncStock}
                    disabled={isSyncingStock}
                    title="Pastikan semua stok produk bernilai 1"
                    className="flex-1 sm:flex-none bg-emerald-50 text-emerald-700 px-3.5 py-2 rounded-xl flex items-center justify-center gap-1.5 font-bold hover:bg-emerald-100 transition-all border border-emerald-200 text-xs shadow-xs"
                  >
                    {isSyncingStock ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} className="text-emerald-600" />}
                    <span>Setel Semua Stok = 1</span>
                  </button>
                  <button 
                    onClick={() => setIsImportingLink(true)}
                    className="flex-1 sm:flex-none bg-black/5 text-black px-4 py-2 rounded-xl flex items-center justify-center gap-2 font-bold hover:bg-black/10 transition-all border border-black/5"
                  >
                    <LinkIcon size={18} className="text-tea-main" />
                    <span className="hidden sm:inline">Import Link (AI)</span>
                  </button>
                  <button 
                    onClick={() => setIsAddingProduct(true)}
                    className="flex-1 sm:flex-none bg-tea-main text-white px-4 py-2 rounded-xl flex items-center justify-center gap-2 font-bold hover:scale-105 transition-all shadow-lg shadow-tea-main/20"
                  >
                    <Plus size={18} />
                    Tambah<span className="hidden sm:inline"> Produk</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product, index) => (
                  <div key={`${product.id}-${index}`}>
                    <ProductItem 
                      product={product} 
                      onEdit={() => setEditingProduct(product)}
                      onDelete={() => {
                        if (confirm('Hapus produk ini?')) {
                          deleteProduct(product.id);
                          getMyProducts(setProducts);
                        }
                      }}
                      onStatusChange={async (newStatus) => {
                        await updateProductStatus(product.id, newStatus);
                        getMyProducts(setProducts);
                      }}
                    />
                  </div>
                ))}
                {products.length === 0 && (
                  <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-black/10">
                    <Package size={48} className="mx-auto mb-4 opacity-20" />
                    <p className="text-black/40 font-bold">Belum ada produk. Mulai jualan sekarang!</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'invoices' && (
            <motion.div
              key="invoices"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <InvoiceMaker allProducts={products} />
            </motion.div>
          )}

          {activeTab === 'reports' && (
            <motion.div
              key="reports"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-black/5 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-black/5 pb-6">
                  <div>
                    <h2 className="text-xl font-bold text-black flex items-center gap-2">
                      <BarChart3 className="text-tea-main" size={24} /> Laporan Penjualan & Inventaris
                    </h2>
                    <p className="text-xs text-black/50">Rekap status produk, total nilai omset sepatu thrift, dan ekspor data ke Excel/CSV</p>
                  </div>
                  <button
                    onClick={handleExportCSV}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all hover:scale-105 cursor-pointer"
                  >
                    <FileSpreadsheet size={16} />
                    <span>Download Rekap (.CSV / Excel)</span>
                  </button>
                </div>

                {/* Summary Metrics */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-black/5 p-4 rounded-2xl border border-black/5 space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-black/50">Total Koleksi</p>
                    <p className="text-2xl font-black text-black">{products.length} <span className="text-xs font-normal text-black/60">Pasang</span></p>
                  </div>

                  <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Ready Stock</p>
                    <p className="text-2xl font-black text-emerald-700">
                      {products.filter(p => (p.stock !== undefined ? p.stock : 1) > 0 && !p.isBooked).length}
                      <span className="text-xs font-normal text-emerald-800/80"> Pasang</span>
                    </p>
                  </div>

                  <div className="bg-red-50 p-4 rounded-2xl border border-red-200 space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-red-800">Terjual (Sold Out)</p>
                    <p className="text-2xl font-black text-red-700">
                      {products.filter(p => (p.stock !== undefined ? p.stock : 1) <= 0).length}
                      <span className="text-xs font-normal text-red-800/80"> Pasang</span>
                    </p>
                  </div>

                  <div className="bg-tea-main/10 p-4 rounded-2xl border border-tea-main/20 space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-tea-main">Estimasi Nilai Stok</p>
                    <p className="text-lg sm:text-xl font-black text-tea-main">
                      {formatPrice(products.filter(p => (p.stock !== undefined ? p.stock : 1) > 0).reduce((sum, p) => sum + (p.price || 0), 0))}
                    </p>
                  </div>
                </div>

                {/* Table of products */}
                <div className="border border-black/10 rounded-2xl overflow-hidden">
                  <div className="bg-black/5 px-4 py-3 font-bold text-xs text-black border-b border-black/10 flex items-center justify-between">
                    <span>Daftar Rinci Produk ({products.length})</span>
                    <span className="text-[11px] text-black/50 font-normal">Siap diekspor ke format Excel / Spreadsheet</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-black/[0.02] text-[10px] uppercase tracking-wider text-black/60 border-b border-black/5">
                        <tr>
                          <th className="py-2.5 px-4">Produk</th>
                          <th className="py-2.5 px-3">Brand</th>
                          <th className="py-2.5 px-3">Size / Insole</th>
                          <th className="py-2.5 px-3">Harga</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3">Views</th>
                          <th className="py-2.5 px-3 text-right">Foto</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/5">
                        {products.map((p) => {
                          const isSold = (p.stock !== undefined ? p.stock : 1) <= 0;
                          const isBooked = Boolean(p.isBooked && !isSold);
                          return (
                            <tr key={p.id} className="hover:bg-black/[0.02]">
                              <td className="py-2.5 px-4 font-bold text-black flex items-center gap-2">
                                <img src={p.images[0]} alt="" className="w-8 h-8 rounded-lg object-cover border border-black/10 shrink-0" />
                                <span className="truncate max-w-[180px] sm:max-w-xs">{p.name}</span>
                              </td>
                              <td className="py-2.5 px-3 font-semibold text-black/70">{p.brand || '-'}</td>
                              <td className="py-2.5 px-3 text-black/80 font-mono">
                                {(p.sizes || []).join('/')} {p.insoleLength ? `(${p.insoleLength})` : ''}
                              </td>
                              <td className="py-2.5 px-3 font-bold text-tea-main">{formatPrice(p.price)}</td>
                              <td className="py-2.5 px-3">
                                <span className={cn(
                                  "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase",
                                  isSold 
                                    ? "bg-red-100 text-red-800" 
                                    : isBooked 
                                      ? "bg-amber-100 text-amber-900" 
                                      : "bg-emerald-100 text-emerald-800"
                                )}>
                                  {isSold ? 'SOLD' : isBooked ? 'BOOKED' : 'READY'}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-black/50 font-mono">{p.views || 0}</td>
                              <td className="py-2.5 px-3 text-right">
                                <button
                                  onClick={() => {
                                    const filename = `estore-${p.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.jpg`;
                                    downloadImageToDevice(p.images[0], filename);
                                  }}
                                  title="Download Foto"
                                  className="p-1.5 hover:bg-black/10 rounded-lg text-black/60 hover:text-black inline-flex items-center"
                                >
                                  <Download size={14} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto"
            >
              <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-black">Informasi Toko</h2>
                  <button 
                    onClick={() => setIsEditingStore(!isEditingStore)}
                    className="text-tea-main font-bold text-sm hover:underline"
                  >
                    {isEditingStore ? 'Batal' : 'Edit Toko'}
                  </button>
                </div>

                {isEditingStore ? (
                  <StoreForm store={store} onComplete={() => { setIsEditingStore(false); window.location.reload(); }} />
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center gap-6">
                      <img src={store.logo} alt={store.name} className="w-24 h-24 rounded-3xl object-cover shadow-xl" />
                      <div>
                        <h3 className="text-2xl font-bold text-black">{store.name}</h3>
                        <p className="text-black/60 flex items-center gap-1">
                          <MapPin size={14} />
                          {store.location}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-black/40">Deskripsi Toko</h4>
                      <p className="text-black/80 leading-relaxed">{store.description}</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        ) : (
          !authLoading && !isFirebaseAuthed && isFirebaseEnabled && (
            <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-black/10">
              <ShieldAlert size={48} className="mx-auto mb-4 opacity-20" />
              <p className="text-black/40 font-bold px-6">Gagal memuat data toko. Pastikan Anda sudah memberikan otorisasi Cloud melalui tombol di atas.</p>
            </div>
          )
        )}
      </main>

      {/* Modals */}
      <ImportLinkModal 
        isOpen={isImportingLink} 
        onClose={() => setIsImportingLink(false)} 
        onImport={(data) => {
          setEditingProduct({ 
            ...data, 
            id: '', 
            storeId: MAIN_STORE_ID,
            specifications: Array.isArray(data.specifications) ? data.specifications.join('\n') : data.specifications
          } as any);
          setIsImportingLink(false);
          setIsAddingProduct(true);
        }}
      />

      <AnimatePresence>
        {(isAddingProduct || editingProduct) && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => { setIsAddingProduct(false); setEditingProduct(null); }}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-black/5 flex items-center justify-between">
                <h3 className="text-xl font-bold text-black">
                  {editingProduct?.id ? 'Edit Produk' : 'Tambah Produk Baru'}
                </h3>
                <button onClick={() => { setIsAddingProduct(false); setEditingProduct(null); }} className="p-2 hover:bg-black/5 rounded-full">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 max-h-[80vh] overflow-y-auto">
                <ProductForm 
                  storeId={store.id} 
                  initialData={editingProduct || undefined} 
                  onComplete={(id) => { 
                    setIsAddingProduct(false); 
                    setEditingProduct(null); 
                    getMyProducts(setProducts); 
                    if (id && !editingProduct) {
                      setSuccessProductId(id);
                    }
                  }} 
                />
              </div>
            </motion.div>
          </div>
        )}
        {/* Success Modal */}
        {successProductId && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
              onClick={() => setSuccessProductId(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden p-8 text-center space-y-6"
            >
              <div className="w-20 h-20 bg-tea-main/10 rounded-full flex items-center justify-center mx-auto text-tea-main">
                <Package size={40} />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-black">Produk Terbit!</h2>
                <p className="text-sm text-black/60">Produk Anda sudah aktif dan bisa dilihat oleh pelanggan di Marketplace.</p>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <Link 
                  to={`/product/${successProductId}`}
                  onClick={() => setSuccessProductId(null)}
                  className="bg-tea-main text-white py-4 rounded-2xl font-bold shadow-lg hover:scale-[1.02] transition-all text-sm"
                >
                  Lihat Halaman Produk
                </Link>
                <button 
                  onClick={() => {
                    const url = `${window.location.origin}/product/${successProductId}`;
                    navigator.clipboard.writeText(url);
                    alert('Link produk disalin!');
                  }}
                  className="bg-black/5 text-black py-4 rounded-2xl font-bold flex items-center justify-center gap-2 text-sm hover:bg-black/10"
                >
                  <Share2 size={16} /> Salin Link Produk
                </button>
                <button 
                  onClick={() => setSuccessProductId(null)}
                  className="text-black/40 font-bold py-2 text-sm hover:text-black transition-colors"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
        active 
          ? "bg-white text-tea-main shadow-sm" 
          : "text-black/40 hover:text-black"
      )}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function StatCard({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm space-y-4">
      <div className="w-10 h-10 rounded-xl bg-tea-main/10 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-black/40">{title}</p>
        <p className="text-2xl font-bold text-black">{value}</p>
      </div>
    </div>
  );
}

function ProductItem({ 
  product, 
  onEdit, 
  onDelete, 
  onStatusChange 
}: { 
  product: Product, 
  onEdit: () => void, 
  onDelete: () => void,
  onStatusChange?: (status: 'ready' | 'booked' | 'sold') => void
}) {
  const isSold = (product.stock !== undefined ? product.stock : 1) === 0;
  const isBooked = Boolean(product.isBooked && !isSold);
  const isFresh = isFreshDrop(product);

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/product/${product.id}`;
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: `Cek ${product.name} di E STORE!`,
        url: url
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(url);
      alert('Link produk berhasil disalin!');
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!product.images || product.images.length === 0) return;
    const filename = `estore-${product.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.jpg`;
    await downloadImageToDevice(product.images[0], filename);
  };

  return (
    <div className="bg-white rounded-3xl border border-black/5 overflow-hidden group shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="aspect-video relative overflow-hidden bg-black/5">
          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
          
          {/* Fresh Drop and Booked Badges on Image */}
          <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
            {isFresh && !isSold && (
              <span className="bg-gradient-to-r from-orange-600 to-amber-500 text-white text-[9px] font-black px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-md uppercase tracking-wider">
                <Flame size={11} className="fill-white" />
                Fresh Drop
              </span>
            )}
            {isBooked && (
              <span className="bg-amber-500 text-black text-[9px] font-black px-2 py-0.5 rounded-lg shadow-md uppercase tracking-wider border border-white/50">
                🟡 BOOKED / KEEP
              </span>
            )}
          </div>

          <div className="absolute top-3 right-3 flex gap-1.5 z-10">
            <button 
              title="Download Foto Produk"
              onClick={handleDownload} 
              className="p-2 bg-white/90 text-emerald-600 rounded-xl shadow-lg hover:scale-110 transition-all cursor-pointer"
            >
              <Download size={15} />
            </button>
            <button 
              title="Bagikan Link Produk"
              onClick={handleShare} 
              className="p-2 bg-white/90 text-sky-blue rounded-xl shadow-lg hover:scale-110 transition-all cursor-pointer"
            >
              <Share2 size={15} />
            </button>
            <button onClick={onEdit} title="Edit Produk" className="p-2 bg-white/90 text-tea-main rounded-xl shadow-lg hover:scale-110 transition-all cursor-pointer">
              <Edit2 size={15} />
            </button>
            <button onClick={onDelete} title="Hapus Produk" className="p-2 bg-white/90 text-red-500 rounded-xl shadow-lg hover:scale-110 transition-all cursor-pointer">
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-2">
          <Link to={`/product/${product.id}`}>
            <h4 className="font-bold text-black truncate hover:text-tea-main transition-colors text-sm">{product.name}</h4>
          </Link>
          <p className="text-tea-main font-bold text-sm">{formatPrice(product.price)}</p>
          
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="text-[10px] font-bold uppercase tracking-widest bg-black/5 px-2 py-0.5 rounded-lg text-black/50">
              {product.category}
            </span>
            <span className={cn(
              "text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border",
              isSold 
                ? "bg-red-50 text-red-600 border-red-200" 
                : isBooked
                  ? "bg-amber-50 text-amber-800 border-amber-300"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
            )}>
              {isSold ? "SOLD (0)" : isBooked ? "BOOKED" : "Stok: 1 (Ready)"}
            </span>
            {product.sizes && product.sizes.length > 0 && (
              <span className="text-[10px] font-black text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-lg">
                Size: {product.sizes.join(', ')}
              </span>
            )}
            {product.insoleLength && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-black text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-lg">
                <Ruler size={10} className="text-emerald-600" />
                {product.insoleLength.toLowerCase().includes('cm') ? product.insoleLength : `${product.insoleLength} cm`}
              </span>
            )}
            {product.youtubeUrl && getYouTubeVideoId(product.youtubeUrl) && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-lg">
                <Youtube size={11} className="text-red-600" />
                <span>Video</span>
              </span>
            )}
            <div className="flex items-center gap-1 text-[10px] font-bold text-black/30 uppercase tracking-widest ml-auto">
              <Eye size={10} />
              <span>{product.views || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Status Bar for Seller */}
      <div className="p-3 bg-black/[0.02] border-t border-black/5 flex items-center justify-between gap-1.5">
        <span className="text-[10px] font-bold text-black/50 uppercase tracking-wider">Status Cepat:</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onStatusChange?.('ready')}
            title="Setel ke Ready"
            className={cn(
              "px-2 py-1 rounded-lg text-[10px] font-black border transition-all flex items-center gap-0.5",
              !isSold && !isBooked 
                ? "bg-emerald-600 text-white border-emerald-700 shadow-xs" 
                : "bg-white text-black/60 border-black/10 hover:bg-black/5"
            )}
          >
            {!isSold && !isBooked && <Check size={10} />}
            Ready
          </button>
          <button
            type="button"
            onClick={() => onStatusChange?.('booked')}
            title="Setel ke Booked (Keep)"
            className={cn(
              "px-2 py-1 rounded-lg text-[10px] font-black border transition-all flex items-center gap-0.5",
              isBooked 
                ? "bg-amber-500 text-black border-amber-600 shadow-xs" 
                : "bg-white text-black/60 border-black/10 hover:bg-black/5"
            )}
          >
            {isBooked && <Check size={10} />}
            Booked
          </button>
          <button
            type="button"
            onClick={() => onStatusChange?.('sold')}
            title="Setel ke SOLD"
            className={cn(
              "px-2 py-1 rounded-lg text-[10px] font-black border transition-all flex items-center gap-0.5",
              isSold 
                ? "bg-red-600 text-white border-red-700 shadow-xs" 
                : "bg-white text-black/60 border-black/10 hover:bg-black/5"
            )}
          >
            {isSold && <Check size={10} />}
            SOLD
          </button>
        </div>
      </div>
    </div>
  );
}

function StoreForm({ store, onComplete }: { store?: Store, onComplete: () => void }) {
  const [formData, setFormData] = React.useState({
    name: store?.name || '',
    location: store?.location || '',
    description: store?.description || '',
    logo: store?.logo || ''
  });
  const [loading, setLoading] = React.useState(false);
  const [logoFile, setLogoFile] = React.useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let logoUrl = formData.logo;
      if (logoFile) {
        logoUrl = await uploadImage(logoFile, 'stores');
      }

      if (store) {
        await updateStore(store.id, { ...formData, logo: logoUrl });
      } else {
        await createStore({ ...formData, logo: logoUrl });
      }
      onComplete();
    } catch (error) {
      alert('Gagal menyimpan data toko');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="flex justify-center">
          <div className="relative group">
            <div className="w-24 h-24 rounded-3xl bg-black/5 flex items-center justify-center overflow-hidden border-2 border-dashed border-black/10 group-hover:border-tea-main transition-colors">
              {(logoFile || formData.logo) ? (
                <img src={logoFile ? URL.createObjectURL(logoFile) : formData.logo} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon size={32} className="text-black/20" />
              )}
            </div>
            <input 
              type="file" 
              accept="image/*,.heic,.heif,.HEIC,.HEIF" 
              className="absolute inset-0 opacity-0 cursor-pointer" 
              onChange={async (e) => {
                const file = e.target.files?.[0] || null;
                if (file && isHeicFile(file)) {
                  try {
                    const converted = await convertHeicToJpeg(file);
                    setLogoFile(converted);
                  } catch (err) {
                    setLogoFile(file);
                  }
                } else {
                  setLogoFile(file);
                }
              }}
            />
            <div className="absolute -bottom-2 -right-2 bg-tea-main text-white p-2 rounded-xl shadow-lg">
              <Plus size={16} />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-black/40 ml-2">Nama Toko</label>
          <div className="relative">
            <StoreIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20" size={18} />
            <input
              required
              className="w-full bg-black/5 border-2 border-transparent focus:border-tea-main rounded-2xl pl-12 pr-4 py-4 text-sm transition-all text-black"
              placeholder="Contoh: Esteh Gadget Official"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-black/40 ml-2">Lokasi</label>
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20" size={18} />
            <input
              required
              className="w-full bg-black/5 border-2 border-transparent focus:border-tea-main rounded-2xl pl-12 pr-4 py-4 text-sm transition-all text-black"
              placeholder="Contoh: Jakarta Selatan"
              value={formData.location}
              onChange={e => setFormData({ ...formData, location: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-black/40 ml-2">Deskripsi Toko</label>
          <textarea
            required
            className="w-full bg-black/5 border-2 border-transparent focus:border-tea-main rounded-2xl p-4 text-sm transition-all text-black min-h-[100px]"
            placeholder="Ceritakan tentang toko Anda..."
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-tea-main text-white py-4 rounded-2xl font-bold hover:scale-[1.02] transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
        {store ? 'Simpan Perubahan' : 'Buka Toko'}
      </button>
    </form>
  );
}

function ProductForm({ storeId, initialData, onComplete }: { storeId: string, initialData?: Product, onComplete: (id?: string) => void }) {
  const [sizeInput, setSizeInput] = React.useState<string>(
    initialData?.sizes && initialData.sizes.length > 0 ? initialData.sizes.join(', ') : ''
  );
  const [autoWatermark, setAutoWatermark] = React.useState(true);
  const [formData, setFormData] = React.useState({
    name: initialData?.name || '',
    price: initialData?.price || 0,
    stock: initialData?.stock !== undefined ? (initialData.stock === 0 ? 0 : 1) : 1,
    category: initialData?.category || 'sepatu',
    brand: initialData?.brand || 'Nike',
    shoeModel: initialData?.shoeModel || 'Sepatu Kasual / Lifestyle',
    shoeType: initialData?.shoeType || 'Sneakers Low-top',
    sizes: initialData?.sizes || [],
    insoleLength: initialData?.insoleLength || '',
    isBooked: initialData?.isBooked || false,
    bookedBy: initialData?.bookedBy || '',
    youtubeUrl: initialData?.youtubeUrl || '',
    description: initialData?.description || '',
    specifications: Array.isArray(initialData?.specifications) 
      ? initialData.specifications.join('\n') 
      : (typeof initialData?.specifications === 'string' ? initialData.specifications : ''),
    images: initialData?.images || []
  });
  const [loading, setLoading] = React.useState(false);
  const [watermarkingStatus, setWatermarkingStatus] = React.useState<string | null>(null);
  const [imageFiles, setImageFiles] = React.useState<File[]>([]);
  const [isAutoGenerated, setIsAutoGenerated] = React.useState(false);
  const [isConvertingHeic, setIsConvertingHeic] = React.useState(false);

  const handleSizeInputChange = (val: string) => {
    setSizeInput(val);
    const parsed = val.split(/[,;]+/).map(s => s.trim()).filter(Boolean);
    setFormData(prev => ({ ...prev, sizes: parsed }));
  };

  // Get current sub-types based on selected model
  const selectedModelData = React.useMemo(() => {
    return SHOE_MODELS.find(m => m.id === formData.shoeModel) || SHOE_MODELS[0];
  }, [formData.shoeModel]);

  const handleAutoGenerate = (productName: string, forceOverride = false) => {
    if (!productName.trim()) return;
    const generated = generateShoeDetails(
      productName,
      formData.brand,
      formData.shoeModel,
      formData.shoeType
    );

    const newSizes = (formData.sizes && formData.sizes.length > 0 && !forceOverride) 
      ? formData.sizes 
      : (generated.suggestedSizes ? [generated.suggestedSizes[0]] : []);

    if (newSizes.length > 0 && (!sizeInput.trim() || forceOverride)) {
      setSizeInput(newSizes.join(', '));
    }

    setFormData(prev => ({
      ...prev,
      brand: generated.suggestedBrand || prev.brand,
      shoeModel: generated.suggestedModel || prev.shoeModel,
      shoeType: generated.suggestedType || prev.shoeType,
      sizes: newSizes,
      description: (prev.description && !forceOverride) ? prev.description : generated.description,
      specifications: (prev.specifications && !forceOverride) ? prev.specifications : generated.specifications.join('\n')
    }));

    setIsAutoGenerated(true);
    setTimeout(() => setIsAutoGenerated(false), 3000);
  };

  const handleNameChange = (val: string) => {
    setFormData(prev => {
      const updated = { ...prev, name: val };
      if (val.trim().length > 3 && (!prev.description || prev.description.trim() === '')) {
        const generated = generateShoeDetails(val, prev.brand, prev.shoeModel, prev.shoeType);
        updated.brand = generated.suggestedBrand || prev.brand;
        updated.shoeModel = generated.suggestedModel || prev.shoeModel;
        updated.shoeType = generated.suggestedType || prev.shoeType;
        updated.description = generated.description;
        updated.specifications = generated.specifications.join('\n');
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let finalImages = [...formData.images];
      if (imageFiles.length > 0) {
        setWatermarkingStatus(
          autoWatermark
            ? 'Memberi watermark & mengompres foto produk...'
            : 'Mengunggah & mengompres foto produk...'
        );
        const watermarkText = autoWatermark ? 'E STORE THRIFT • MAJALENGKA' : undefined;
        const uploaded = await Promise.all(
          imageFiles.map(async (f) => {
            try {
              return await uploadImage(f, 'products', { watermarkText });
            } catch (err) {
              console.warn('Gagal upload gambar tertentu, gunakan fallback aman:', err);
              return 'https://picsum.photos/seed/estehanget/800/600';
            }
          })
        );
        finalImages = [...finalImages, ...uploaded].slice(0, 6);
      } else {
        finalImages = finalImages.slice(0, 6);
      }

      if (finalImages.length === 0) {
        finalImages = [`https://picsum.photos/seed/${formData.name}/800/600`];
      }

      const specs = typeof formData.specifications === 'string' 
        ? formData.specifications.split('\n').filter(s => s.trim()) 
        : (Array.isArray(formData.specifications) ? formData.specifications : []);

      const parsedSizes = sizeInput.split(/[,;]+/).map(s => s.trim()).filter(Boolean);
      const finalSizes = parsedSizes.length > 0 ? parsedSizes : (formData.sizes.length > 0 ? formData.sizes : ['42']);

      const productData = {
        ...formData,
        sizes: finalSizes,
        insoleLength: formData.insoleLength.trim(),
        isBooked: formData.isBooked,
        bookedBy: formData.bookedBy.trim(),
        storeId,
        images: finalImages,
        specifications: specs,
        youtubeUrl: formData.youtubeUrl.trim()
      };

      setWatermarkingStatus('Mengompres foto & menyimpan ke database...');
      let newId = '';
      if (initialData?.id) {
        await updateProduct(initialData.id, productData);
      } else {
        newId = await addProduct(productData as any);
      }
      onComplete(newId);
    } catch (error: any) {
      console.error("Error saving product:", error);
      alert('Gagal menyimpan produk: ' + (error?.message || 'Terjadi kesalahan'));
    } finally {
      setLoading(false);
      setWatermarkingStatus(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-black/40">Foto Produk</label>
            <div className="grid grid-cols-3 gap-2">
              {formData.images.map((img, i) => (
                <div key={i} className="aspect-square relative rounded-xl overflow-hidden border border-black/5">
                  <img src={img} alt="Product" className="w-full h-full object-cover" />
                  <button 
                    type="button"
                    onClick={() => setFormData({ ...formData, images: formData.images.filter((_, idx) => idx !== i) })}
                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-lg"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              <div className="aspect-square relative bg-black/5 rounded-xl flex items-center justify-center border-2 border-dashed border-black/10 hover:border-tea-main transition-colors cursor-pointer">
                <Plus size={24} className="text-black/20" />
                <input 
                  type="file" 
                  multiple 
                  accept="image/*,.heic,.heif,.HEIC,.HEIF" 
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={async (e) => {
                    const rawFiles: File[] = Array.from(e.target.files || []);
                    if (rawFiles.length === 0) return;

                    const maxAllowed = Math.max(0, 6 - formData.images.length);
                    if (imageFiles.length + rawFiles.length > maxAllowed) {
                      alert(`Maksimal 6 foto produk agar performa toko tetap cepat. Maksimal ${maxAllowed} foto baru dapat ditambahkan.`);
                    }
                    const selected = rawFiles.slice(0, maxAllowed);
                    const hasHeic = selected.some(f => isHeicFile(f));
                    if (hasHeic) {
                      setIsConvertingHeic(true);
                    }
                    try {
                      const processed = await Promise.all(
                        selected.map(f => isHeicFile(f) ? convertHeicToJpeg(f) : f)
                      );
                      setImageFiles(prev => [...prev, ...processed].slice(0, maxAllowed));
                    } catch (err) {
                      console.warn('Gagal memproses file gambar:', err);
                      setImageFiles(prev => [...prev, ...selected].slice(0, maxAllowed));
                    } finally {
                      setIsConvertingHeic(false);
                      e.target.value = '';
                    }
                  }}
                />
              </div>
            </div>

            {isConvertingHeic && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 text-xs font-semibold animate-pulse">
                <Loader2 size={16} className="animate-spin text-blue-600" />
                <span>Mengonversi foto iPhone (HEIC) ke format web (JPEG)...</span>
              </div>
            )}
            {imageFiles.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <p className="text-xs text-tea-main font-bold">
                  {imageFiles.length} foto baru dipilih (siap diupload):
                </p>
                <div className="flex flex-wrap gap-2">
                  {imageFiles.map((f, idx) => (
                    <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-emerald-500 bg-black/5 shadow-xs">
                      <img 
                        src={URL.createObjectURL(f)} 
                        alt="Preview baru" 
                        className="w-full h-full object-cover"
                        onLoad={(e) => {
                          try {
                            URL.revokeObjectURL((e.target as HTMLImageElement).src);
                          } catch (err) {
                            // ignore
                          }
                        }}
                      />
                      <span className="absolute bottom-0 inset-x-0 bg-emerald-600/90 text-[8px] font-black text-white text-center py-0.5 uppercase">
                        Baru
                      </span>
                      <button
                        type="button"
                        onClick={() => setImageFiles(imageFiles.filter((_, i) => i !== idx))}
                        className="absolute top-0.5 right-0.5 bg-red-600 text-white rounded-md p-0.5 shadow-sm hover:scale-110 transition-all"
                        title="Batal upload foto ini"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Auto Watermark Checkbox */}
            <label className="flex items-center gap-2.5 p-2.5 bg-tea-light/10 border border-tea-main/20 rounded-xl cursor-pointer hover:bg-tea-light/20 transition-all">
              <input
                type="checkbox"
                checked={autoWatermark}
                onChange={e => setAutoWatermark(e.target.checked)}
                className="w-4 h-4 text-tea-main rounded border-black/20 focus:ring-tea-main cursor-pointer"
              />
              <div className="flex items-center gap-1.5 text-xs font-bold text-black/80">
                <Stamp size={14} className="text-tea-main" />
                <span>Beri Watermark Otomatis ("E STORE THRIFT • MAJALENGKA")</span>
              </div>
            </label>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-widest text-black/40">Nama Produk</label>
              <button
                type="button"
                onClick={() => handleAutoGenerate(formData.name, true)}
                className="text-[11px] font-extrabold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 transition-all active:scale-95"
              >
                <Sparkles size={12} className="text-amber-500" />
                Auto-Generate Detail
              </button>
            </div>
            <input
              required
              placeholder="Contoh: Nike Air Jordan 1 Low White Black"
              className="w-full bg-black/5 border-2 border-transparent focus:border-tea-main rounded-2xl px-4 py-4 text-sm transition-all text-black font-medium"
              value={formData.name}
              onChange={e => handleNameChange(e.target.value)}
            />
            {isAutoGenerated && (
              <p className="text-[11px] font-bold text-green-600 flex items-center gap-1 animate-bounce">
                ✨ Deskripsi & spesifikasi otomatis terisi sesuai nama produk!
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-black/40">Harga (Rp)</label>
            <div className="relative">
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20" size={18} />
              <input
                required
                type="number"
                className="w-full bg-black/5 border-2 border-transparent focus:border-tea-main rounded-2xl pl-12 pr-4 py-4 text-sm transition-all text-black font-medium"
                value={formData.price}
                onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-widest text-black/40">Stok Barang</label>
              <span className="text-[10px] font-black uppercase tracking-wider bg-tea-main/10 text-tea-main px-2.5 py-0.5 rounded-full">
                Sistem 1 Barang (Stok: 1)
              </span>
            </div>
            <div className="relative">
              <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20" size={18} />
              <input
                required
                type="number"
                min="0"
                max="1"
                className="w-full bg-black/5 border-2 border-transparent focus:border-tea-main rounded-2xl pl-12 pr-4 py-4 text-sm transition-all text-black font-bold"
                value={formData.stock}
                onChange={e => {
                  const val = Math.max(0, Math.min(1, Number(e.target.value)));
                  setFormData({ ...formData, stock: val });
                }}
              />
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, stock: 1 })}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5",
                  formData.stock === 1 
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-sm" 
                    : "bg-white text-black/60 border-black/10 hover:border-black/20"
                )}
              >
                <span>✓ Tersedia (Stok: 1)</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, stock: 0 })}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5",
                  formData.stock === 0 
                    ? "bg-red-600 text-white border-red-600 shadow-sm" 
                    : "bg-white text-black/60 border-black/10 hover:border-black/20"
                )}
              >
                <span>✕ Terjual / SOLD (Stok: 0)</span>
              </button>
            </div>
            <p className="text-[11px] text-black/50">
              *Toko menggunakan sistem 1 pasang/barang unik. Pilih <strong>Stok: 1</strong> jika barang siap dijual, atau <strong>Stok: 0</strong> jika sudah terjual (SOLD).
            </p>

            {/* Status Booking / Keep */}
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-2.5">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isBooked}
                  onChange={e => setFormData({ ...formData, isBooked: e.target.checked })}
                  className="w-4 h-4 text-amber-600 rounded border-black/20 focus:ring-amber-500 cursor-pointer"
                />
                <span className="text-xs font-bold text-amber-950">
                  Tandai Sedang di-Book / Keep oleh Pembeli (Tahan Barang)
                </span>
              </label>
              {formData.isBooked && (
                <div className="pt-1 space-y-1">
                  <input
                    type="text"
                    placeholder="Nama / Nomor WA pembeli yang booking (opsional)..."
                    className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs font-medium text-black placeholder:text-black/30"
                    value={formData.bookedBy || ''}
                    onChange={e => setFormData({ ...formData, bookedBy: e.target.value })}
                  />
                  <p className="text-[10px] text-amber-900/70">
                    *Produk tetap terlihat di etalase dengan label "BOOKED", memberi kesempatan calon pembeli lain untuk mengantre jika booking batal.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Input Ukuran / Size Sepatu */}
          <div className="space-y-2.5 p-4 bg-black/5 rounded-2xl border border-black/5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-widest text-black/70 flex items-center gap-1.5">
                <Ruler size={15} className="text-blue-600" />
                Ukuran / Size Sepatu (Input Langsung)
              </label>
              <span className="text-[10px] font-bold text-black/50 bg-white px-2 py-0.5 rounded-md border border-black/10">
                Wajib Diisi
              </span>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Ketik ukuran sepatu (Contoh: 42,5 atau 41,5 atau 42)..."
                className="w-full bg-white border-2 border-black/10 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl px-4 py-3 text-sm font-bold text-black placeholder:text-black/30 transition-all"
                value={sizeInput}
                onChange={e => handleSizeInputChange(e.target.value)}
              />
            </div>

            {/* Quick Suggestion Chips */}
            <div className="space-y-1.5 pt-1">
              <p className="text-[11px] font-medium text-black/50">
                Pilih cepat atau ketik langsung di atas (mendukung ukuran pecahan seperti 41,5 / 42,5):
              </p>
              <div className="flex flex-wrap gap-1.5">
                {['38', '38,5', '39', '39,5', '40', '40,5', '41', '41,5', '42', '42,5', '43', '43,5', '44', '44,5', '45'].map(sz => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => handleSizeInputChange(sz)}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-bold transition-all border",
                      sizeInput.trim() === sz
                        ? "bg-black text-white border-black shadow-xs scale-105"
                        : "bg-white text-black/70 border-black/10 hover:border-black/30 hover:bg-black/5"
                    )}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            {formData.sizes.length > 0 ? (
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] font-bold text-black/60">Size Terdaftar:</span>
                <div className="flex flex-wrap gap-1">
                  {formData.sizes.map((s, idx) => (
                    <span key={idx} className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded text-xs font-black">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-[10px] text-orange-600 font-medium">
                *Belum ada size yang diinput (silakan ketik ukuran sepatu, misal: 42,5)
              </p>
            )}

            <p className="text-[11px] text-black/50 pt-1 border-t border-black/5">
              *Catatan Sistem: Produk dengan size <strong>42,5</strong> akan otomatis muncul saat pembeli memfilter size <strong>42</strong>. Begitu juga size <strong>41,5</strong> akan otomatis muncul di filter size <strong>41</strong>, dan seterusnya.
            </p>
          </div>

          {/* Input Panjang Insole (cm) */}
          <div className="space-y-2.5 p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200/80">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-widest text-emerald-900 flex items-center gap-1.5">
                <Ruler size={15} className="text-emerald-700" />
                Panjang Insole (cm)
              </label>
              <span className="text-[10px] font-bold text-emerald-800 bg-white px-2 py-0.5 rounded-md border border-emerald-200">
                Penting untuk Thrift
              </span>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Contoh: 26.5 cm atau 27 cm..."
                className="w-full bg-white border-2 border-emerald-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 rounded-xl px-4 py-3 text-sm font-bold text-black placeholder:text-black/30 transition-all"
                value={formData.insoleLength || ''}
                onChange={e => setFormData({ ...formData, insoleLength: e.target.value })}
              />
            </div>

            {/* Quick Insole Suggestion Chips */}
            <div className="space-y-1.5 pt-1">
              <p className="text-[11px] font-medium text-emerald-900/70">
                Pilih cepat panjang insole:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {['24 cm', '24.5 cm', '25 cm', '25.5 cm', '26 cm', '26.5 cm', '27 cm', '27.5 cm', '28 cm', '28.5 cm', '29 cm'].map(ins => (
                  <button
                    key={ins}
                    type="button"
                    onClick={() => setFormData({ ...formData, insoleLength: ins })}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-bold transition-all border",
                      formData.insoleLength === ins
                        ? "bg-emerald-700 text-white border-emerald-700 shadow-xs"
                        : "bg-white text-emerald-900 border-emerald-200 hover:bg-emerald-100/50"
                    )}
                  >
                    {ins}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-[11px] text-emerald-800/80 pt-1 border-t border-emerald-200/50">
              *Panjang insole membantu pembeli sepatu thrift memastikan ukuran pas di kaki tanpa khawatir standar ukuran antar brand berbeda.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-black/40">Kategori Utama</label>
            <select
              className="w-full bg-black/5 border-2 border-transparent focus:border-tea-main rounded-2xl px-4 py-4 text-sm transition-all text-black font-medium appearance-none"
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value as any })}
            >
              <option value="sepatu">Sepatu</option>
              <option value="pakaian">Pakaian</option>
              <option value="gadget">Gadget</option>
              <option value="digital">Digital Product</option>
            </select>
          </div>

          {/* Brand & Model Sepatu (If Category is Sepatu or always allowed) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-tea-light/10 border border-tea-main/20 rounded-2xl space-y-2 sm:space-y-0">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-black/60">Brand Sepatu</label>
              <select
                className="w-full bg-white border border-black/10 rounded-xl px-3 py-2 text-xs font-bold text-black"
                value={formData.brand}
                onChange={e => setFormData({ ...formData, brand: e.target.value })}
              >
                {SHOE_BRANDS.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-black/60">Kategori Model</label>
              <select
                className="w-full bg-white border border-black/10 rounded-xl px-3 py-2 text-xs font-bold text-black"
                value={formData.shoeModel}
                onChange={e => {
                  const newModel = e.target.value;
                  const newModelData = SHOE_MODELS.find(m => m.id === newModel);
                  setFormData({ 
                    ...formData, 
                    shoeModel: newModel,
                    shoeType: newModelData?.subTypes[0] || ''
                  });
                }}
              >
                {SHOE_MODELS.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2 space-y-1 pt-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-black/60">Tipe / Sub-Kategori</label>
              <select
                className="w-full bg-white border border-black/10 rounded-xl px-3 py-2 text-xs font-bold text-black"
                value={formData.shoeType}
                onChange={e => setFormData({ ...formData, shoeType: e.target.value })}
              >
                {selectedModelData.subTypes.map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-black/40">Deskripsi</label>
            <textarea
              required
              className="w-full bg-black/5 border-2 border-transparent focus:border-tea-main rounded-2xl p-4 text-sm transition-all text-black min-h-[90px]"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-black/40">Spesifikasi (Satu per baris)</label>
            <textarea
              className="w-full bg-black/5 border-2 border-transparent focus:border-tea-main rounded-2xl p-4 text-sm transition-all text-black min-h-[90px]"
              placeholder="Contoh:&#10;Bahan: Real Leather&#10;Sol: Rubber Waffle&#10;Ukuran: 39 - 44"
              value={formData.specifications}
              onChange={e => setFormData({ ...formData, specifications: e.target.value })}
            />
          </div>

          {/* Video Preview YouTube */}
          <div className="space-y-3 p-4 bg-red-50/50 border border-red-200/80 rounded-2xl">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-widest text-red-700 flex items-center gap-1.5">
                <Youtube size={16} className="text-red-600 fill-red-600/20" /> Link Video Preview YouTube (Opsional)
              </label>
              {formData.youtubeUrl && (
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, youtubeUrl: '' })}
                  className="text-[11px] font-bold text-red-500 hover:text-red-700"
                >
                  Hapus Link
                </button>
              )}
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Contoh: https://www.youtube.com/watch?v=... atau https://youtu.be/..."
                className="w-full bg-white border border-red-200 focus:border-red-500 rounded-xl pl-3.5 pr-9 py-2.5 text-xs font-medium text-black placeholder:text-black/30 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all"
                value={formData.youtubeUrl}
                onChange={e => setFormData({ ...formData, youtubeUrl: e.target.value })}
              />
              <Youtube size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500/50 pointer-events-none" />
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-black/50 font-medium">
              <span className="font-bold text-black/70">Mendukung:</span>
              <span className="bg-white px-2 py-0.5 rounded border border-black/10">watch?v=...</span>
              <span className="bg-white px-2 py-0.5 rounded border border-black/10">youtu.be/...</span>
              <span className="bg-white px-2 py-0.5 rounded border border-black/10">shorts/...</span>
              <span className="bg-white px-2 py-0.5 rounded border border-black/10">ID Video (11 digit)</span>
            </div>

            {/* Live YouTube Player Preview */}
            {formData.youtubeUrl.trim() && (
              getYouTubeVideoId(formData.youtubeUrl) ? (
                <div className="space-y-2 pt-2 border-t border-red-200/60">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-green-700 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                      Video YouTube Valid & Siap Diputar di Halaman Produk
                    </span>
                    <span className="text-[11px] font-mono text-black/50">ID: {getYouTubeVideoId(formData.youtubeUrl)}</span>
                  </div>
                  <div className="aspect-video w-full rounded-xl overflow-hidden border border-black/10 shadow-sm bg-black">
                    <iframe
                      src={getYouTubeEmbedUrl(formData.youtubeUrl) || ''}
                      title="Preview Video Produk YouTube"
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              ) : (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px] font-medium flex items-center gap-2">
                  <span>⚠️ Format URL belum cocok. Pastikan menyalin link lengkap dari YouTube atau YouTube Shorts.</span>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-tea-main text-white py-4 rounded-2xl font-bold hover:scale-[1.02] transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
        {loading ? (watermarkingStatus || 'Menyimpan Produk...') : 'Simpan Produk'}
      </button>
    </form>
  );
}

function ImportLinkModal({ isOpen, onClose, onImport }: { isOpen: boolean, onClose: () => void, onImport: (data: any) => void }) {
  const [url, setUrl] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleImport = async () => {
    if (!url) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/extract-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Gagal mengekstrak data produk");
      }

      const data = await response.json();
      onImport(data);
      setUrl('');
      onClose();
    } catch (err: any) {
      console.error("Import failed:", err);
      const msg = err.message || "Unknown error";
      if (msg.includes("429") || msg.toLowerCase().includes("quota")) {
        setError("Batas pemakaian AI (Quota) telah habis untuk saat ini. Silakan coba lagi beberapa saat lagi.");
      } else {
        setError(`Error: ${msg.substring(0, 100)}... Silakan coba lagi.`);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 space-y-6"
      >
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-tea-main/10 rounded-2xl flex items-center justify-center mx-auto mb-2">
            <Sparkles size={32} className="text-tea-main" />
          </div>
          <h3 className="text-xl font-bold text-black">AI Product Importer</h3>
          <p className="text-sm text-black/60">Tempel link produk (Topedia/Shopee/dll) dan biarkan AI mengisi datanya otomatis.</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-black/40">Link Marketplace</label>
            <div className="relative">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20" size={18} />
              <input
                className="w-full bg-black/5 border-2 border-transparent focus:border-tea-main rounded-2xl pl-12 pr-4 py-4 text-sm transition-all text-black"
                placeholder="https://vt.tokopedia.com/t/ZS9Lb3J8ExMWB-wAO94/"
                value={url}
                onChange={e => setUrl(e.target.value)}
              />
            </div>
          </div>

          {error && <p className="text-xs text-red-500 font-bold text-center">{error}</p>}

          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="flex-1 py-4 text-black/40 font-bold hover:text-black transition-all"
            >
              Batal
            </button>
            <button 
              onClick={handleImport}
              disabled={loading || !url}
              className="flex-1 bg-tea-main text-white py-4 rounded-2xl font-bold hover:scale-[1.02] transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Wand2 size={20} />}
              Import
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

