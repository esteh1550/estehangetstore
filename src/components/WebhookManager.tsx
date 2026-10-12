import React, { useState, useEffect } from 'react';
import { 
  Share2, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Settings2, 
  History, 
  Copy, 
  ExternalLink, 
  Zap, 
  Eye, 
  Trash2, 
  Sparkles,
  RefreshCw,
  Sliders,
  HelpCircle,
  UserCheck,
  Smartphone
} from 'lucide-react';
import { 
  WebhookConfig, 
  WebhookLog, 
  fetchWebhookConfig, 
  saveWebhookConfig, 
  getWebhookLogs, 
  clearWebhookLogs, 
  testWebhook, 
  generateProductCaption,
  DEFAULT_CAPTION_TEMPLATE,
  DEFAULT_HASHTAGS
} from '../lib/webhookService';

export default function WebhookManager() {
  const [config, setConfig] = useState<WebhookConfig>({
    enabled: true,
    webhookUrl: '',
    secretToken: '',
    platforms: { instagram: true, facebookPage: true },
    metaConfig: { enabled: false, pageAccessToken: '', pageId: '', instagramAccountId: '' },
    captionTemplate: DEFAULT_CAPTION_TEMPLATE,
    autoHashtags: DEFAULT_HASHTAGS
  });

  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [activeTab, setActiveTab] = useState<'settings' | 'caption' | 'meta' | 'logs' | 'guide' | 'bio'>('settings');
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; data?: any } | null>(null);
  const [selectedLogPayload, setSelectedLogPayload] = useState<any | null>(null);
  const [copiedText, setCopiedText] = useState(false);

  useEffect(() => {
    loadSettings();
    setLogs(getWebhookLogs());
  }, []);

  const loadSettings = async () => {
    const loaded = await fetchWebhookConfig();
    setConfig(loaded);
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setSaveSuccessMessage(null);
    try {
      await saveWebhookConfig(config);
      setSaveSuccessMessage('Konfigurasi Webhook berhasil disimpan!');
      setTimeout(() => setSaveSuccessMessage(null), 4000);
    } catch (err: any) {
      alert('Gagal menyimpan: ' + (err?.message || 'Error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestWebhook = async () => {
    if (!config.webhookUrl && (!config.metaConfig?.enabled || !config.metaConfig?.pageAccessToken)) {
      alert('Masukkan Webhook URL terlebih dahulu untuk melakukan pengetesan.');
      return;
    }
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await testWebhook(config);
      setTestResult(result);
      setLogs(getWebhookLogs());
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Gagal mengirim test webhook'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleClearLogs = () => {
    if (confirm('Yakin ingin menghapus seluruh riwayat log webhook?')) {
      clearWebhookLogs();
      setLogs([]);
    }
  };

  const insertVariable = (varName: string) => {
    const current = config.captionTemplate || DEFAULT_CAPTION_TEMPLATE;
    setConfig({
      ...config,
      captionTemplate: current + ` ${varName}`
    });
  };

  const previewSampleProduct = {
    id: 'sample-sneaker-01',
    name: 'Nike Air Jordan 1 Retro High OG Chicago',
    brand: 'Nike',
    category: 'sepatu',
    price: 2450000,
    originalPrice: 3200000,
    sizes: ['42', '42.5', '43'],
    condition: 'baru',
    description: '100% Original Authentic, Brand New in Box (BNIB). Kualitas material premium kulit asli dengan bantalan empuk Air Sole.',
    images: ['https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&q=80&w=1000']
  };

  const sampleCaption = generateProductCaption(previewSampleProduct, config);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const sampleJsonPayload = JSON.stringify({
    event: "product.created",
    timestamp: "2026-10-12T14:00:00.000Z",
    source: "E STORE Official App",
    store: {
      name: "E STORE Official",
      whatsapp: "+6285179550150"
    },
    product: {
      id: "prod_12345",
      name: "Nike Air Jordan 1 Retro High OG Chicago",
      brand: "Nike",
      price: 2450000,
      formattedPrice: "Rp 2.450.000",
      sizes: ["42", "42.5", "43"],
      condition: "baru",
      imageUrl: "https://.../gambar-sepatu.jpg",
      url: "https://estore.id/product/prod_12345"
    },
    social: {
      targetPlatforms: ["instagram", "facebook_page"],
      caption: sampleCaption
    }
  }, null, 2);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#181512] to-[#2B231D] text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-white/10 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-[#B83A0E]/30 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 bg-[#B83A0E]/30 border border-[#B83A0E]/50 text-orange-200 px-3 py-1 rounded-full text-xs font-semibold">
              <Zap size={14} className="text-[#FF7A45]" />
              Otomasi Sosial Media
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
              Webhook Instagram & Facebook Page
            </h2>
            <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
              Otomatis kirim postingan foto & caption ke feed Instagram dan Facebook Page setiap kali Anda menambahkan produk baru di E STORE.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 flex items-center gap-3">
              <span className="text-xs text-white/60 font-medium">Status:</span>
              <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${
                config.enabled && (config.webhookUrl || config.metaConfig?.enabled)
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  config.enabled && (config.webhookUrl || config.metaConfig?.enabled)
                    ? 'bg-emerald-400 animate-pulse' 
                    : 'bg-amber-400'
                }`} />
                {config.enabled && (config.webhookUrl || config.metaConfig?.enabled) ? 'Aktif' : 'Belum Terhubung'}
              </span>
            </div>

            <button
              type="button"
              onClick={handleTestWebhook}
              disabled={isTesting}
              className="bg-[#B83A0E] hover:bg-[#A0320B] text-white px-5 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
            >
              {isTesting ? <RefreshCw size={15} className="animate-spin" /> : <Send size={15} />}
              {isTesting ? 'Mengirim Test...' : 'Kirim Test Webhook'}
            </button>
          </div>
        </div>

        {/* Target Platform Badges */}
        <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center gap-3 text-xs">
          <span className="text-white/50">Target Posting:</span>
          <span className={`px-3 py-1 rounded-xl flex items-center gap-1.5 font-bold ${
            config.platforms.instagram ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-pink-300 border border-pink-500/30' : 'bg-white/5 text-white/40'
          }`}>
            📷 Instagram {config.platforms.instagram ? '(Aktif)' : '(Nonaktif)'}
          </span>
          <span className={`px-3 py-1 rounded-xl flex items-center gap-1.5 font-bold ${
            config.platforms.facebookPage ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-white/5 text-white/40'
          }`}>
            📘 Facebook Page {config.platforms.facebookPage ? '(Aktif)' : '(Nonaktif)'}
          </span>
        </div>
      </div>

      {/* Test Result Alert */}
      {testResult && (
        <div className={`p-4 rounded-2xl border flex items-start gap-3 transition-all ${
          testResult.success 
            ? 'bg-emerald-50 text-emerald-900 border-emerald-200' 
            : 'bg-red-50 text-red-900 border-red-200'
        }`}>
          {testResult.success ? (
            <CheckCircle2 size={20} className="text-emerald-600 mt-0.5 shrink-0" />
          ) : (
            <AlertCircle size={20} className="text-red-600 mt-0.5 shrink-0" />
          )}
          <div className="space-y-1 text-xs">
            <h4 className="font-bold text-sm">
              {testResult.success ? 'Uji Coba Webhook Berhasil!' : 'Uji Coba Webhook Gagal'}
            </h4>
            <p className="opacity-90">{testResult.message}</p>
            {testResult.data && (
              <pre className="mt-2 p-2 bg-black/5 rounded-lg text-[10px] overflow-x-auto font-mono">
                {JSON.stringify(testResult.data, null, 2)}
              </pre>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-black/10 overflow-x-auto no-scrollbar gap-2">
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-3 font-bold text-xs flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'settings' 
              ? 'border-[#B83A0E] text-[#B83A0E]' 
              : 'border-transparent text-black/50 hover:text-black'
          }`}
        >
          <Settings2 size={16} /> Pengaturan Webhook
        </button>
        <button
          onClick={() => setActiveTab('caption')}
          className={`px-4 py-3 font-bold text-xs flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'caption' 
              ? 'border-[#B83A0E] text-[#B83A0E]' 
              : 'border-transparent text-black/50 hover:text-black'
          }`}
        >
          <Sparkles size={16} /> Template Caption ({config.platforms.instagram ? 'IG' : ''}&{config.platforms.facebookPage ? 'FB' : ''})
        </button>
        <button
          onClick={() => setActiveTab('meta')}
          className={`px-4 py-3 font-bold text-xs flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'meta' 
              ? 'border-[#B83A0E] text-[#B83A0E]' 
              : 'border-transparent text-black/50 hover:text-black'
          }`}
        >
          <Sliders size={16} /> Meta API Langsung (Opsional)
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-3 font-bold text-xs flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'logs' 
              ? 'border-[#B83A0E] text-[#B83A0E]' 
              : 'border-transparent text-black/50 hover:text-black'
          }`}
        >
          <History size={16} /> Riwayat Log ({logs.length})
        </button>
        <button
          onClick={() => setActiveTab('guide')}
          className={`px-4 py-3 font-bold text-xs flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'guide' 
              ? 'border-[#B83A0E] text-[#B83A0E]' 
              : 'border-transparent text-black/50 hover:text-black'
          }`}
        >
          <HelpCircle size={16} /> Panduan Cara Pakai
        </button>
        <button
          onClick={() => setActiveTab('bio')}
          className={`px-4 py-3 font-bold text-xs flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'bio' 
              ? 'border-[#B83A0E] text-[#B83A0E]' 
              : 'border-transparent text-black/50 hover:text-black'
          }`}
        >
          <UserCheck size={16} /> Rekomendasi Bio IG & FB
        </button>
      </div>

      {/* Tab 1: Settings Form */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSave} className="bg-white p-6 sm:p-8 rounded-3xl border border-black/5 shadow-sm space-y-6">
          <div className="space-y-4">
            <h3 className="font-bold text-black text-base flex items-center gap-2">
              <Zap size={18} className="text-[#B83A0E]" />
              Koneksi Webhook (Make.com, Zapier, n8n, atau Custom)
            </h3>
            <p className="text-xs text-black/60 leading-relaxed">
              Masukkan URL Webhook dari aplikasi automasi pilihan Anda. Setiap produk baru diposting, data produk lengkap akan otomatis dikirim ke URL ini dalam format JSON.
            </p>

            {/* Toggle Auto-Post */}
            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8DEC9] flex items-center justify-between">
              <div className="space-y-0.5">
                <label className="text-sm font-bold text-black block cursor-pointer" htmlFor="toggle-auto">
                  Kirim Otomatis Saat Posting Produk
                </label>
                <p className="text-xs text-black/60">
                  Jika aktif, webhook langsung dieksekusi secara otomatis setiap admin selesai menekan tombol simpan produk.
                </p>
              </div>
              <input
                id="toggle-auto"
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                className="w-5 h-5 accent-[#B83A0E] rounded cursor-pointer"
              />
            </div>

            {/* Target Platforms Checkboxes */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-black/60">
                Pilih Platform Tujuan
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center gap-3 p-3.5 rounded-2xl border border-black/10 hover:border-[#B83A0E] cursor-pointer transition-colors bg-white">
                  <input
                    type="checkbox"
                    checked={config.platforms.instagram}
                    onChange={(e) => setConfig({
                      ...config,
                      platforms: { ...config.platforms, instagram: e.target.checked }
                    })}
                    className="w-4 h-4 accent-[#B83A0E]"
                  />
                  <div>
                    <span className="text-xs font-bold text-black block">Instagram Feed & Story</span>
                    <span className="text-[11px] text-black/50">Kirim foto produk & caption ke Instagram</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3.5 rounded-2xl border border-black/10 hover:border-[#B83A0E] cursor-pointer transition-colors bg-white">
                  <input
                    type="checkbox"
                    checked={config.platforms.facebookPage}
                    onChange={(e) => setConfig({
                      ...config,
                      platforms: { ...config.platforms, facebookPage: e.target.checked }
                    })}
                    className="w-4 h-4 accent-[#B83A0E]"
                  />
                  <div>
                    <span className="text-xs font-bold text-black block">Facebook Fanpage</span>
                    <span className="text-[11px] text-black/50">Kirim status & postingan foto ke Halaman FB</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Webhook URL Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-black/60 flex items-center justify-between">
                <span>Webhook URL (Target HTTP POST)</span>
                <span className="text-[#B83A0E] text-[10px] font-normal">Wajib diisi</span>
              </label>
              <input
                type="url"
                required
                placeholder="https://hook.eu1.make.com/xxxx-xxxx atau https://hooks.zapier.com/hooks/catch/xxxx"
                value={config.webhookUrl}
                onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value })}
                className="w-full bg-[#FAF7F2] border border-[#E8DEC9] rounded-2xl px-4 py-3 text-sm text-black placeholder:text-black/30 focus:outline-none focus:border-[#B83A0E] font-mono"
              />
              <p className="text-[11px] text-black/50">
                Tip: Dapatkan Webhook URL gratis melalui <b>Make.com</b> (Modul <i>Custom Webhook</i>) atau <b>Zapier</b> (<i>Webhooks by Zapier</i>).
              </p>
            </div>

            {/* Secret Token Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-black/60 flex items-center justify-between">
                <span>Secret Token / Bearer Token (Opsional)</span>
                <span className="text-black/40 text-[10px] font-normal">Keamanan tambahan</span>
              </label>
              <input
                type="text"
                placeholder="misal: estore_secret_token_12345"
                value={config.secretToken || ''}
                onChange={(e) => setConfig({ ...config, secretToken: e.target.value })}
                className="w-full bg-[#FAF7F2] border border-[#E8DEC9] rounded-2xl px-4 py-3 text-sm text-black placeholder:text-black/30 focus:outline-none focus:border-[#B83A0E] font-mono"
              />
              <p className="text-[11px] text-black/50">
                Akan dikirim di header permintaan: <code className="bg-black/5 px-1 py-0.5 rounded text-[10px]">Authorization: Bearer [token]</code> dan <code className="bg-black/5 px-1 py-0.5 rounded text-[10px]">X-Webhook-Secret: [token]</code>.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-black/5 flex flex-wrap items-center justify-between gap-4">
            <button
              type="button"
              onClick={handleTestWebhook}
              disabled={isTesting}
              className="bg-black/5 hover:bg-black/10 text-black px-5 py-2.5 rounded-2xl text-xs font-bold transition-colors flex items-center gap-2"
            >
              {isTesting ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
              Test Koneksi
            </button>

            <div className="flex items-center gap-3">
              {saveSuccessMessage && (
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 animate-fade-in">
                  <CheckCircle2 size={16} /> {saveSuccessMessage}
                </span>
              )}
              <button
                type="submit"
                disabled={isSaving}
                className="bg-[#B83A0E] hover:bg-[#A0320B] text-white px-7 py-3 rounded-2xl text-xs font-bold transition-all shadow-md flex items-center gap-2"
              >
                {isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Tab 2: Caption Template Editor */}
      {activeTab === 'caption' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-black/5 shadow-sm space-y-6">
          <div className="space-y-2">
            <h3 className="font-bold text-black text-base flex items-center gap-2">
              <Sparkles size={18} className="text-[#B83A0E]" />
              Template Caption Otomatis Instagram & Facebook
            </h3>
            <p className="text-xs text-black/60">
              Sesuaikan format teks postingan yang akan diunggah ke Instagram dan Facebook Page. Anda bisa menyisipkan variabel otomatis di bawah ini.
            </p>
          </div>

          {/* Variables toolbar */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-black/60">
              Sisipkan Variabel Produk:
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { label: '{nama}', desc: 'Nama Produk' },
                { label: '{merek}', desc: 'Brand' },
                { label: '{harga}', desc: 'Harga Format Rp' },
                { label: '{harga_asli}', desc: 'Harga Coret/Asli' },
                { label: '{harga_asli_info}', desc: 'Info Hemat/Diskon' },
                { label: '{ukuran}', desc: 'Ukuran/Size' },
                { label: '{kondisi}', desc: 'Kondisi Produk' },
                { label: '{deskripsi}', desc: 'Deskripsi' },
                { label: '{link_produk}', desc: 'Link Website' },
                { label: '{whatsapp}', desc: 'Link Chat WA' },
                { label: '{hashtags}', desc: 'Hashtag' },
              ].map((v) => (
                <button
                  key={v.label}
                  type="button"
                  onClick={() => insertVariable(v.label)}
                  className="px-2.5 py-1.5 bg-[#FAF7F2] hover:bg-[#B83A0E] hover:text-white text-black/70 rounded-xl text-xs font-mono font-bold border border-[#E8DEC9] transition-colors"
                  title={v.desc}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          {/* Template Textarea */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-black/60">
                Format Teks Caption
              </label>
              <textarea
                rows={12}
                value={config.captionTemplate || ''}
                onChange={(e) => setConfig({ ...config, captionTemplate: e.target.value })}
                className="w-full bg-[#FAF7F2] border border-[#E8DEC9] rounded-2xl p-4 text-xs font-mono leading-relaxed text-black focus:outline-none focus:border-[#B83A0E]"
              />
              <button
                type="button"
                onClick={() => setConfig({ ...config, captionTemplate: DEFAULT_CAPTION_TEMPLATE })}
                className="text-xs font-bold text-[#B83A0E] hover:underline"
              >
                Kembalikan ke Template Default
              </button>
            </div>

            {/* Live Preview Card */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-black/60 flex items-center gap-1.5">
                <Eye size={14} className="text-[#B83A0E]" />
                Pratinjau Postingan (Live Preview)
              </label>
              <div className="bg-[#FAF7F2] border border-[#E8DEC9] rounded-2xl p-4 space-y-3 min-h-[280px]">
                <div className="flex items-center gap-2 pb-2 border-b border-black/10">
                  <div className="w-8 h-8 rounded-full bg-[#B83A0E] text-white flex items-center justify-center font-bold text-xs">
                    E
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-black">e.store.official</h5>
                    <p className="text-[10px] text-black/50">Majalengka, Jawa Barat</p>
                  </div>
                </div>

                <div className="whitespace-pre-line text-xs text-black/80 font-sans leading-relaxed select-text bg-white p-3 rounded-xl border border-black/5 shadow-inner">
                  {sampleCaption}
                </div>
              </div>
            </div>
          </div>

          {/* Hashtags field */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-black/60">
              Hashtags Otomatis
            </label>
            <input
              type="text"
              value={config.autoHashtags || ''}
              onChange={(e) => setConfig({ ...config, autoHashtags: e.target.value })}
              placeholder="#estore #sepatuoriginal #sneakers"
              className="w-full bg-[#FAF7F2] border border-[#E8DEC9] rounded-2xl px-4 py-3 text-xs text-black focus:outline-none focus:border-[#B83A0E]"
            />
          </div>

          <div className="pt-4 border-t border-black/5 flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="bg-[#B83A0E] hover:bg-[#A0320B] text-white px-7 py-3 rounded-2xl text-xs font-bold transition-all shadow-md"
            >
              {isSaving ? 'Menyimpan...' : 'Simpan Perubahan Template'}
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Direct Meta API (Optional) */}
      {activeTab === 'meta' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-black/5 shadow-sm space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              <Sliders size={14} /> Tingkat Lanjut (Direct Meta Graph API)
            </div>
            <h3 className="font-bold text-black text-base">
              Integrasi Langsung ke Meta Graph API (Tanpa Make/Zapier)
            </h3>
            <p className="text-xs text-black/60 leading-relaxed">
              Jika Anda memiliki Akun Pengembang Meta (Facebook Developer) dan Page Access Token, server kami dapat langsung menembak API Meta Graph untuk mempublikasikan foto & status tanpa perantara tools automasi.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
            <p className="font-bold">💡 Saran Kemudahan:</p>
            <p>
              Jika Anda belum terbiasa dengan Meta Graph API, kami <b>sangat merekomendasikan menggunakan Tab 'Pengaturan Webhook' dengan Make.com atau Zapier</b> karena pengaturannya hanya memakan waktu 2 menit tanpa perlu mendaftar aplikasi developer di Facebook.
            </p>
          </div>

          {/* Toggle Meta */}
          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8DEC9] flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-sm font-bold text-black block cursor-pointer" htmlFor="toggle-meta">
                Aktifkan Integrasi Langsung Meta API
              </label>
              <p className="text-xs text-black/60">
                Kirim langsung ke Facebook Page & Instagram Graph API via server backend
              </p>
            </div>
            <input
              id="toggle-meta"
              type="checkbox"
              checked={config.metaConfig?.enabled || false}
              onChange={(e) => setConfig({
                ...config,
                metaConfig: {
                  ...config.metaConfig,
                  enabled: e.target.checked,
                  pageAccessToken: config.metaConfig?.pageAccessToken || '',
                  pageId: config.metaConfig?.pageId || '',
                  instagramAccountId: config.metaConfig?.instagramAccountId || ''
                }
              })}
              className="w-5 h-5 accent-[#B83A0E] rounded cursor-pointer"
            />
          </div>

          {config.metaConfig?.enabled && (
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-black/60">
                  Facebook Page Access Token (Permanent / Long-lived)
                </label>
                <input
                  type="password"
                  placeholder="EAAG..."
                  value={config.metaConfig?.pageAccessToken || ''}
                  onChange={(e) => setConfig({
                    ...config,
                    metaConfig: {
                      ...config.metaConfig!,
                      pageAccessToken: e.target.value
                    }
                  })}
                  className="w-full bg-[#FAF7F2] border border-[#E8DEC9] rounded-2xl px-4 py-3 text-sm text-black font-mono focus:outline-none focus:border-[#B83A0E]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-black/60">
                    Facebook Page ID
                  </label>
                  <input
                    type="text"
                    placeholder="misal: 1048291048123"
                    value={config.metaConfig?.pageId || ''}
                    onChange={(e) => setConfig({
                      ...config,
                      metaConfig: {
                        ...config.metaConfig!,
                        pageId: e.target.value
                      }
                    })}
                    className="w-full bg-[#FAF7F2] border border-[#E8DEC9] rounded-2xl px-4 py-3 text-sm text-black font-mono focus:outline-none focus:border-[#B83A0E]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-black/60">
                    Instagram Business Account ID
                  </label>
                  <input
                    type="text"
                    placeholder="misal: 178414001928374"
                    value={config.metaConfig?.instagramAccountId || ''}
                    onChange={(e) => setConfig({
                      ...config,
                      metaConfig: {
                        ...config.metaConfig!,
                        instagramAccountId: e.target.value
                      }
                    })}
                    className="w-full bg-[#FAF7F2] border border-[#E8DEC9] rounded-2xl px-4 py-3 text-sm text-black font-mono focus:outline-none focus:border-[#B83A0E]"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-black/5 flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="bg-[#B83A0E] hover:bg-[#A0320B] text-white px-7 py-3 rounded-2xl text-xs font-bold transition-all shadow-md"
            >
              {isSaving ? 'Menyimpan...' : 'Simpan Konfigurasi Meta'}
            </button>
          </div>
        </div>
      )}

      {/* Tab 4: Logs History */}
      {activeTab === 'logs' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-black/5 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-black text-base flex items-center gap-2">
                <History size={18} className="text-[#B83A0E]" />
                Riwayat Pengiriman Webhook
              </h3>
              <p className="text-xs text-black/60">
                Log eksekusi webhook saat posting produk atau pengetesan.
              </p>
            </div>

            {logs.length > 0 && (
              <button
                type="button"
                onClick={handleClearLogs}
                className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 hover:bg-red-50 transition-colors"
              >
                <Trash2 size={14} /> Bersihkan Log
              </button>
            )}
          </div>

          {logs.length === 0 ? (
            <div className="text-center py-12 space-y-3 bg-[#FAF7F2] rounded-2xl border border-dashed border-[#E8DEC9]">
              <History size={36} className="mx-auto text-black/20" />
              <p className="text-xs font-bold text-black/60">Belum ada riwayat pengiriman webhook.</p>
              <button
                type="button"
                onClick={handleTestWebhook}
                className="text-xs font-bold text-[#B83A0E] hover:underline"
              >
                Kirim Test Webhook Sekarang
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-black/10 text-black/50 font-bold uppercase text-[10px]">
                    <th className="py-3 px-2">Waktu</th>
                    <th className="py-3 px-2">Produk</th>
                    <th className="py-3 px-2">Event</th>
                    <th className="py-3 px-2">Status</th>
                    <th className="py-3 px-2">Pesan Response</th>
                    <th className="py-3 px-2 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-black/[0.02]">
                      <td className="py-3 px-2 whitespace-nowrap text-black/60">
                        {new Date(log.timestamp).toLocaleString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="py-3 px-2 font-bold text-black max-w-[180px] truncate" title={log.productName}>
                        {log.productName}
                      </td>
                      <td className="py-3 px-2 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-black/5 text-black/70">
                          {log.event}
                        </span>
                      </td>
                      <td className="py-3 px-2 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          log.status === 'success' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : log.status === 'partial' 
                            ? 'bg-amber-100 text-amber-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {log.status === 'success' ? 'Sukses' : log.status === 'partial' ? 'Parsial' : 'Gagal'}
                          {log.statusCode ? ` (${log.statusCode})` : ''}
                        </span>
                      </td>
                      <td className="py-3 px-2 max-w-[240px] truncate text-black/70" title={log.message}>
                        {log.message}
                      </td>
                      <td className="py-3 px-2 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedLogPayload(log)}
                          className="text-[#B83A0E] font-bold hover:underline"
                        >
                          Detail Payload
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Guide */}
      {activeTab === 'guide' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-black/5 shadow-sm space-y-6">
          <div className="space-y-2">
            <h3 className="font-bold text-black text-base flex items-center gap-2">
              <HelpCircle size={18} className="text-[#B83A0E]" />
              Panduan Menghubungkan Webhook ke Instagram & Facebook Page
            </h3>
            <p className="text-xs text-black/60">
              Gunakan panduan berikut untuk menghubungkan toko Anda dengan Instagram & Facebook Page secara otomatis.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Make.com Guide */}
            <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#E8DEC9] space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-black flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-purple-600 text-white flex items-center justify-center text-xs font-black">M</span>
                  Cara Pakai dengan Make.com (Direkomendasikan)
                </h4>
                <a 
                  href="https://www.make.com" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="text-xs text-purple-600 font-bold flex items-center gap-1 hover:underline"
                >
                  Buka Make <ExternalLink size={12} />
                </a>
              </div>
              <ol className="text-xs text-black/70 space-y-2 list-decimal list-inside leading-relaxed">
                <li>Buka akun di <b>Make.com</b> lalu buat <b>Scenario Baru</b>.</li>
                <li>Tambahkan modul pertama: <b>Webhooks</b> &rarr; pilih <b>Custom Webhook</b>.</li>
                <li>Salin Webhook URL yang diberikan Make, lalu tempel ke tab <b>Pengaturan Webhook</b> di atas.</li>
                <li>Klik tombol <b>Kirim Test Webhook</b> di E STORE untuk mengirimkan contoh data ke Make.</li>
                <li>Tambahkan modul kedua: <b>Instagram for Business</b> &rarr; <b>Create a Photo Post</b> (pilih <code className="bg-white px-1 rounded">product.imageUrl</code> dan <code className="bg-white px-1 rounded">social.caption</code>).</li>
                <li>Tambahkan modul ketiga: <b>Facebook Pages</b> &rarr; <b>Create a Post</b>.</li>
                <li>Aktifkan Scenario ke <b>ON</b>. Selesai!</li>
              </ol>
            </div>

            {/* Prompt Make.com AI */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-50 via-white to-pink-50 border border-purple-200 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 bg-purple-600 text-white text-[10px] font-black rounded-lg uppercase tracking-wider">
                    Make.com AI Assistant
                  </span>
                  <span className="text-[11px] font-bold text-purple-700">Auto-Generate Scenario</span>
                </div>
                <h4 className="font-bold text-sm text-black flex items-center gap-1.5">
                  <Sparkles size={16} className="text-purple-600" />
                  Prompt untuk Make.com AI Scenario Builder
                </h4>
                <p className="text-xs text-black/60 leading-relaxed">
                  Buka Make.com &rarr; klik <b>Create a Scenario with AI</b>, lalu tempelkan prompt ini:
                </p>
                <div className="p-3 bg-white rounded-xl border border-purple-200 text-xs font-mono text-black/80 whitespace-pre-line leading-relaxed shadow-inner">
{`Create a scenario with a Custom Webhook trigger that receives e-commerce product data. Then add Instagram for Business "Create a Photo Post" using the product imageUrl and caption, and add Facebook Pages "Create a Photo Post" or "Create a Post" using the same product imageUrl and caption.`}
                </div>
              </div>

              <button
                type="button"
                onClick={() => copyToClipboard(`Create a scenario with a Custom Webhook trigger that receives e-commerce product data. Then add Instagram for Business "Create a Photo Post" using the product imageUrl and caption, and add Facebook Pages "Create a Photo Post" or "Create a Post" using the same product imageUrl and caption.`)}
                className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Copy size={13} /> {copiedText ? 'Tersalin!' : 'Salin Prompt Make.com AI'}
              </button>
            </div>
          </div>

          {/* Sample Payload Card */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-black/60">
                Struktur Data JSON Webhook yang Dikirimkan:
              </label>
              <button
                type="button"
                onClick={() => copyToClipboard(sampleJsonPayload)}
                className="text-xs font-bold text-[#B83A0E] hover:underline flex items-center gap-1"
              >
                <Copy size={13} /> {copiedText ? 'Tersalin!' : 'Salin Contoh JSON'}
              </button>
            </div>
            <pre className="p-4 bg-[#181512] text-emerald-400 rounded-2xl text-xs font-mono overflow-x-auto max-h-72 leading-relaxed">
              {sampleJsonPayload}
            </pre>
          </div>
        </div>
      )}

      {/* Tab 6: Bio Recommendations */}
      {activeTab === 'bio' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-black/5 shadow-sm space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-50 text-[#B83A0E] border border-orange-200">
              <UserCheck size={14} /> Profil & Branding Sosial Media
            </div>
            <h3 className="font-bold text-black text-base">
              Rekomendasi Bio Profil untuk Instagram & Facebook Page (E STORE)
            </h3>
            <p className="text-xs text-black/60 leading-relaxed">
              Pilih gaya bio yang paling sesuai dengan target pasar Anda. Cukup klik tombol <b>Salin Bio</b> di bawah lalu tempel langsung di menu <i>Edit Profil</i> Instagram atau <i>Tentang / About</i> Facebook Page.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Opsi 1 */}
            <div className="p-6 rounded-3xl bg-[#FAF7F2] border border-[#E8DEC9] space-y-4 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 bg-[#B83A0E] text-white text-[10px] font-black rounded-lg uppercase tracking-wider">
                    Paling Direkomendasikan
                  </span>
                  <span className="text-xs font-bold text-black/40">Gaya Profesional & Terpercaya</span>
                </div>
                <h4 className="font-bold text-sm text-black">Opsi 1: Elegan & Trustworthy</h4>
                <div className="p-4 bg-white rounded-2xl border border-black/10 text-xs text-black/80 font-mono whitespace-pre-line leading-relaxed shadow-inner">
{`👟 E STORE | Shoes Store Terpercaya
✨ 100% Original Sneaker & Casual Shoes
📍 Majalengka, Jawa Barat • Kirim Se-Indonesia
📦 Nike • Jordan • Adidas • New Balance • Vans
👇 Katalog & Order via WhatsApp:`}
                </div>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(`👟 E STORE | Shoes Store Terpercaya\n✨ 100% Original Sneaker & Casual Shoes\n📍 Majalengka, Jawa Barat • Kirim Se-Indonesia\n📦 Nike • Jordan • Adidas • New Balance • Vans\n👇 Katalog & Order via WhatsApp:`)}
                className="w-full py-2.5 bg-[#B83A0E] hover:bg-[#A0320B] text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <Copy size={14} /> Salin Bio Opsi 1
              </button>
            </div>

            {/* Opsi 2 */}
            <div className="p-6 rounded-3xl bg-[#FAF7F2] border border-[#E8DEC9] space-y-4 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 bg-purple-600 text-white text-[10px] font-black rounded-lg uppercase tracking-wider">
                    Anak Muda & Hype
                  </span>
                  <span className="text-xs font-bold text-black/40">Gaya Kekinian / Sneakerhead</span>
                </div>
                <h4 className="font-bold text-sm text-black">Opsi 2: Hype & Streetwear Style</h4>
                <div className="p-4 bg-white rounded-2xl border border-black/10 text-xs text-black/80 font-mono whitespace-pre-line leading-relaxed shadow-inner">
{`👟 Step Up Your Style with E STORE
🔥 Curated Original Sneakers & Daily Steals
💯 Garansi 100% Original Authentic
⚡️ Fresh Drops Tiap Minggu | Bisa COD / Rekber
🛒 Amankan size-mu sekarang di link bawah 👇`}
                </div>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(`👟 Step Up Your Style with E STORE\n🔥 Curated Original Sneakers & Daily Steals\n💯 Garansi 100% Original Authentic\n⚡️ Fresh Drops Tiap Minggu | Bisa COD / Rekber\n🛒 Amankan size-mu sekarang di link bawah 👇`)}
                className="w-full py-2.5 bg-black hover:bg-black/80 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <Copy size={14} /> Salin Bio Opsi 2
              </button>
            </div>

            {/* Opsi 3 */}
            <div className="p-6 rounded-3xl bg-[#FAF7F2] border border-[#E8DEC9] space-y-4 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 bg-zinc-700 text-white text-[10px] font-black rounded-lg uppercase tracking-wider">
                    Minimalis
                  </span>
                  <span className="text-xs font-bold text-black/40">Gaya Bersih & Straight to Point</span>
                </div>
                <h4 className="font-bold text-sm text-black">Opsi 3: Minimalis & Clean</h4>
                <div className="p-4 bg-white rounded-2xl border border-black/10 text-xs text-black/80 font-mono whitespace-pre-line leading-relaxed shadow-inner">
{`E STORE — Authentic Footwear Majalengka
Curated Sneakers, Sport, & Formal Shoes.
📍 Offline Store & Online Worldwide Shipping 📦
Lihat koleksi lengkap & checkout: ⬇️`}
                </div>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(`E STORE — Authentic Footwear Majalengka\nCurated Sneakers, Sport, & Formal Shoes.\n📍 Offline Store & Online Worldwide Shipping 📦\nLihat koleksi lengkap & checkout: ⬇️`)}
                className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-900 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <Copy size={14} /> Salin Bio Opsi 3
              </button>
            </div>

            {/* Opsi 4: Khusus Facebook Page */}
            <div className="p-6 rounded-3xl bg-[#FAF7F2] border border-[#E8DEC9] space-y-4 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 bg-blue-600 text-white text-[10px] font-black rounded-lg uppercase tracking-wider">
                    Khusus Halaman FB
                  </span>
                  <span className="text-xs font-bold text-black/40">Deskripsi Lengkap Facebook Page</span>
                </div>
                <h4 className="font-bold text-sm text-black">Opsi 4: FB Page About / Deskripsi</h4>
                <div className="p-4 bg-white rounded-2xl border border-black/10 text-xs text-black/80 font-mono whitespace-pre-line leading-relaxed shadow-inner">
{`E STORE Official adalah toko sepatu online terpercaya yang berpusat di Majalengka, Jawa Barat. Menyediakan aneka pilihan sepatu sneaker, olahraga, kasual, dan formal 100% original dari brand ternama dunia (Nike, Adidas, New Balance, Converse, Vans, Puma).

