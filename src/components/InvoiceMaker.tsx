import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, Printer, Share2, Copy, Plus, Trash2, CheckCircle2, 
  Clock, AlertCircle, RefreshCw, Download, ArrowLeft, Eye, Edit3, 
  Search, ShieldCheck, ShoppingCart, Truck, CreditCard, Building2, 
  User, MapPin, Phone, Calendar, Hash, Tag, Sparkles, Check, X,
  Save, RotateCcw
} from 'lucide-react';
import { InvoiceData, InvoiceItem, Product } from '../types';
import { OrderRecord } from '../lib/storage';
import { STORE, CONTACT_INFO } from '../constants';
import { formatPrice, cn } from '../lib/utils';
import { useToast } from './Toast';

// Indonesian number-to-words helper for official invoices
function numberToTerbilang(num: number): string {
  if (num === 0) return 'Nol Rupiah';
  const satuan = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];
  
  function convert(n: number): string {
    if (n < 12) return satuan[n];
    if (n < 20) return convert(n - 10) + ' Belas';
    if (n < 100) return convert(Math.floor(n / 10)) + ' Puluh' + (n % 10 !== 0 ? ' ' + convert(n % 10) : '');
    if (n < 200) return 'Seratus' + (n % 100 !== 0 ? ' ' + convert(n % 100) : '');
    if (n < 1000) return convert(Math.floor(n / 100)) + ' Ratus' + (n % 100 !== 0 ? ' ' + convert(n % 100) : '');
    if (n < 2000) return 'Seribu' + (n % 1000 !== 0 ? ' ' + convert(n % 1000) : '');
    if (n < 1000000) return convert(Math.floor(n / 1000)) + ' Ribu' + (n % 1000 !== 0 ? ' ' + convert(n % 1000) : '');
    if (n < 1000000000) return convert(Math.floor(n / 1000000)) + ' Juta' + (n % 1000000 !== 0 ? ' ' + convert(n % 1000000) : '');
    if (n < 1000000000000) return convert(Math.floor(n / 1000000000)) + ' Miliar' + (n % 1000000000 !== 0 ? ' ' + convert(n % 1000000000) : '');
    return convert(Math.floor(n / 1000000000000)) + ' Triliun' + (n % 1000000000000 !== 0 ? ' ' + convert(n % 1000000000000) : '');
  }

  return convert(Math.round(Math.abs(num))) + ' Rupiah';
}

function generateInvoiceNo(): string {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const rand = Math.floor(100 + Math.random() * 900);
  return `INV/ESTORE/${y}${m}${d}/${rand}`;
}

const DEFAULT_BANK_INFO = 'BCA: 123-456-7890 a/n E STORE OFFICIAL\nMandiri: 098-765-4321 a/n E STORE INDONESIA\nQRIS: Tersedia di Kasir / WhatsApp Admin';
const DEFAULT_NOTES = '1. Produk 100% Original & telah lolos verifikasi Quality Control.\n2. Garansi tukar ukuran (size) berlaku 2x24 jam sejak barang diterima (kondisi baru/tag utuh).\n3. Simpan nota ini sebagai bukti transaksi sah E STORE.';

interface InvoiceMakerProps {
  initialOrder?: OrderRecord | null;
  onClearInitialOrder?: () => void;
  allProducts?: Product[];
}

