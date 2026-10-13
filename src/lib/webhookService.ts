import { Product } from '../types';
import { CONTACT_INFO, STORE } from '../constants';
import { db, isFirebaseEnabled } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface WebhookConfig {
  enabled: boolean;
  webhookUrl: string;
  secretToken?: string;
  platforms: {
    instagram: boolean;
    facebookPage: boolean;
  };
  metaConfig?: {
    enabled: boolean;
    pageAccessToken: string;
    pageId: string;
    instagramAccountId: string;
  };
  captionTemplate?: string;
  autoHashtags?: string;
}

export interface WebhookLog {
  id: string;
  timestamp: string;
  productId?: string;
  productName: string;
  event: 'product.created' | 'product.updated' | 'test' | 'manual_push';
  status: 'success' | 'failed' | 'partial';
  statusCode?: number;
  message: string;
  platforms: string[];
  payload?: any;
}

export const DEFAULT_CAPTION_TEMPLATE = `🔥 READY STOCK DI E STORE!
👟 {nama}
✨ Brand: {merek}
📏 Ukuran: {ukuran}
💎 Kondisi: {kondisi}
💰 Harga: {harga} {harga_asli_info}

{deskripsi}

📍 Lokasi Toko: Majalengka, Jawa Barat
📦 Pengiriman ke Seluruh Indonesia
🛒 Beli langsung di Website:
{link_produk}

📲 Fast Response Order via WhatsApp:
{whatsapp}

{hashtags}`;

export const DEFAULT_HASHTAGS = `#estore #sepatuoriginal #sneakersindonesia #prelovedshoes #sepatubekas #sepatubranded #jualsepatu #sneakersmajalengka #originalshoes #ootd`;

export const DEFAULT_WEBHOOK_CONFIG: WebhookConfig = {
  enabled: true,
  webhookUrl: '',
  secretToken: '',
  platforms: {
    instagram: true,
    facebookPage: true
  },
  metaConfig: {
    enabled: false,
    pageAccessToken: '',
    pageId: '',
    instagramAccountId: ''
  },
  captionTemplate: DEFAULT_CAPTION_TEMPLATE,
  autoHashtags: DEFAULT_HASHTAGS
};

const STORAGE_KEY_CONFIG = 'estore_webhook_config';
const STORAGE_KEY_LOGS = 'estore_webhook_logs';

export function getLocalWebhookConfig(): WebhookConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_WEBHOOK_CONFIG,
        ...parsed,
        platforms: {
          ...DEFAULT_WEBHOOK_CONFIG.platforms,
          ...(parsed.platforms || {})
        },
        metaConfig: {
          ...DEFAULT_WEBHOOK_CONFIG.metaConfig,
          ...(parsed.metaConfig || {})
        }
      };
    }
  } catch (e) {
    console.error('Error reading webhook config from localStorage:', e);
  }
  return DEFAULT_WEBHOOK_CONFIG;
}

export async function fetchWebhookConfig(): Promise<WebhookConfig> {
  const local = getLocalWebhookConfig();
  if (isFirebaseEnabled && db) {
    try {
      const docRef = doc(db, 'system_settings', 'webhook');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const remote = snap.data() as WebhookConfig;
        const merged = { ...local, ...remote };
        localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(merged));
        return merged;
      }
    } catch (e: any) {
      if (e?.code !== 'permission-denied') {
        console.warn('Could not fetch webhook config from Firestore, using local:', e);
      }
    }
  }
  return local;
}

export async function saveWebhookConfig(config: WebhookConfig): Promise<void> {
  localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
  if (isFirebaseEnabled && db) {
    try {
      const docRef = doc(db, 'system_settings', 'webhook');
      await setDoc(docRef, config, { merge: true });
    } catch (e: any) {
      if (e?.code !== 'permission-denied') {
        console.warn('Could not save webhook config to Firestore:', e);
      }
    }
  }
}