✅ 100% Garansi Original
✅ Real Pict Asli & Kondisi Terkurasi
✅ Pengiriman Cepat ke Seluruh Indonesia
📲 WhatsApp: +62 851-7955-0150
🌐 Katalog Web & Pemesanan: [Link Website E STORE]`}
                </div>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(`E STORE Official adalah toko sepatu online terpercaya yang berpusat di Majalengka, Jawa Barat. Menyediakan aneka pilihan sepatu sneaker, olahraga, kasual, dan formal 100% original dari brand ternama dunia (Nike, Adidas, New Balance, Converse, Vans, Puma).\n\n✅ 100% Garansi Original\n✅ Real Pict Asli & Kondisi Terkurasi\n✅ Pengiriman Cepat ke Seluruh Indonesia\n📲 WhatsApp: +62 851-7955-0150\n🌐 Katalog Web & Pemesanan: https://estore.id`)}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <Copy size={14} /> Salin Bio Khusus FB Page
              </button>
            </div>
          </div>

          {/* Checklist Pengaturan Profil Sosial Media */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200/80 space-y-3 text-xs">
            <h5 className="font-bold text-black text-sm flex items-center gap-2">
              <Smartphone size={16} className="text-[#B83A0E]" />
              Checklist Setting Profil Instagram & FB Page yang Efektif:
            </h5>
            <ul className="space-y-1.5 text-black/80 list-disc list-inside leading-relaxed">
              <li><b>Nama Akun:</b> Gunakan <code className="bg-white px-1.5 py-0.5 rounded font-bold">E STORE | Sepatu Original</code> agar muncul saat orang mencari kata kunci "sepatu original".</li>
              <li><b>Username IG:</b> Misal <code className="bg-white px-1.5 py-0.5 rounded font-bold">@estore.official</code> atau <code className="bg-white px-1.5 py-0.5 rounded font-bold">@estore_shoes</code>.</li>
              <li><b>Kategori Profil:</b> Pilih <i>Toko Sepatu</i> / <i>Toko Pakaian</i> / <i>Shopping & Retail</i>.</li>
              <li><b>Tautan Link di Bio:</b> Masukkan link katalog website E STORE atau link WhatsApp resmi toko.</li>
              <li><b>Highlight Story (Sorotan IG):</b> Buat sorotan bertema <i>TESTIMONI</i>, <i>READY STOCK</i>, <i>CARA ORDER</i>, dan <i>RESI PENGIRIMAN</i>.</li>
            </ul>
          </div>
        </div>
      )}
      {selectedLogPayload && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-black/10">
            <div className="flex items-center justify-between pb-3 border-b border-black/10">
              <h4 className="font-bold text-sm text-black">
                Detail Payload Webhook: {selectedLogPayload.productName}
              </h4>
              <button
                type="button"
                onClick={() => setSelectedLogPayload(null)}
                className="w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center font-bold text-xs"
              >
                ✕
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 font-mono text-xs bg-[#FAF7F2] rounded-2xl my-3">
              <pre className="whitespace-pre-wrap text-black/80">
                {JSON.stringify(selectedLogPayload.payload || selectedLogPayload, null, 2)}
              </pre>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  copyToClipboard(JSON.stringify(selectedLogPayload.payload || selectedLogPayload, null, 2));
                }}
                className="px-4 py-2 bg-black/5 hover:bg-black/10 text-black text-xs font-bold rounded-xl flex items-center gap-1.5"
              >
                <Copy size={13} /> {copiedText ? 'Tersalin!' : 'Salin Payload'}
              </button>
              <button
                type="button"
                onClick={() => setSelectedLogPayload(null)}
                className="px-5 py-2 bg-[#B83A0E] text-white text-xs font-bold rounded-xl"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