export default function InvoiceMaker({ initialOrder, onClearInitialOrder, allProducts = [] }: InvoiceMakerProps) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'create' | 'preview' | 'history'>('create');
  const [previewFormat, setPreviewFormat] = useState<'a4' | 'thermal'>('a4');
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [savedInvoices, setSavedInvoices] = useState<InvoiceData[]>([]);

  // Core Form State
  const [invoice, setInvoice] = useState<InvoiceData>(() => ({
    id: `inv_${Date.now()}`,
    invoiceNumber: generateInvoiceNo(),
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    storeName: 'E STORE Official',
    storeAddress: STORE.location || 'Majalengka, Jawa Barat, Indonesia',
    storePhone: CONTACT_INFO.whatsapp || '+6285179550150',
    storeEmail: 'official@estore.com',
    storeLogo: CONTACT_INFO.logo,
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    courier: 'JNE Regular',
    trackingNumber: '',
    items: [
      {
        id: `item_${Date.now()}`,
        name: 'Nike Air Jordan 1 Retro High OG',
        size: '42',
        condition: 'Baru (BNIB)',
        price: 450000,
        quantity: 1,
        discount: 0,
        subtotal: 450000
      }
    ],
    subtotal: 450000,
    shippingFee: 20000,
    discountAmount: 0,
    packingFee: 0,
    grandTotal: 470000,
    paidAmount: 470000,
    remainingAmount: 0,
    paymentMethod: 'Transfer BCA',
    bankAccountInfo: DEFAULT_BANK_INFO,
    paymentStatus: 'LUNAS',
    notes: DEFAULT_NOTES,
    adminName: 'Admin E STORE',
    createdAt: new Date().toISOString()
  }));

  // Load Saved Invoices
  useEffect(() => {
    try {
      const raw = localStorage.getItem('estore_saved_invoices');
      if (raw) {
        setSavedInvoices(JSON.parse(raw));
      }
    } catch (e) {
      console.error('Failed to load saved invoices', e);
    }
  }, []);

  // Sync if initialOrder is provided (Quick create invoice from customer order)
  useEffect(() => {
    if (initialOrder) {
      const items: InvoiceItem[] = initialOrder.items.map((it, idx) => ({
        id: `it_${idx}_${Date.now()}`,
        name: it.name,
        size: (it as any).selectedSize || '40',
        condition: it.name.toUpperCase().includes('SECOND') ? 'Preloved / Second' : 'Baru (Original)',
        price: it.price,
        quantity: it.quantity,
        discount: 0,
        subtotal: it.price * it.quantity
      }));

      const sub = items.reduce((s, i) => s + i.subtotal, 0);
      const isPaid = initialOrder.status === 'completed';

      setInvoice(prev => ({
        ...prev,
        id: `inv_from_order_${initialOrder.id}`,
        invoiceNumber: `INV/ESTORE/${initialOrder.id.slice(-6).toUpperCase()}`,
        date: initialOrder.createdAt ? new Date(initialOrder.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        customerName: initialOrder.customerName || '',
        customerPhone: initialOrder.customerPhone || '',
        customerAddress: initialOrder.address || '',
        courier: initialOrder.paymentMethod ? `Kurir (${initialOrder.paymentMethod})` : 'JNE Regular',
        items,
        subtotal: sub,
        shippingFee: Math.max(0, initialOrder.total - sub),
        discountAmount: 0,
        packingFee: 0,
        grandTotal: initialOrder.total,
        paidAmount: isPaid ? initialOrder.total : 0,
        remainingAmount: isPaid ? 0 : initialOrder.total,
        paymentStatus: isPaid ? 'LUNAS' : 'BELUM LUNAS',
        paymentMethod: initialOrder.paymentMethod || 'Transfer Bank',
        createdAt: new Date().toISOString()
      }));

      setActiveTab('preview');
      showToast(`Data pesanan ${initialOrder.customerName} berhasil dimuat ke Invoice Maker!`, 'success');
      
      if (onClearInitialOrder) {
        onClearInitialOrder();
      }
    }
  }, [initialOrder, onClearInitialOrder]);

  // Recalculate Totals whenever items or financial fields change
  const recalculateInvoice = (
    currentItems: InvoiceItem[], 
    ship: number = invoice.shippingFee, 
    disc: number = invoice.discountAmount,
    pack: number = invoice.packingFee || 0,
    paid: number = invoice.paidAmount,
    status: InvoiceData['paymentStatus'] = invoice.paymentStatus
  ) => {
    const updatedItems = currentItems.map(item => ({
      ...item,
      subtotal: Math.max(0, (item.price * item.quantity) - (item.discount || 0))
    }));

    const sub = updatedItems.reduce((sum, item) => sum + item.subtotal, 0);
    const grand = Math.max(0, sub + (ship || 0) + (pack || 0) - (disc || 0));
    
    let actualPaid = paid;
    let actualStatus = status;

    if (status === 'LUNAS') {
      actualPaid = grand;
    } else if (status === 'BELUM LUNAS') {
      actualPaid = 0;
    }

    const remaining = Math.max(0, grand - actualPaid);

    setInvoice(prev => ({
      ...prev,
      items: updatedItems,
      subtotal: sub,
      shippingFee: ship,
      discountAmount: disc,
      packingFee: pack,
      grandTotal: grand,
      paidAmount: actualPaid,
      remainingAmount: remaining,
      paymentStatus: actualStatus
    }));
  };

  // Item modifications
  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const updated = [...invoice.items];
    updated[index] = { ...updated[index], [field]: value };
    recalculateInvoice(updated);
  };

  const handleAddItem = () => {
    const newItem: InvoiceItem = {
      id: `item_${Date.now()}`,
      name: '',
      size: '40',
      condition: 'Baru (Original)',
      price: 0,
      quantity: 1,
      discount: 0,
      subtotal: 0
    };
    recalculateInvoice([...invoice.items, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    if (invoice.items.length <= 1) {
      showToast('Nota harus memiliki minimal 1 item barang.', 'error');
      return;
    }
    const updated = invoice.items.filter((_, i) => i !== index);
    recalculateInvoice(updated);
  };

  const handleSelectProductFromCatalog = (product: Product) => {
    const newItem: InvoiceItem = {
      id: `item_cat_${product.id}_${Date.now()}`,
      name: product.name,
      size: product.sizes && product.sizes.length > 0 ? product.sizes[0] : '40',
      condition: product.name.toUpperCase().includes('SECOND') ? 'Preloved / Second' : 'Baru (Original)',
      price: product.price,
      quantity: 1,
      discount: 0,
      subtotal: product.price
    };
    recalculateInvoice([...invoice.items, newItem]);
    setShowCatalogModal(false);
    showToast(`${product.name} ditambahkan ke nota!`, 'success');
  };

  // Save Invoice
  const handleSaveInvoice = () => {
    if (!invoice.customerName.trim()) {
      showToast('Silakan isi Nama Pembeli terlebih dahulu.', 'error');
      return;
    }

    try {
      const existsIndex = savedInvoices.findIndex(i => i.id === invoice.id || i.invoiceNumber === invoice.invoiceNumber);
      let updated: InvoiceData[];
      if (existsIndex >= 0) {
        updated = [...savedInvoices];
        updated[existsIndex] = { ...invoice, createdAt: new Date().toISOString() };
      } else {
        updated = [{ ...invoice, createdAt: new Date().toISOString() }, ...savedInvoices];
      }

      setSavedInvoices(updated);
      localStorage.setItem('estore_saved_invoices', JSON.stringify(updated));
      showToast(`Nota ${invoice.invoiceNumber} berhasil disimpan!`, 'success');
    } catch (e) {
      console.error(e);
      showToast('Gagal menyimpan nota.', 'error');
    }
  };

  // Delete Saved Invoice
  const handleDeleteSavedInvoice = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Hapus riwayat nota ini?')) return;
    const updated = savedInvoices.filter(i => i.id !== id);
    setSavedInvoices(updated);
    localStorage.setItem('estore_saved_invoices', JSON.stringify(updated));
    showToast('Nota telah dihapus dari riwayat.', 'info');
  };

  // Load Saved Invoice
  const handleLoadSavedInvoice = (saved: InvoiceData) => {
    setInvoice(saved);
    setActiveTab('preview');
    showToast(`Nota ${saved.invoiceNumber} dimuat.`, 'success');
  };

  // Print Invoice
  const handlePrint = () => {
    window.print();
  };

  // Share via WhatsApp
  const handleShareWhatsApp = () => {
    if (!invoice.customerName.trim()) {
      showToast('Nama pelanggan belum diisi.', 'error');
      return;
    }

    const itemsText = invoice.items.map((it, idx) => 
      `${idx + 1}. *${it.name}*\n   Size: ${it.size || '-'} | Kondisi: ${it.condition || 'Baru'}\n   ${it.quantity}x @ ${formatPrice(it.price)} = *${formatPrice(it.subtotal)}*`
    ).join('\n');

    const statusBadge = invoice.paymentStatus === 'LUNAS' 
      ? '✅ *LUNAS*' 
      : invoice.paymentStatus === 'DP' 
        ? `⚠️ *DP (Uang Muka: ${formatPrice(invoice.paidAmount)} | Sisa: ${formatPrice(invoice.remainingAmount)})*`
        : '⏳ *BELUM LUNAS*';

    const text = `🧾 *NOTA PEMBELIAN RESMI - ${invoice.storeName.toUpperCase()}*\n` +
      `No. Nota: *${invoice.invoiceNumber}*\n` +
      `Tanggal: ${invoice.date}\n` +
      `Status Pembayaran: ${statusBadge}\n` +
      `------------------------------------------\n` +
      `*DATA PENERIMA:*\n` +
      `Nama: *${invoice.customerName}*\n` +
      `No. HP: ${invoice.customerPhone || '-'}\n` +
      `Alamat: ${invoice.customerAddress || '-'}\n` +
      `Ekspedisi: ${invoice.courier || '-'}${invoice.trackingNumber ? ` (Resi: ${invoice.trackingNumber})` : ''}\n` +
      `------------------------------------------\n` +
      `*RINCIAN PRODUK:*\n${itemsText}\n` +
      `------------------------------------------\n` +
      `Subtotal: ${formatPrice(invoice.subtotal)}\n` +
      (invoice.shippingFee > 0 ? `Ongkos Kirim: ${formatPrice(invoice.shippingFee)}\n` : '') +
      (invoice.packingFee && invoice.packingFee > 0 ? `Biaya Packing/Asuransi: ${formatPrice(invoice.packingFee)}\n` : '') +
      (invoice.discountAmount > 0 ? `Diskon Potongan: -${formatPrice(invoice.discountAmount)}\n` : '') +
      `*TOTAL AKHIR: ${formatPrice(invoice.grandTotal)}*\n` +
      `------------------------------------------\n` +
      `Metode: ${invoice.paymentMethod}\n\n` +
      `*Rekening Pembayaran E STORE:*\n${invoice.bankAccountInfo || DEFAULT_BANK_INFO}\n\n` +
      `_Terima kasih telah berbelanja di ${invoice.storeName}! Simpan bukti nota ini untuk garansi produk._`;

    const targetPhone = invoice.customerPhone.replace(/[^0-9]/g, '') || CONTACT_INFO.whatsapp.replace(/[^0-9]/g, '');
    const waUrl = `https://wa.me/${targetPhone}?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  // Copy Text Summary
  const handleCopyText = () => {
    const itemsText = invoice.items.map((it, idx) => 
      `${idx + 1}. ${it.name} (Size: ${it.size || '-'}) - ${it.quantity}x @ ${formatPrice(it.price)} = ${formatPrice(it.subtotal)}`
    ).join('\n');

    const text = `NOTA PEMBELIAN ${invoice.storeName}\nNo: ${invoice.invoiceNumber}\nTgl: ${invoice.date}\nStatus: ${invoice.paymentStatus}\n\nPembeli: ${invoice.customerName} (${invoice.customerPhone})\nAlamat: ${invoice.customerAddress}\n\nItem:\n${itemsText}\n\nSubtotal: ${formatPrice(invoice.subtotal)}\nOngkir: ${formatPrice(invoice.shippingFee)}\nDiskon: -${formatPrice(invoice.discountAmount)}\nTOTAL: ${formatPrice(invoice.grandTotal)}\n\nMetode: ${invoice.paymentMethod}`;
    
    navigator.clipboard.writeText(text);
    showToast('Teks ringkasan nota berhasil disalin ke clipboard!', 'success');
  };

  // Filter Catalog Products
  const filteredCatalog = useMemo(() => {
    if (!catalogSearch.trim()) return allProducts.slice(0, 20);
    const q = catalogSearch.toLowerCase();
    return allProducts.filter(p => 
      p.name.toLowerCase().includes(q) || 
      (p.brand && p.brand.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q))
    );
  }, [allProducts, catalogSearch]);

  return (
    <div className="space-y-6">
      {/* Top Header & Tab Controls */}
      <div className="no-print bg-white p-6 rounded-3xl border border-black/5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-tea-main/10 text-tea-main font-bold">
              <FileText size={22} />
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-black font-display tracking-tight">
              Invoice Maker & Nota Pembelian
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-black/50">
            Buat, kelola, cetak struk/nota resmi berstempel, dan kirimkan langsung ke WhatsApp pembeli.
          </p>
        </div>

        {/* Action Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-black/5 p-1 rounded-2xl flex items-center gap-1">
            <button
              onClick={() => setActiveTab('create')}
              className={cn(
                "px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5",
                activeTab === 'create' ? "bg-white text-black shadow-sm" : "text-black/50 hover:text-black"
              )}
            >
              <Edit3 size={15} /> Edit Nota
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={cn(
                "px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5",
                activeTab === 'preview' ? "bg-white text-black shadow-sm" : "text-black/50 hover:text-black"
              )}
            >
              <Eye size={15} /> Preview & Cetak
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={cn(
                "px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5",
                activeTab === 'history' ? "bg-white text-black shadow-sm" : "text-black/50 hover:text-black"
              )}
            >
              <Clock size={15} /> Riwayat ({savedInvoices.length})
            </button>
          </div>

          <button
            onClick={() => {
              setInvoice({
                id: `inv_${Date.now()}`,
                invoiceNumber: generateInvoiceNo(),
                date: new Date().toISOString().split('T')[0],
                dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
                storeName: 'E STORE Official',
                storeAddress: STORE.location || 'Majalengka, Jawa Barat, Indonesia',
                storePhone: CONTACT_INFO.whatsapp || '+6285179550150',
                storeEmail: 'official@estore.com',
                storeLogo: CONTACT_INFO.logo,
                customerName: '',
                customerPhone: '',
                customerAddress: '',
                courier: 'JNE Regular',
                trackingNumber: '',
                items: [
                  {
                    id: `item_${Date.now()}`,
                    name: '',
                    size: '40',
                    condition: 'Baru (Original)',
                    price: 0,
                    quantity: 1,
                    discount: 0,
                    subtotal: 0
                  }
                ],
                subtotal: 0,
                shippingFee: 0,
                discountAmount: 0,
                packingFee: 0,
                grandTotal: 0,
                paidAmount: 0,
                remainingAmount: 0,
                paymentMethod: 'Transfer BCA',
                bankAccountInfo: DEFAULT_BANK_INFO,
                paymentStatus: 'LUNAS',
                notes: DEFAULT_NOTES,
                adminName: 'Admin E STORE',
                createdAt: new Date().toISOString()
              });
              setActiveTab('create');
              showToast('Form nota baru siap diisi.', 'info');
            }}
            className="px-4 py-2.5 bg-black/5 hover:bg-black/10 text-black text-xs font-bold rounded-2xl transition-all flex items-center gap-1.5"
            title="Reset ke Nota Kosong Baru"
          >
            <Plus size={16} /> Nota Baru
          </button>
        </div>
      </div>

      {/* TAB 1: FORM EDITOR */}
      {activeTab === 'create' && (
        <div className="no-print grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Store & Invoice Meta */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-black/5 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-black/5 pb-4">
                <h3 className="font-bold text-base text-black flex items-center gap-2">
                  <Hash size={18} className="text-tea-main" /> Identitas Nota & Toko
                </h3>
                <button
                  type="button"
                  onClick={() => setInvoice(prev => ({ ...prev, invoiceNumber: generateInvoiceNo() }))}
                  className="text-xs font-bold text-tea-main hover:underline flex items-center gap-1"
                >
                  <RefreshCw size={12} /> Generate No. Baru
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-black/50">Nomor Invoice</label>
                  <input
                    type="text"
                    value={invoice.invoiceNumber}
                    onChange={(e) => setInvoice({ ...invoice, invoiceNumber: e.target.value })}
                    className="w-full bg-black/5 border border-black/5 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-black focus:outline-none focus:ring-2 focus:ring-tea-main"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-black/50">Tanggal Transaksi</label>
                  <input
                    type="date"
                    value={invoice.date}
                    onChange={(e) => setInvoice({ ...invoice, date: e.target.value })}
                    className="w-full bg-black/5 border border-black/5 rounded-xl px-3.5 py-2.5 text-xs font-bold text-black focus:outline-none focus:ring-2 focus:ring-tea-main"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-black/50">Status Pembayaran</label>
                  <select
                    value={invoice.paymentStatus}
                    onChange={(e) => {
                      const newStatus = e.target.value as InvoiceData['paymentStatus'];
                      recalculateInvoice(invoice.items, invoice.shippingFee, invoice.discountAmount, invoice.packingFee, invoice.paidAmount, newStatus);
                    }}
                    className="w-full bg-black/5 border border-black/5 rounded-xl px-3.5 py-2.5 text-xs font-bold text-black focus:outline-none focus:ring-2 focus:ring-tea-main"
                  >
                    <option value="LUNAS">✅ LUNAS (PAID)</option>
                    <option value="BELUM LUNAS">⏳ BELUM LUNAS (UNPAID)</option>
                    <option value="DP">⚠️ UANG MUKA (DP)</option>
                    <option value="BATAL">❌ BATAL (CANCELLED)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Customer Info */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-black/5 shadow-sm space-y-6">
              <h3 className="font-bold text-base text-black flex items-center gap-2 border-b border-black/5 pb-4">
                <User size={18} className="text-tea-main" /> Data Pembeli & Pengiriman
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-black/50">Nama Lengkap Pembeli *</label>
                  <input
                    type="text"
                    placeholder="Contoh: Budi Santoso"
                    value={invoice.customerName}
                    onChange={(e) => setInvoice({ ...invoice, customerName: e.target.value })}
                    className="w-full bg-black/5 border border-black/5 rounded-xl px-3.5 py-2.5 text-xs font-bold text-black focus:outline-none focus:ring-2 focus:ring-tea-main"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-black/50">No. WhatsApp / HP</label>
                  <input
                    type="text"
                    placeholder="Contoh: 081234567890"
                    value={invoice.customerPhone}
                    onChange={(e) => setInvoice({ ...invoice, customerPhone: e.target.value })}
                    className="w-full bg-black/5 border border-black/5 rounded-xl px-3.5 py-2.5 text-xs font-bold text-black focus:outline-none focus:ring-2 focus:ring-tea-main"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-black/50">Alamat Lengkap Tujuan</label>
                  <textarea
                    rows={2}
                    placeholder="Contoh: Jl. Pahlawan No. 45, RT 02/05, Majalengka, Jawa Barat"
                    value={invoice.customerAddress}
                    onChange={(e) => setInvoice({ ...invoice, customerAddress: e.target.value })}
                    className="w-full bg-black/5 border border-black/5 rounded-xl px-3.5 py-2.5 text-xs font-medium text-black focus:outline-none focus:ring-2 focus:ring-tea-main"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-black/50">Ekspedisi / Kurir</label>
                  <input
                    type="text"
                    placeholder="Contoh: JNE REG / J&T Express / GoSend / Ambil di Toko"
                    value={invoice.courier || ''}
                    onChange={(e) => setInvoice({ ...invoice, courier: e.target.value })}
                    className="w-full bg-black/5 border border-black/5 rounded-xl px-3.5 py-2.5 text-xs font-medium text-black focus:outline-none focus:ring-2 focus:ring-tea-main"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-black/50">Nomor Resi (Opsional)</label>
                  <input
                    type="text"
                    placeholder="Contoh: JNE1234567890"
                    value={invoice.trackingNumber || ''}
                    onChange={(e) => setInvoice({ ...invoice, trackingNumber: e.target.value })}
                    className="w-full bg-black/5 border border-black/5 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-black focus:outline-none focus:ring-2 focus:ring-tea-main"
                  />
                </div>
              </div>
            </div>

            {/* Itemized Table */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-black/5 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/5 pb-4">
                <div>
                  <h3 className="font-bold text-base text-black flex items-center gap-2">
                    <ShoppingCart size={18} className="text-tea-main" /> Daftar Produk & Sepatu ({invoice.items.length})
                  </h3>
                  <p className="text-xs text-black/40">Isi rincian barang atau pilih langsung dari katalog sepatu toko.</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCatalogModal(true)}
                    className="px-3.5 py-2 bg-gradient-to-r from-tea-main to-[#A8340D] text-white text-xs font-bold rounded-xl hover:opacity-90 transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <Sparkles size={14} /> Pilih dari Katalog
                  </button>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-3.5 py-2 bg-black/5 hover:bg-black/10 text-black text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                  >
                    <Plus size={14} /> Tambah Baris
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {invoice.items.map((item, index) => (
                  <div key={item.id || index} className="p-4 rounded-2xl bg-black/[0.02] border border-black/5 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-black text-black/60 bg-black/5 px-2 py-0.5 rounded-md">
                        Item #{index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="text-red-400 hover:text-red-600 p-1 transition-colors"
                        title="Hapus baris item ini"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                      {/* Name */}
                      <div className="sm:col-span-5 space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-black/40">Nama Produk</label>
                        <input
                          type="text"
                          placeholder="Nama sepatu / produk..."
                          value={item.name}
                          onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                          className="w-full bg-white border border-black/10 rounded-xl px-3 py-2 text-xs font-bold text-black focus:outline-none focus:ring-1 focus:ring-tea-main"
                        />
                      </div>

                      {/* Size */}
                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-black/40">Ukuran</label>
                        <input
                          type="text"
                          placeholder="e.g. 42"
                          value={item.size || ''}
                          onChange={(e) => handleItemChange(index, 'size', e.target.value)}
                          className="w-full bg-white border border-black/10 rounded-xl px-3 py-2 text-xs font-bold text-black focus:outline-none focus:ring-1 focus:ring-tea-main text-center"
                        />
                      </div>

                      {/* Condition */}
                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-black/40">Kondisi</label>
                        <select
                          value={item.condition || 'Baru (Original)'}
                          onChange={(e) => handleItemChange(index, 'condition', e.target.value)}
                          className="w-full bg-white border border-black/10 rounded-xl px-2 py-2 text-[11px] font-semibold text-black focus:outline-none focus:ring-1 focus:ring-tea-main"
                        >
                          <option value="Baru (Original)">Baru (BNIB)</option>
                          <option value="Baru (BNWB)">Baru (BNWB)</option>
                          <option value="Preloved / Second">Preloved / Second</option>
                          <option value="VNDS (Very Near Deadstock)">VNDS</option>
                        </select>
                      </div>

                      {/* Qty */}
                      <div className="sm:col-span-1 space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-black/40">Qty</label>
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full bg-white border border-black/10 rounded-xl px-2 py-2 text-xs font-bold text-black focus:outline-none focus:ring-1 focus:ring-tea-main text-center"
                        />
                      </div>

                      {/* Price */}
                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-black/40">Harga (Rp)</label>
                        <input
                          type="number"
                          min={0}
                          step={1000}
                          value={item.price}
                          onChange={(e) => handleItemChange(index, 'price', Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full bg-white border border-black/10 rounded-xl px-3 py-2 text-xs font-bold text-black focus:outline-none focus:ring-1 focus:ring-tea-main text-right"
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2 text-xs border-t border-black/5 text-black/60">
                      <span>Subtotal Item:</span>
                      <span className="font-bold text-black font-mono">{formatPrice(item.subtotal)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Summary & Financial Settings (1 col) */}
          <div className="space-y-6">
            {/* Financial Adjustments */}
            <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm space-y-5">
              <h3 className="font-bold text-base text-black flex items-center gap-2 border-b border-black/5 pb-3">
                <CreditCard size={18} className="text-tea-main" /> Kalkulasi & Pembayaran
              </h3>

              <div className="space-y-3.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-black/60">Subtotal Produk:</span>
                  <span className="font-bold text-black font-mono">{formatPrice(invoice.subtotal)}</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-black/50">Ongkos Kirim (Rp)</label>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={invoice.shippingFee}
                    onChange={(e) => recalculateInvoice(invoice.items, parseInt(e.target.value) || 0, invoice.discountAmount, invoice.packingFee, invoice.paidAmount, invoice.paymentStatus)}
                    className="w-full bg-black/5 border border-black/5 rounded-xl px-3 py-2 text-xs font-bold text-black text-right focus:outline-none focus:ring-2 focus:ring-tea-main"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-black/50">Potongan Diskon (Rp)</label>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={invoice.discountAmount}
                    onChange={(e) => recalculateInvoice(invoice.items, invoice.shippingFee, parseInt(e.target.value) || 0, invoice.packingFee, invoice.paidAmount, invoice.paymentStatus)}
                    className="w-full bg-black/5 border border-black/5 rounded-xl px-3 py-2 text-xs font-bold text-red-600 text-right focus:outline-none focus:ring-2 focus:ring-tea-main"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-black/50">Biaya Packing / Asuransi (Rp)</label>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={invoice.packingFee || 0}
                    onChange={(e) => recalculateInvoice(invoice.items, invoice.shippingFee, invoice.discountAmount, parseInt(e.target.value) || 0, invoice.paidAmount, invoice.paymentStatus)}
                    className="w-full bg-black/5 border border-black/5 rounded-xl px-3 py-2 text-xs font-bold text-black text-right focus:outline-none focus:ring-2 focus:ring-tea-main"
                  />
                </div>

                <div className="p-3.5 rounded-2xl bg-black text-white space-y-1">
                  <span className="text-[10px] uppercase tracking-widest text-white/60 font-bold">TOTAL AKHIR</span>
                  <p className="text-xl font-bold font-display text-tea-main">{formatPrice(invoice.grandTotal)}</p>
                  <p className="text-[10px] text-white/70 italic leading-tight pt-1">
                    "{numberToTerbilang(invoice.grandTotal)}"
                  </p>
                </div>

                {invoice.paymentStatus === 'DP' && (
                  <div className="space-y-3 pt-2 border-t border-black/5">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-black/50">Uang Muka Diterima (DP)</label>
                      <input
                        type="number"
                        min={0}
                        max={invoice.grandTotal}
                        step={1000}
                        value={invoice.paidAmount}
                        onChange={(e) => recalculateInvoice(invoice.items, invoice.shippingFee, invoice.discountAmount, invoice.packingFee, parseInt(e.target.value) || 0, 'DP')}
                        className="w-full bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 text-xs font-bold text-blue-900 text-right focus:outline-none"
                      />
                    </div>
                    <div className="flex justify-between items-center text-xs p-2 rounded-xl bg-red-50 text-red-700 font-bold">
                      <span>Sisa Pelunasan:</span>
                      <span className="font-mono">{formatPrice(invoice.remainingAmount)}</span>
                    </div>
                  </div>
                )}

                <div className="space-y-1 pt-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-black/50">Metode Pembayaran</label>
                  <input
                    type="text"
                    placeholder="e.g. Transfer BCA / QRIS / Cash"
                    value={invoice.paymentMethod}
                    onChange={(e) => setInvoice({ ...invoice, paymentMethod: e.target.value })}
                    className="w-full bg-black/5 border border-black/5 rounded-xl px-3 py-2 text-xs font-medium text-black focus:outline-none focus:ring-2 focus:ring-tea-main"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-black/50">Info Rekening Toko</label>
                  <textarea
                    rows={3}
                    value={invoice.bankAccountInfo || ''}
                    onChange={(e) => setInvoice({ ...invoice, bankAccountInfo: e.target.value })}
                    className="w-full bg-black/5 border border-black/5 rounded-xl p-2.5 text-[11px] font-mono text-black focus:outline-none focus:ring-2 focus:ring-tea-main"
                  />
                </div>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm space-y-3">
              <button
                onClick={() => {
                  handleSaveInvoice();
                  setActiveTab('preview');
                }}
                className="w-full bg-tea-main text-white py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-tea-main/20"
              >
                <Eye size={16} /> Simpan & Lihat Preview
              </button>

              <button
                onClick={handleSaveInvoice}
                className="w-full bg-black/5 hover:bg-black/10 text-black py-3 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2"
              >
                <Save size={16} /> Simpan ke Riwayat Nota
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PREVIEW & CETAK */}
      {activeTab === 'preview' && (
        <div className="space-y-6">
          {/* Action Toolbar (Hidden during Print) */}
          <div className="no-print bg-white p-4 rounded-3xl border border-black/5 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('create')}
                className="px-4 py-2 bg-black/5 hover:bg-black/10 text-black text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
              >
                <ArrowLeft size={14} /> Kembali Edit
              </button>

              <div className="h-6 w-px bg-black/10 mx-1" />

              {/* Template format switch */}
              <div className="flex items-center bg-black/5 p-1 rounded-xl gap-1">
                <button
                  onClick={() => setPreviewFormat('a4')}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                    previewFormat === 'a4' ? "bg-white text-black shadow-xs" : "text-black/50 hover:text-black"
                  )}
                >
                  📄 Nota A4 Resmi
                </button>
                <button
                  onClick={() => setPreviewFormat('thermal')}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                    previewFormat === 'thermal' ? "bg-white text-black shadow-xs" : "text-black/50 hover:text-black"
                  )}
                >
                  🧾 Struk Kasir (80mm)
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handlePrint}
                className="px-5 py-2.5 bg-black text-white text-xs font-bold rounded-xl hover:bg-black/80 transition-all flex items-center gap-2 shadow-md"
              >
                <Printer size={16} /> Cetak Nota (Print / PDF)
              </button>

              <button
                onClick={handleShareWhatsApp}
                className="px-4 py-2.5 bg-[#25D366] text-white text-xs font-bold rounded-xl hover:bg-[#20ba5a] transition-all flex items-center gap-2 shadow-md"
                title="Kirim ringkasan nota langsung ke nomor WhatsApp pembeli"
              >
                <Share2 size={16} /> Kirim ke WhatsApp
              </button>

              <button
                onClick={handleCopyText}
                className="p-2.5 bg-black/5 hover:bg-black/10 text-black rounded-xl transition-all"
                title="Salin Teks Nota"
              >
                <Copy size={16} />
              </button>

              <button
                onClick={handleSaveInvoice}
                className="px-4 py-2.5 bg-tea-main text-white text-xs font-bold rounded-xl hover:opacity-90 transition-all flex items-center gap-1.5 shadow-sm"
              >
                <Save size={16} /> Simpan
              </button>
            </div>
          </div>

          {/* INVOICE DISPLAY CANVAS (Print Target Area) */}
          <div className="flex justify-center">
            {previewFormat === 'a4' ? (
              /* A4 Official Format */
              <div 
                id="invoice-print-area" 
                className="w-full max-w-4xl bg-white p-8 sm:p-12 rounded-3xl border border-black/10 shadow-2xl relative text-black overflow-hidden font-sans"
              >
                {/* Stamp Watermark */}
                {invoice.paymentStatus === 'LUNAS' && (
                  <div className="absolute top-1/2 right-12 -translate-y-1/2 pointer-events-none opacity-20 rotate-[-18deg] select-none border-4 border-green-700 p-4 rounded-3xl text-center">
                    <p className="text-6xl font-black text-green-700 tracking-widest uppercase">LUNAS</p>
                    <p className="text-xs font-bold text-green-700 mt-1 tracking-wider">OFFICIAL PAID • E STORE</p>
                  </div>
                )}
                {invoice.paymentStatus === 'BELUM LUNAS' && (
                  <div className="absolute top-1/2 right-12 -translate-y-1/2 pointer-events-none opacity-20 rotate-[-18deg] select-none border-4 border-red-700 p-4 rounded-3xl text-center">
                    <p className="text-6xl font-black text-red-700 tracking-widest uppercase">UNPAID</p>
                    <p className="text-xs font-bold text-red-700 mt-1 tracking-wider">BELUM LUNAS • E STORE</p>
                  </div>
                )}

                {/* Header Toko */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b-2 border-black/10 pb-8">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      {invoice.storeLogo && (
                        <img 
                          src={invoice.storeLogo} 
                          alt="Logo Toko" 
                          className="w-14 h-14 object-contain rounded-2xl border border-black/10 bg-white p-1"
                          referrerPolicy="no-referrer"
                        />
                      )}
                      <div>
                        <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-black">
                          {invoice.storeName}
                        </h1>
                        <p className="text-[11px] font-bold tracking-widest uppercase text-tea-main">
                          SHOES STORE TERPERCAYA • 100% ORIGINAL
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-black/60 max-w-sm leading-relaxed">
                      {invoice.storeAddress}
                    </p>
                    <p className="text-xs text-black/60">
                      WhatsApp: <span className="font-bold text-black">{invoice.storePhone}</span>
                    </p>
                  </div>

                  {/* Invoice Meta */}
                  <div className="text-left sm:text-right space-y-1.5 sm:self-end">
                    <div className="inline-block bg-black text-white px-3.5 py-1 rounded-lg text-xs font-black tracking-widest uppercase mb-1">
                      INVOICE RESMI
                    </div>
                    <h2 className="text-lg font-mono font-bold text-black">{invoice.invoiceNumber}</h2>
                    <p className="text-xs text-black/60">Tanggal: <strong>{new Date(invoice.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</strong></p>
                    <div className="pt-1">
                      <span className={cn(
                        "inline-flex items-center gap-1 text-[11px] font-black uppercase px-3 py-1 rounded-full",
                        invoice.paymentStatus === 'LUNAS' ? "bg-green-100 text-green-800 border border-green-300" :
                        invoice.paymentStatus === 'DP' ? "bg-blue-100 text-blue-800 border border-blue-300" :
                        invoice.paymentStatus === 'BATAL' ? "bg-zinc-100 text-zinc-600 border border-zinc-300" :
                        "bg-red-100 text-red-800 border border-red-300"
                      )}>
                        {invoice.paymentStatus === 'LUNAS' && <CheckCircle2 size={12} />}
                        Status: {invoice.paymentStatus}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Customer Bill-To Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-black/5">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-black/40">DITAGIHKAN KEPADA:</span>
                    <h3 className="font-bold text-base text-black">{invoice.customerName || 'Pelanggan Terhormat'}</h3>
                    {invoice.customerPhone && <p className="text-xs text-black/70 font-semibold">{invoice.customerPhone}</p>}
                    <p className="text-xs text-black/60 leading-relaxed max-w-sm">{invoice.customerAddress || 'Alamat tidak dicantumkan'}</p>
                  </div>

                  <div className="space-y-1 text-left sm:text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-black/40">PENGIRIMAN & PEMBAYARAN:</span>
                    <p className="text-xs text-black">Ekspedisi: <strong>{invoice.courier || 'Kurir Toko'}</strong></p>
                    {invoice.trackingNumber && (
                      <p className="text-xs font-mono text-black font-bold">No. Resi: {invoice.trackingNumber}</p>
                    )}
                    <p className="text-xs text-black">Metode Bayar: <strong>{invoice.paymentMethod}</strong></p>
                  </div>
                </div>

                {/* Items Table */}
                <div className="py-6">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b-2 border-black/10 text-[11px] font-bold uppercase tracking-wider text-black/60">
                        <th className="py-3 px-2">No.</th>
                        <th className="py-3 px-2">Deskripsi Produk</th>
                        <th className="py-3 px-2 text-center">Size</th>
                        <th className="py-3 px-2 text-center">Kondisi</th>
                        <th className="py-3 px-2 text-center">Qty</th>
                        <th className="py-3 px-2 text-right">Harga Satuan</th>
                        <th className="py-3 px-2 text-right">Jumlah</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5 text-xs">
                      {invoice.items.map((item, idx) => (
                        <tr key={idx} className="page-break-avoid">
                          <td className="py-3.5 px-2 font-mono text-black/40">{idx + 1}</td>
                          <td className="py-3.5 px-2 font-bold text-black">{item.name}</td>
                          <td className="py-3.5 px-2 text-center font-bold font-mono">{item.size || '-'}</td>
                          <td className="py-3.5 px-2 text-center text-black/70">{item.condition || 'Original'}</td>
                          <td className="py-3.5 px-2 text-center font-bold">{item.quantity}</td>
                          <td className="py-3.5 px-2 text-right font-mono text-black/70">{formatPrice(item.price)}</td>
                          <td className="py-3.5 px-2 text-right font-bold font-mono text-black">{formatPrice(item.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Calculation Summary */}
                <div className="border-t-2 border-black/10 pt-4 flex flex-col sm:flex-row justify-between items-start gap-8">
                  {/* Left: Notes & Bank Info */}
                  <div className="flex-1 space-y-4">
                    <div className="p-4 rounded-2xl bg-black/[0.02] border border-black/5 space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-black/40">INSTRUKSI PEMBAYARAN TOKO:</p>
                      <pre className="text-[11px] font-mono text-black/80 whitespace-pre-line leading-relaxed">
                        {invoice.bankAccountInfo || DEFAULT_BANK_INFO}
                      </pre>
                    </div>

                    {invoice.notes && (
                      <div className="space-y-1 text-xs text-black/60">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-black/40">CATATAN & SYARAT KETENTUAN:</p>
                        <p className="whitespace-pre-line leading-relaxed text-[11px]">{invoice.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Right: Totals */}
                  <div className="w-full sm:w-80 space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-black/5">
                      <span className="text-black/60">Subtotal:</span>
                      <span className="font-mono font-bold">{formatPrice(invoice.subtotal)}</span>
                    </div>

                    {invoice.shippingFee > 0 && (
                      <div className="flex justify-between py-1 border-b border-black/5">
                        <span className="text-black/60">Ongkos Kirim:</span>
                        <span className="font-mono">{formatPrice(invoice.shippingFee)}</span>
                      </div>
                    )}

                    {invoice.packingFee && invoice.packingFee > 0 && (
                      <div className="flex justify-between py-1 border-b border-black/5">
                        <span className="text-black/60">Packing & Asuransi:</span>
                        <span className="font-mono">{formatPrice(invoice.packingFee)}</span>
                      </div>
                    )}

                    {invoice.discountAmount > 0 && (
                      <div className="flex justify-between py-1 border-b border-black/5 text-red-600">
                        <span>Diskon / Potongan:</span>
                        <span className="font-mono font-bold">-{formatPrice(invoice.discountAmount)}</span>
                      </div>
                    )}

                    <div className="flex justify-between py-2.5 border-b-2 border-black text-sm font-bold text-black">
                      <span>TOTAL TAGIHAN:</span>
                      <span className="font-mono text-base text-tea-main">{formatPrice(invoice.grandTotal)}</span>
                    </div>

                    {invoice.paymentStatus === 'DP' && (
                      <>
                        <div className="flex justify-between py-1 text-blue-800 font-bold">
                          <span>Uang Muka Diterima:</span>
                          <span className="font-mono">{formatPrice(invoice.paidAmount)}</span>
                        </div>
                        <div className="flex justify-between py-1.5 text-red-700 font-black border-t border-dashed border-black/20">
                          <span>SISA PELUNASAN:</span>
                          <span className="font-mono text-sm">{formatPrice(invoice.remainingAmount)}</span>
                        </div>
                      </>
                    )}

                    <div className="pt-2 text-[10px] text-black/50 italic leading-tight">
                      Terbilang: <strong>{numberToTerbilang(invoice.grandTotal)}</strong>
                    </div>
                  </div>
                </div>

                {/* Footer Signatures */}
                <div className="mt-12 pt-8 border-t border-black/10 flex justify-between items-end text-center text-xs page-break-avoid">
                  <div className="space-y-16">
                    <p className="text-black/50">Penerima / Pembeli</p>
                    <p className="font-bold border-b border-black/30 pb-1 px-4">{invoice.customerName || 'Pelanggan'}</p>
                  </div>

                  <div className="space-y-2 text-right">
                    <p className="text-[10px] text-black/40">Majalengka, {new Date(invoice.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    <div className="inline-block p-2 border border-black/20 rounded-xl bg-black/[0.01]">
                      <div className="w-28 h-12 flex items-center justify-center text-tea-main font-serif font-black tracking-widest text-sm border border-dashed border-tea-main/40 rounded-lg">
                        E STORE
                      </div>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-black/60 mt-1">Cap Resmi Kasir Toko</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Thermal Mini Receipt Format (58mm/80mm POS style) */
              <div 
                id="invoice-print-area" 
                className="w-full max-w-sm bg-white p-6 rounded-2xl border border-black/20 shadow-2xl text-black font-mono text-[11px] space-y-4"
              >
                <div className="text-center space-y-1 border-b border-dashed border-black pb-3">
                  <h3 className="text-base font-black uppercase font-sans tracking-tight">{invoice.storeName}</h3>
                  <p className="text-[10px] text-black/70">{invoice.storeAddress}</p>
                  <p className="text-[10px]">WA: {invoice.storePhone}</p>
                </div>

                <div className="space-y-0.5 text-[10px] border-b border-dashed border-black pb-2">
                  <div className="flex justify-between">
                    <span>No: {invoice.invoiceNumber}</span>
                    <span>{invoice.date}</span>
                  </div>
                  <div>Cust: <strong>{invoice.customerName || 'Pelanggan'}</strong> ({invoice.customerPhone || '-'})</div>
                  <div>Status: <strong>{invoice.paymentStatus}</strong></div>
                </div>

                <div className="space-y-2 border-b border-dashed border-black pb-3">
                  {invoice.items.map((it, idx) => (
                    <div key={idx} className="space-y-0.5">
                      <p className="font-bold text-black">{it.name}</p>
                      <div className="flex justify-between text-black/70 text-[10px]">
                        <span>{it.quantity}x @ {formatPrice(it.price)} (Sz: {it.size || '-'})</span>
                        <span className="font-bold text-black font-mono">{formatPrice(it.subtotal)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-1 border-b border-dashed border-black pb-3">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatPrice(invoice.subtotal)}</span>
                  </div>
                  {invoice.shippingFee > 0 && (
                    <div className="flex justify-between">
                      <span>Ongkir:</span>
                      <span>{formatPrice(invoice.shippingFee)}</span>
                    </div>
                  )}
                  {invoice.discountAmount > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Diskon:</span>
                      <span>-{formatPrice(invoice.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-xs pt-1 border-t border-black">
                    <span>TOTAL:</span>
                    <span>{formatPrice(invoice.grandTotal)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-black/70">
                    <span>Metode:</span>
                    <span>{invoice.paymentMethod}</span>
                  </div>
                </div>

                <div className="text-center space-y-1 text-[9px] text-black/60 pt-1">
                  <p>*** TERIMA KASIH TELAH BERBELANJA ***</p>
                  <p>Barang 100% Original & Bergaransi</p>
                  <p className="text-[8px] font-sans">Simpan struk ini sebagai bukti pembelian sah.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: RIWAYAT NOTA TERSIMPAN */}
      {activeTab === 'history' && (
        <div className="no-print bg-white p-6 sm:p-8 rounded-3xl border border-black/5 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/5 pb-4">
            <div>
              <h3 className="font-bold text-lg text-black flex items-center gap-2">
                <Clock size={20} className="text-tea-main" /> Riwayat Nota Tersimpan ({savedInvoices.length})
              </h3>
              <p className="text-xs text-black/50">Daftar semua invoice yang pernah dibuat dan disimpan di browser ini.</p>
            </div>

            {savedInvoices.length > 0 && (
              <button
                onClick={() => {
                  if (confirm('Hapus semua riwayat nota yang tersimpan?')) {
                    setSavedInvoices([]);
                    localStorage.removeItem('estore_saved_invoices');
                    showToast('Semua riwayat nota telah dibersihkan.', 'info');
                  }
                }}
                className="text-xs font-bold text-red-500 hover:underline flex items-center gap-1"
              >
                <Trash2 size={14} /> Bersihkan Riwayat
              </button>
            )}
          </div>

          {savedInvoices.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedInvoices.map((saved) => (
                <div
                  key={saved.id}
                  onClick={() => handleLoadSavedInvoice(saved)}
                  className="p-5 rounded-2xl bg-black/[0.02] border border-black/5 hover:border-tea-main/40 hover:bg-white hover:shadow-md transition-all cursor-pointer space-y-3 group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-xs text-black group-hover:text-tea-main transition-colors">
                      {saved.invoiceNumber}
                    </span>
                    <span className={cn(
                      "text-[9px] font-black uppercase px-2 py-0.5 rounded-full",
                      saved.paymentStatus === 'LUNAS' ? "bg-green-100 text-green-700" :
                      saved.paymentStatus === 'DP' ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"
                    )}>
                      {saved.paymentStatus}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <p className="font-bold text-sm text-black">{saved.customerName || 'Tanpa Nama'}</p>
                    <p className="text-xs text-black/50 line-clamp-1">
                      {saved.items.map(i => `${i.name} (${i.quantity}x)`).join(', ')}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-black/5 text-xs">
                    <span className="text-black/40">{saved.date}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-black">{formatPrice(saved.grandTotal)}</span>
                      <button
                        onClick={(e) => handleDeleteSavedInvoice(saved.id, e)}
                        className="text-red-400 hover:text-red-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Hapus nota ini"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 space-y-3 border-2 border-dashed border-black/10 rounded-2xl">
              <FileText size={36} className="mx-auto text-black/20" />
              <p className="text-sm font-bold text-black/40">Belum ada nota yang disimpan.</p>
              <button
                onClick={() => setActiveTab('create')}
                className="text-xs font-bold text-tea-main underline"
              >
                Buat Nota Pertama Sekarang
              </button>
            </div>
          )}
        </div>
      )}

      {/* MODAL: PILIH DARI KATALOG SEPATU */}
      <AnimatePresence>
        {showCatalogModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCatalogModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl p-6 shadow-2xl border border-black/10 z-10 space-y-4 max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-black/5 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-tea-main" />
                  <h3 className="font-bold text-base text-black">Pilih Produk dari Katalog Sepatu</h3>
                </div>
                <button
                  onClick={() => setShowCatalogModal(false)}
                  className="p-1 rounded-full text-black/40 hover:text-black hover:bg-black/5 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Search input */}
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-black/30" />
                <input
                  type="text"
                  placeholder="Cari nama sepatu, merk (Nike, Adidas, Converse, dsb)..."
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-black/10 text-xs font-medium focus:outline-none focus:border-tea-main"
                />
              </div>

              {/* Product Grid */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 divide-y divide-black/5">
                {filteredCatalog.length > 0 ? (
                  filteredCatalog.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => handleSelectProductFromCatalog(p)}
                      className="py-3 px-3 rounded-2xl hover:bg-black/5 transition-all flex items-center justify-between gap-4 cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {p.images && p.images[0] && (
                          <img
                            src={p.images[0]}
                            alt={p.name}
                            className="w-12 h-12 rounded-xl object-cover border border-black/10 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                        )}
                        <div className="min-w-0 space-y-0.5">
                          <p className="font-bold text-xs sm:text-sm text-black truncate group-hover:text-tea-main transition-colors">
                            {p.name}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-black/50 flex-wrap">
                            <span>Merk: {p.brand || '-'}</span>
                            <span>•</span>
                            <span>Stok: {p.stock}</span>
                            <span>•</span>
                            <span>Sizes: {p.sizes?.join(', ') || 'Semua'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="font-bold text-xs font-mono text-tea-main">{formatPrice(p.price)}</p>
                        <span className="text-[10px] font-bold text-black/40 group-hover:text-black transition-colors flex items-center gap-1 justify-end">
                          <Plus size={12} /> Pilih
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-black/40 text-xs">
                    Tidak ada produk yang cocok dengan pencarian "{catalogSearch}".
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