function sanitizeLogPayload(payload: any): any {
  if (!payload || typeof payload !== 'object') return payload;
  try {
    const clone = { ...payload };
    if ('rawBase64Image' in clone) {
      delete clone.rawBase64Image;
    }
    if (clone.product && typeof clone.product === 'object') {
      const prod = { ...clone.product };
      if (Array.isArray(prod.images)) {
        prod.images = prod.images.map((img: any) =>
          typeof img === 'string' && img.startsWith('data:') ? '[Base64 Image Omitted]' : img
        );
      }
      clone.product = prod;
    }
    return clone;
  } catch {
    return { summary: 'Payload sanitized for storage' };
  }
}

export function getWebhookLogs(): WebhookLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOGS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading webhook logs:', e);
  }
  return [];
}

export function addWebhookLog(log: WebhookLog): void {
  try {
    const cleanLog: WebhookLog = {
      ...log,
      payload: sanitizeLogPayload(log.payload)
    };

    const logs = getWebhookLogs();
    let updated = [cleanLog, ...logs].slice(0, 15);

    try {
      localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(updated));
    } catch (quotaErr) {
      console.warn('LocalStorage quota reached, pruning webhook logs:', quotaErr);
      try {
        updated = [cleanLog, ...logs].slice(0, 3);
        localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(updated));
      } catch {
        try {
          localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify([cleanLog]));
        } catch {
          localStorage.removeItem(STORAGE_KEY_LOGS);
        }
      }
    }
  } catch (e) {
    console.warn('Safe warning: Error saving webhook log suppressed to prevent blocking UI:', e);
  }
}

export function clearWebhookLogs(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_LOGS);
  } catch (e) {
    console.error('Error clearing webhook logs:', e);
  }
}

export function formatRupiah(amount: number): string {
  return 'Rp ' + (amount || 0).toLocaleString('id-ID');
}

export function generateProductCaption(
  product: Partial<Product>,
  config?: WebhookConfig
): string {
  const cfg = config || getLocalWebhookConfig();
  const template = cfg.captionTemplate || DEFAULT_CAPTION_TEMPLATE;
  const hashtags = cfg.autoHashtags || DEFAULT_HASHTAGS;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://estore.id';
  const productUrl = product.id ? `${origin}/product/${product.id}` : origin;

  const formattedPrice = formatRupiah(product.price || 0);
  const hargaAsliInfo = product.originalPrice && product.originalPrice > (product.price || 0)
    ? `(Hemat dari ${formatRupiah(product.originalPrice)})`
    : '';

  const cleanWaNumber = (CONTACT_INFO.whatsapp || '+6285179550150').replace(/[^0-9]/g, '');
  const waUrl = `https://wa.me/${cleanWaNumber}?text=${encodeURIComponent(
    `Halo E STORE, saya mau tanya/order produk: ${product.name || 'Sepatu'} (${productUrl})`
  )}`;

  const sizesStr = Array.isArray(product.sizes) && product.sizes.length > 0
    ? product.sizes.join(', ')
    : 'Tersedia';

  return template
    .replace(/{nama}/g, product.name || 'Sepatu E STORE')
    .replace(/{merek}/g, product.brand || 'Original')
    .replace(/{kategori}/g, product.category || 'Sepatu')
    .replace(/{harga}/g, formattedPrice)
    .replace(/{harga_asli_info}/g, hargaAsliInfo)
    .replace(/{harga_asli}/g, product.originalPrice ? formatRupiah(product.originalPrice) : '')
    .replace(/{ukuran}/g, sizesStr)
    .replace(/{kondisi}/g, product.condition === 'baru' ? 'Baru (BNIB/BNWT)' : (product.condition || 'Preloved Mulus 100% Original'))
    .replace(/{deskripsi}/g, product.description || 'Koleksi sepatu original terkurasi dengan kondisi terbaik.')
    .replace(/{link_produk}/g, productUrl)
    .replace(/{whatsapp}/g, waUrl)
    .replace(/{hashtags}/g, hashtags);
}

export const DEFAULT_INSTAGRAM_JPEG = 'https://images.unsplash.com/photo-1552346154-21d32810aba3?fm=jpg&fit=crop&w=1080&h=1080&q=85';

