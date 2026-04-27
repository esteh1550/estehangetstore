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
  Share2
} from 'lucide-react';
import { db, isFirebaseEnabled, auth, googleProvider } from '../lib/firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { 
  createStore, 
  updateStore, 
  getMyStore, 
  addProduct, 
  updateProduct, 
  deleteProduct, 
  getMyProducts,
  uploadImage,
  MAIN_STORE_ID
} from '../lib/sellerService';
import { Store, Product } from '../types';
import { cn, formatPrice } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { ADMIN_EMAIL, CONTACT_INFO } from '../constants';

export default function Seller() {
  const [store, setStore] = React.useState<Store | null>(null);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [authLoading, setAuthLoading] = React.useState(isFirebaseEnabled);
  const [isFirebaseAuthed, setIsFirebaseAuthed] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<'dashboard' | 'products' | 'settings'>('dashboard');
  const [isEditingStore, setIsEditingStore] = React.useState(false);
  const [isAddingProduct, setIsAddingProduct] = React.useState(false);
  const [isImportingLink, setIsImportingLink] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null);
  const [successProductId, setSuccessProductId] = React.useState<string | null>(null);
  
  const navigate = useNavigate();

  React.useEffect(() => {
    // Check local session
    const savedSession = localStorage.getItem('user_session');
    if (!savedSession) {
      navigate('/admin');
      return;
    }
    
    const user = JSON.parse(savedSession);
    if (user.email !== ADMIN_EMAIL) {
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
              name: 'ESTEHANGET Official',
              location: 'Jakarta Selatan',
              description: 'Toko resmi ESTEHANGET menyuguhkan berbagai produk gadget dan digital terbaik untuk Anda.',
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
        const isAuthed = !!u && u.email === ADMIN_EMAIL;
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
        <p className="text-black/40 dark:text-white/40 font-medium animate-pulse">
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
        <div className="w-20 h-20 bg-red-50 dark:bg-red-900/10 rounded-full flex items-center justify-center text-red-500">
          <X size={40} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-black dark:text-white">Waduh, Ada Masalah</h2>
          <p className="text-black/60 dark:text-white/60 max-w-md">{error}</p>
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
    <div className="min-h-screen bg-bg-light dark:bg-[#0a0a0a] pb-20 pt-28">
      {/* Header */}
      <div className="bg-white dark:bg-black border-b border-black/5 dark:border-white/5 sticky top-[88px] z-30">
      <div className="max-w-7xl mx-auto px-4 h-auto min-h-[4rem] py-2 md:h-16 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center overflow-hidden">
              {store?.logo ? (
                <img src={store.logo} alt={store.name} className="w-full h-full object-cover" />
              ) : (
                <StoreIcon className="text-black/20" size={20} />
              )}
            </div>
            <div>
              <h1 className="font-bold text-black dark:text-white">{store?.name || 'Toko Belum Siap'}</h1>
              <p className="text-[10px] text-black/40 dark:text-white/40 uppercase font-bold tracking-widest">
                Seller Center ({isFirebaseEnabled ? 'Cloud' : 'Lokal'})
              </p>
            </div>
          </div>
          {store && (
            <div className="flex bg-black/5 dark:bg-white/5 p-1 rounded-xl">
              <TabButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={16} />} label="Dashboard" />
              <TabButton active={activeTab === 'products'} onClick={() => setActiveTab('products')} icon={<Package size={16} />} label="Produk" />
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
                <h3 className="font-bold text-black dark:text-white">Sinkronisasi Cloud Diperlukan</h3>
                <p className="text-sm text-black/40 dark:text-white/40">Data toko ada di Database Cloud. Silakan login Google untuk melihat dan mengelola produk Anda.</p>
              </div>
            </div>
            <button 
              onClick={async () => {
                try {
                  setAuthLoading(true);
                  await signInWithPopup(auth!, googleProvider);
                  // Reload data after auth
                  window.location.reload();
                } catch (err) {
                  alert("Gagal sinkronisasi Cloud. Cek koneksi internet Anda.");
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
              <StatCard title="Status" value="Offline" icon={<Globe className="text-tea-main" />} />
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
                <h2 className="text-xl font-bold text-black dark:text-white">Daftar Produk</h2>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button 
                    onClick={() => setIsImportingLink(true)}
                    className="flex-1 sm:flex-none bg-black/5 dark:bg-white/10 text-black dark:text-white px-4 py-2 rounded-xl flex items-center justify-center gap-2 font-bold hover:bg-black/10 dark:hover:bg-white/20 transition-all border border-black/5 dark:border-white/5"
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
                    />
                  </div>
                ))}
                {products.length === 0 && (
                  <div className="col-span-full py-20 text-center bg-white dark:bg-black rounded-3xl border-2 border-dashed border-black/10 dark:border-white/10">
                    <Package size={48} className="mx-auto mb-4 opacity-20" />
                    <p className="text-black/40 dark:text-white/40 font-bold">Belum ada produk. Mulai jualan sekarang!</p>
                  </div>
                )}
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
              <div className="bg-white dark:bg-black p-8 rounded-3xl border border-black/5 dark:border-white/5 shadow-sm space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-black dark:text-white">Informasi Toko</h2>
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
                        <h3 className="text-2xl font-bold text-black dark:text-white">{store.name}</h3>
                        <p className="text-black/60 dark:text-white/60 flex items-center gap-1">
                          <MapPin size={14} />
                          {store.location}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-black/40 dark:text-white/40">Deskripsi Toko</h4>
                      <p className="text-black/80 dark:text-white/80 leading-relaxed">{store.description}</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        ) : (
          !authLoading && !isFirebaseAuthed && isFirebaseEnabled && (
            <div className="text-center py-20 bg-white dark:bg-black rounded-3xl border-2 border-dashed border-black/10 dark:border-white/10">
              <ShieldAlert size={48} className="mx-auto mb-4 opacity-20" />
              <p className="text-black/40 dark:text-white/40 font-bold px-6">Gagal memuat data toko. Pastikan Anda sudah memberikan otorisasi Cloud melalui tombol di atas.</p>
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
              className="relative w-full max-w-2xl bg-white dark:bg-[#1a1a1a] rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
                <h3 className="text-xl font-bold text-black dark:text-white">
                  {editingProduct?.id ? 'Edit Produk' : 'Tambah Produk Baru'}
                </h3>
                <button onClick={() => { setIsAddingProduct(false); setEditingProduct(null); }} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full">
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
              className="relative w-full max-w-sm bg-white dark:bg-[#1a1a1a] rounded-3xl shadow-2xl overflow-hidden p-8 text-center space-y-6"
            >
              <div className="w-20 h-20 bg-tea-main/10 rounded-full flex items-center justify-center mx-auto text-tea-main">
                <Package size={40} />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-black dark:text-white">Produk Terbit!</h2>
                <p className="text-sm text-black/60 dark:text-white/60">Produk Anda sudah aktif dan bisa dilihat oleh pelanggan di Marketplace.</p>
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
                  className="bg-black/5 dark:bg-white/5 text-black dark:text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 text-sm hover:bg-black/10 dark:hover:bg-white/10"
                >
                  <Share2 size={16} /> Salin Link Produk
                </button>
                <button 
                  onClick={() => setSuccessProductId(null)}
                  className="text-black/40 dark:text-white/40 font-bold py-2 text-sm hover:text-black dark:hover:text-white transition-colors"
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
          ? "bg-white dark:bg-black text-tea-main shadow-sm" 
          : "text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white"
      )}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function StatCard({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-black p-6 rounded-3xl border border-black/5 dark:border-white/5 shadow-sm space-y-4">
      <div className="w-10 h-10 rounded-xl bg-tea-main/10 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-black/40 dark:text-white/40">{title}</p>
        <p className="text-2xl font-bold text-black dark:text-white">{value}</p>
      </div>
    </div>
  );
}

function ProductItem({ product, onEdit, onDelete }: { product: Product, onEdit: () => void, onDelete: () => void }) {
  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/product/${product.id}`;
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: `Cek ${product.name} di ESTEHANGET!`,
        url: url
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(url);
      alert('Link produk berhasil disalin!');
    }
  };

  return (
    <div className="bg-white dark:bg-black rounded-3xl border border-black/5 dark:border-white/5 overflow-hidden group shadow-sm">
      <div className="aspect-video relative overflow-hidden">
        <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
        <div className="absolute top-4 right-4 flex gap-2">
          <button 
            title="Bagikan Link Produk"
            onClick={handleShare} 
            className="p-2 bg-white/90 dark:bg-black/90 text-sky-blue rounded-xl shadow-lg hover:scale-110 transition-all"
          >
            <Share2 size={16} />
          </button>
          <button onClick={onEdit} className="p-2 bg-white/90 dark:bg-black/90 text-tea-main rounded-xl shadow-lg hover:scale-110 transition-all">
            <Edit2 size={16} />
          </button>
          <button onClick={onDelete} className="p-2 bg-white/90 dark:bg-black/90 text-red-500 rounded-xl shadow-lg hover:scale-110 transition-all">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      <div className="p-4 space-y-2">
        <Link to={`/product/${product.id}`}>
          <h4 className="font-bold text-black dark:text-white truncate hover:text-tea-main transition-colors">{product.name}</h4>
        </Link>
        <p className="text-tea-main font-bold">{formatPrice(product.price)}</p>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest bg-black/5 dark:bg-white/5 px-2 py-1 rounded-lg text-black/40 dark:text-white/40">
            {product.category}
          </span>
          <div className="flex items-center gap-1 text-[10px] font-bold text-black/30 dark:text-white/30 uppercase tracking-widest">
            <Eye size={10} />
            <span>{product.views || 0} views</span>
          </div>
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
            <div className="w-24 h-24 rounded-3xl bg-black/5 dark:bg-white/5 flex items-center justify-center overflow-hidden border-2 border-dashed border-black/10 dark:border-white/10 group-hover:border-tea-main transition-colors">
              {(logoFile || formData.logo) ? (
                <img src={logoFile ? URL.createObjectURL(logoFile) : formData.logo} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon size={32} className="text-black/20 dark:text-white/20" />
              )}
            </div>
            <input 
              type="file" 
              accept="image/*" 
              className="absolute inset-0 opacity-0 cursor-pointer" 
              onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
            />
            <div className="absolute -bottom-2 -right-2 bg-tea-main text-white p-2 rounded-xl shadow-lg">
              <Plus size={16} />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-black/40 dark:text-white/40 ml-2">Nama Toko</label>
          <div className="relative">
            <StoreIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20" size={18} />
            <input
              required
              className="w-full bg-black/5 dark:bg-white/5 border-2 border-transparent focus:border-tea-main rounded-2xl pl-12 pr-4 py-4 text-sm transition-all text-black dark:text-white"
              placeholder="Contoh: Esteh Gadget Official"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-black/40 dark:text-white/40 ml-2">Lokasi</label>
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20" size={18} />
            <input
              required
              className="w-full bg-black/5 dark:bg-white/5 border-2 border-transparent focus:border-tea-main rounded-2xl pl-12 pr-4 py-4 text-sm transition-all text-black dark:text-white"
              placeholder="Contoh: Jakarta Selatan"
              value={formData.location}
              onChange={e => setFormData({ ...formData, location: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-black/40 dark:text-white/40 ml-2">Deskripsi Toko</label>
          <textarea
            required
            className="w-full bg-black/5 dark:bg-white/5 border-2 border-transparent focus:border-tea-main rounded-2xl p-4 text-sm transition-all text-black dark:text-white min-h-[100px]"
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
  const [formData, setFormData] = React.useState({
    name: initialData?.name || '',
    price: initialData?.price || 0,
    stock: initialData?.stock || 0,
    category: initialData?.category || 'gadget',
    description: initialData?.description || '',
    specifications: Array.isArray(initialData?.specifications) 
      ? initialData.specifications.join('\n') 
      : (typeof initialData?.specifications === 'string' ? initialData.specifications : ''),
    images: initialData?.images || []
  });
  const [loading, setLoading] = React.useState(false);
  const [imageFiles, setImageFiles] = React.useState<File[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let finalImages = [...formData.images];
      if (imageFiles.length > 0) {
        const uploaded = await Promise.all(imageFiles.map(f => uploadImage(f, 'products')));
        finalImages = [...finalImages, ...uploaded];
      }

      if (finalImages.length === 0) {
        finalImages = [`https://picsum.photos/seed/${formData.name}/800/600`];
      }

      const specs = typeof formData.specifications === 'string' 
        ? formData.specifications.split('\n').filter(s => s.trim()) 
        : (Array.isArray(formData.specifications) ? formData.specifications : []);

      const productData = {
        ...formData,
        storeId,
        images: finalImages,
        specifications: specs
      };

      let newId = '';
      if (initialData?.id) {
        await updateProduct(initialData.id, productData);
      } else {
        newId = await addProduct(productData as any);
      }
      onComplete(newId);
    } catch (error) {
      alert('Gagal menyimpan produk');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-black/40 dark:text-white/40">Foto Produk</label>
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
              <div className="aspect-square relative bg-black/5 dark:bg-white/5 rounded-xl flex items-center justify-center border-2 border-dashed border-black/10 dark:border-white/10 hover:border-tea-main transition-colors cursor-pointer">
                <Plus size={24} className="text-black/20" />
                <input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={(e) => setImageFiles([...imageFiles, ...Array.from(e.target.files || [])])}
                />
              </div>
            </div>
            {imageFiles.length > 0 && (
              <p className="text-xs text-tea-main font-bold">{imageFiles.length} foto baru akan diupload</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-black/40 dark:text-white/40">Nama Produk</label>
            <input
              required
              className="w-full bg-black/5 dark:bg-white/5 border-2 border-transparent focus:border-tea-main rounded-2xl px-4 py-4 text-sm transition-all text-black dark:text-white"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-black/40 dark:text-white/40">Harga</label>
            <div className="relative">
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20" size={18} />
              <input
                required
                type="number"
                className="w-full bg-black/5 dark:bg-white/5 border-2 border-transparent focus:border-tea-main rounded-2xl pl-12 pr-4 py-4 text-sm transition-all text-black dark:text-white"
                value={formData.price}
                onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-black/40 dark:text-white/40">Stok Barang</label>
            <div className="relative">
              <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20" size={18} />
              <input
                required
                type="number"
                className="w-full bg-black/5 dark:bg-white/5 border-2 border-transparent focus:border-tea-main rounded-2xl pl-12 pr-4 py-4 text-sm transition-all text-black dark:text-white"
                value={formData.stock}
                onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-black/40 dark:text-white/40">Kategori</label>
            <select
              className="w-full bg-black/5 dark:bg-white/5 border-2 border-transparent focus:border-tea-main rounded-2xl px-4 py-4 text-sm transition-all text-black dark:text-white appearance-none"
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value as any })}
            >
              <option value="gadget">Gadget</option>
              <option value="pakaian">Pakaian</option>
              <option value="sepatu">Sepatu</option>
              <option value="digital">Digital Product</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-black/40 dark:text-white/40">Deskripsi</label>
            <textarea
              required
              className="w-full bg-black/5 dark:bg-white/5 border-2 border-transparent focus:border-tea-main rounded-2xl p-4 text-sm transition-all text-black dark:text-white min-h-[100px]"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-black/40 dark:text-white/40">Spesifikasi (Satu per baris)</label>
            <textarea
              className="w-full bg-black/5 dark:bg-white/5 border-2 border-transparent focus:border-tea-main rounded-2xl p-4 text-sm transition-all text-black dark:text-white min-h-[100px]"
              placeholder="Contoh:&#10;RAM 8GB&#10;Layar AMOLED&#10;Baterai 5000mAh"
              value={formData.specifications}
              onChange={e => setFormData({ ...formData, specifications: e.target.value })}
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-tea-main text-white py-4 rounded-2xl font-bold hover:scale-[1.02] transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
        Simpan Produk
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
        className="relative w-full max-w-md bg-white dark:bg-[#1a1a1a] rounded-3xl shadow-2xl p-8 space-y-6"
      >
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-tea-main/10 rounded-2xl flex items-center justify-center mx-auto mb-2">
            <Sparkles size={32} className="text-tea-main" />
          </div>
          <h3 className="text-xl font-bold text-black dark:text-white">AI Product Importer</h3>
          <p className="text-sm text-black/60 dark:text-white/60">Tempel link produk (Topedia/Shopee/dll) dan biarkan AI mengisi datanya otomatis.</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-black/40 dark:text-white/40">Link Marketplace</label>
            <div className="relative">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20" size={18} />
              <input
                className="w-full bg-black/5 dark:bg-white/5 border-2 border-transparent focus:border-tea-main rounded-2xl pl-12 pr-4 py-4 text-sm transition-all text-black dark:text-white"
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
              className="flex-1 py-4 text-black/40 dark:text-white/40 font-bold hover:text-black dark:hover:text-white transition-all"
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