export function ensureInstagramCompatibleJpeg(url: string | undefined): string {
  if (!url || typeof url !== 'string' || !url.trim().startsWith('http')) {
    return DEFAULT_INSTAGRAM_JPEG;
  }
  let clean = url.trim();

  // If unsplash, force fm=jpg and remove auto=format (which sends image/avif causing 36001 error)
  if (clean.includes('images.unsplash.com')) {
    clean = clean.replace(/auto=format/g, 'fm=jpg');
    if (!clean.includes('fm=jpg')) {
      clean += (clean.includes('?') ? '&' : '?') + 'fm=jpg&q=85';
    }
    return clean;
  }

  // If png or logo.png, fallback to guaranteed JPEG since Instagram strictly requires JPEG
  if (clean.toLowerCase().endsWith('.png') || clean.includes('/logo.png')) {
    return DEFAULT_INSTAGRAM_JPEG;
  }

  return clean;
}

export async function uploadBase64ToPublicCdn(dataUrl: string): Promise<string | null> {
  try {
    if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) {
      return null;
    }
    const commaIdx = dataUrl.indexOf(',');
    const base64Data = commaIdx !== -1 ? dataUrl.slice(commaIdx + 1) : dataUrl;
    if (!base64Data || base64Data.length < 50) {
      return null;
    }

    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/jpeg' });

    const form = new FormData();
    form.append('reqtype', 'fileupload');
    form.append('time', '72h');
    form.append('fileToUpload', blob, 'photo.jpg');

    const res = await fetch('https://litterbox.catbox.moe/resources/internals/api.php', {
      method: 'POST',
      body: form
    });
    const text = (await res.text()).trim();
    if (text.startsWith('http://') || text.startsWith('https://')) {
      return text;
    }
    return null;
  } catch (err) {
    console.warn('Browser CDN upload fallback:', err);
    return null;
  }
}

export function buildWebhookPayload(
  product: Product,
  event: 'product.created' | 'product.updated' | 'test' | 'manual_push',
  config: WebhookConfig
) {
  const caption = generateProductCaption(product, config);
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://estore.id';
  const productUrl = `${origin}/product/${product.id}`;

  const targetPlatforms: string[] = [];
  if (config.platforms.instagram) targetPlatforms.push('instagram');
  if (config.platforms.facebookPage) targetPlatforms.push('facebook_page');

  // 1. Get the actual primary photo of this specific product (prioritize publicImageUrl if explicitly provided)
  let realPrimaryImage = (product as any).publicImageUrl || '';
  if (!realPrimaryImage) {
    if (Array.isArray(product.images) && product.images.length > 0 && product.images[0]) {
      realPrimaryImage = product.images[0];
    } else if ((product as any).imageUrl) {
      realPrimaryImage = (product as any).imageUrl;
    }
  }

  // Guarantee that primaryImageUrl is a 100% valid HTTP/HTTPS URL so Make.com validation never throws BundleValidationError
  let primaryImageUrl = DEFAULT_INSTAGRAM_JPEG;
  let rawBase64 = '';

  if (realPrimaryImage) {
    if (realPrimaryImage.startsWith('http')) {
      primaryImageUrl = ensureInstagramCompatibleJpeg(realPrimaryImage);
    } else if (realPrimaryImage.startsWith('data:')) {
      rawBase64 = realPrimaryImage;
      // Provide valid public fallback URL for Make.com while keeping raw base64 for server upload
      primaryImageUrl = DEFAULT_INSTAGRAM_JPEG;
    }
  }

  const allImages = Array.isArray(product.images) && product.images.length > 0
    ? product.images.map(img => (typeof img === 'string' && img.startsWith('http') ? ensureInstagramCompatibleJpeg(img) : primaryImageUrl))
    : [primaryImageUrl];

  return {
    // Root-level convenience fields for Make.com / Zapier (1-click mapping)
    // Always guaranteed to be a valid http(s) URL
    photo_url: primaryImageUrl,
    photoUrl: primaryImageUrl,
    image_url: primaryImageUrl,
    imageUrl: primaryImageUrl,
    rawBase64Image: rawBase64 || undefined,
    caption: caption,
    message: caption,
    product_name: product.name,
    product_price: formatRupiah(product.price),
    product_url: productUrl,

    event,
    timestamp: new Date().toISOString(),
    source: 'E STORE Official App',
    store: {
      id: STORE.id,
      name: STORE.name,
      location: STORE.location,
      whatsapp: CONTACT_INFO.whatsapp,
      instagram: CONTACT_INFO.instagram
    },
    product: {
      id: product.id,
      name: product.name,
      brand: product.brand || 'Original',
      category: product.category,
      shoeModel: product.shoeModel || '',
      price: product.price,
      originalPrice: product.originalPrice || null,
      formattedPrice: formatRupiah(product.price),
      stock: product.stock,
      condition: product.condition || 'original',
      sizes: product.sizes || [],
      insoleLength: product.insoleLength || '',
      description: product.description || '',
      specifications: product.specifications || [],
      images: allImages,
      imageUrl: primaryImageUrl,
      youtubeUrl: product.youtubeUrl || '',
      url: productUrl
    },
    social: {
      caption,
      targetPlatforms,
      primaryImageUrl,
      hashtags: config.autoHashtags || DEFAULT_HASHTAGS
    }
  };
}

export async function dispatchProductWebhook(
  product: Product,
  event: 'product.created' | 'product.updated' | 'test' | 'manual_push' = 'product.created',
  customConfig?: WebhookConfig
): Promise<{ success: boolean; message: string; data?: any }> {
  const config = customConfig || (await fetchWebhookConfig());

  // Check if at least webhookUrl is configured or meta is enabled
  const hasWebhook = Boolean(config.webhookUrl && config.webhookUrl.trim());
  const hasMeta = Boolean(config.metaConfig?.enabled && config.metaConfig?.pageAccessToken);

  if (!hasWebhook && !hasMeta) {
    return {
      success: false,
      message: 'URL Webhook belum diatur. Silakan atur di Pengaturan Webhook Sosmed.'
    };
  }

  // Pre-upload base64 photo to public CDN if no public URL was provided
  let enrichedProduct = { ...product };
  const firstImg = Array.isArray(product.images) && product.images[0] ? product.images[0] : '';
  if (firstImg && firstImg.startsWith('data:') && !(product as any).publicImageUrl) {
    try {
      const cdnUrl = await uploadBase64ToPublicCdn(firstImg);
      if (cdnUrl) {
        enrichedProduct = {
          ...product,
          publicImageUrl: cdnUrl,
          images: [cdnUrl, ...(product.images || []).slice(1)]
        };
      }
    } catch (e) {
      console.warn('Pre-uploading image failed, relying on server proxy:', e);
    }
  }

  const payload = buildWebhookPayload(enrichedProduct, event, config);
  if (firstImg && firstImg.startsWith('data:')) {
    (payload as any).rawBase64Image = firstImg;
  }

  const platformsActive: string[] = [];
  if (config.platforms.instagram) platformsActive.push('Instagram');
  if (config.platforms.facebookPage) platformsActive.push('Facebook Page');

  try {
    // Dispatch via server-side proxy route (try both /api/webhook/dispatch and /api/webhook-dispatch)
    let res = await fetch('/api/webhook/dispatch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        webhookUrl: config.webhookUrl,
        secretToken: config.secretToken,
        payload,
        metaConfig: config.metaConfig
      })
    });

    // If 404 on Vercel serverless functions, retry with /api/webhook-dispatch
    if (res.status === 404) {
      try {
        res = await fetch('/api/webhook-dispatch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            webhookUrl: config.webhookUrl,
            secretToken: config.secretToken,
            payload,
            metaConfig: config.metaConfig
          })
        });
      } catch (e) {
        // continue
      }
    }

    // If server responded with error (404, 500, etc.) on Vercel, automatically dispatch directly to webhookUrl from browser!
    if (!res.ok && config.webhookUrl && config.webhookUrl.trim()) {
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json'
        };
        if (config.secretToken) {
          headers['Authorization'] = `Bearer ${config.secretToken}`;
        }
        const directRes = await fetch(config.webhookUrl.trim(), {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });

        const isDirectOk = directRes.ok;
        const log: WebhookLog = {
          id: `wh_${Date.now()}_direct`,
          timestamp: new Date().toISOString(),
          productId: product.id,
          productName: product.name,
          event,
          status: isDirectOk ? 'success' : 'failed',
          statusCode: directRes.status,
          message: isDirectOk ? 'Webhook berhasil dikirim ke Make.com (Direct)' : `Direct Webhook Gagal (${directRes.status})`,
          platforms: platformsActive,
          payload
        };
        addWebhookLog(log);

        return {
          success: isDirectOk,
          message: isDirectOk ? 'Webhook terkirim ke Instagram & FB Page' : `Gagal mengirim webhook (Status ${directRes.status})`,
          data: { statusCode: directRes.status }
        };
      } catch (directErr) {
        console.warn('Direct client fallback failed:', directErr);
      }
    }

    const rawText = await res.text();
    let result: any = null;
    try {
      result = JSON.parse(rawText);
    } catch {
      result = {
        success: false,
        summary: res.ok ? rawText : (res.status === 413 ? 'Ukuran payload foto terlalu besar.' : `Server merespons status ${res.status}`),
        error: rawText.slice(200)
      };
    }

    const isSuccess = res.ok && Boolean(result?.success);

    const log: WebhookLog = {
      id: `wh_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      productId: product.id,
      productName: product.name,
      event,
      status: isSuccess ? 'success' : (result?.webhookResult?.success ? 'partial' : 'failed'),
      statusCode: result?.webhookResult?.statusCode || res.status,
      message: result?.summary || (isSuccess ? 'Webhook berhasil dikirim' : result?.error || 'Gagal mengirim webhook'),
      platforms: platformsActive,
      payload
    };

    addWebhookLog(log);

    return {
      success: isSuccess,
      message: result.summary || (isSuccess ? 'Webhook terkirim ke Instagram & FB Page' : (result.error || 'Gagal mengirim webhook')),
      data: result
    };
  } catch (err: any) {
    console.error('Failed to dispatch webhook via server proxy:', err);

    // Fallback: If client is running standalone and webhookUrl supports CORS, attempt direct client fetch
    if (config.webhookUrl && config.webhookUrl.trim()) {
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json'
        };
        if (config.secretToken) {
          headers['Authorization'] = `Bearer ${config.secretToken}`;
        }
        const clientRes = await fetch(config.webhookUrl.trim(), {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });

        const log: WebhookLog = {
          id: `wh_${Date.now()}_direct`,
          timestamp: new Date().toISOString(),
          productId: product.id,
          productName: product.name,
          event,
          status: clientRes.ok ? 'success' : 'failed',
          statusCode: clientRes.status,
          message: clientRes.ok ? `Direct Webhook Sukses (HTTP ${clientRes.status})` : `Direct Webhook Gagal (HTTP ${clientRes.status})`,
          platforms: platformsActive,
          payload
        };
        addWebhookLog(log);

        return {
          success: clientRes.ok,
          message: `Webhook langsung terkirim (HTTP ${clientRes.status})`,
          data: { statusCode: clientRes.status }
        };
      } catch (clientErr: any) {
        console.error('Direct webhook also failed:', clientErr);
      }
    }

    const log: WebhookLog = {
      id: `wh_err_${Date.now()}`,
      timestamp: new Date().toISOString(),
      productId: product.id,
      productName: product.name,
      event,
      status: 'failed',
      statusCode: 0,
      message: err?.message || 'Koneksi ke endpoint webhook gagal',
      platforms: platformsActive,
      payload
    };
    addWebhookLog(log);

    return {
      success: false,
      message: err?.message || 'Terjadi kesalahan saat memproses webhook.'
    };
  }
}

export async function testWebhook(config: WebhookConfig) {
  const dummyProduct: Product = {
    id: 'test-product-sample',
    name: 'Nike Air Jordan 1 High Retro OG (Test Webhook)',
    brand: 'Nike',
    category: 'sepatu',
    shoeModel: 'Sepatu Kasual / Lifestyle',
    price: 1850000,
    originalPrice: 2499000,
    sizes: ['42', '42.5', '43'],
    condition: 'baru',
    stock: 1,
    description: 'Ini adalah payload uji coba (Test Webhook) untuk memastikan integrasi otomatisasi Instagram & Facebook Page bekerja dengan baik.',
    specifications: ['100% Original', 'Box Lengkap (BNIB)', 'Extra Laces'],
    images: [DEFAULT_INSTAGRAM_JPEG],
    storeId: STORE.id
  };

  return dispatchProductWebhook(dummyProduct, 'test', config);
}
