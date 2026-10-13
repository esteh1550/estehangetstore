import fs from 'fs';
import path from 'path';

export interface WebhookDispatchOptions {
  webhookUrl?: string;
  secretToken?: string;
  payload: any;
  metaConfig?: {
    enabled?: boolean;
    pageAccessToken?: string;
    pageId?: string;
    instagramAccountId?: string;
  };
  publicOrigin?: string;
}

export interface WebhookDispatchResult {
  success: boolean;
  timestamp: string;
  summary: string;
  webhookResult?: {
    success: boolean;
    statusCode: number;
    durationMs: number;
    response: any;
    error?: string;
  };
  facebookResult?: {
    success: boolean;
    postId?: string;
    error?: string;
  };
  instagramResult?: {
    success: boolean;
    mediaId?: string;
    error?: string;
  };
}

export const BRAND_JPEG_MAP: Record<string, string> = {
  nike: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?fm=jpg&fit=crop&w=1080&h=1080&q=85',
  jordan: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?fm=jpg&fit=crop&w=1080&h=1080&q=85',
  adidas: 'https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?fm=jpg&fit=crop&w=1080&h=1080&q=85',
  converse: 'https://images.unsplash.com/photo-1607522370275-f14206abe5d3?fm=jpg&fit=crop&w=1080&h=1080&q=85',
  vans: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?fm=jpg&fit=crop&w=1080&h=1080&q=85',
  'new balance': 'https://images.unsplash.com/photo-1539185441755-769473a23570?fm=jpg&fit=crop&w=1080&h=1080&q=85',
  puma: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?fm=jpg&fit=crop&w=1080&h=1080&q=85',
};

export function getBrandMatchedJpeg(brandName?: string, productName?: string): string {
  const combined = `${brandName || ''} ${productName || ''}`.toLowerCase();
  if (combined.includes('jordan')) return BRAND_JPEG_MAP.jordan;
  if (combined.includes('nike')) return BRAND_JPEG_MAP.nike;
  if (combined.includes('adidas')) return BRAND_JPEG_MAP.adidas;
  if (combined.includes('converse') || combined.includes('all star') || combined.includes('70s')) return BRAND_JPEG_MAP.converse;
  if (combined.includes('vans') || combined.includes('skool')) return BRAND_JPEG_MAP.vans;
  if (combined.includes('balance') || combined.includes('nb')) return BRAND_JPEG_MAP['new balance'];
  if (combined.includes('puma')) return BRAND_JPEG_MAP.puma;
  return 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?fm=jpg&fit=crop&w=1080&h=1080&q=85';
}

export function isExternallyAccessibleHttpUrl(url: string | undefined): boolean {
  if (!url || typeof url !== 'string' || !url.trim().startsWith('http')) return false;
  const clean = url.trim().toLowerCase();
  // Filter out localhost, internal IP addresses, and cookie-restricted AI studio dev domains (*.run.app)
  if (clean.includes('localhost') || clean.includes('127.0.0.1') || clean.includes('.run.app') || clean.includes('/logo.png')) {
    return false;
  }
  return true;
}

export const DEFAULT_JPEG_FALLBACK = "https://images.unsplash.com/photo-1552346154-21d32810aba3?fm=jpg&fit=crop&w=1080&h=1080&q=85";

export function formatForInstagramJpeg(url: string | undefined): string {
  if (!url || typeof url !== 'string' || !url.trim().startsWith('http')) {
    return DEFAULT_JPEG_FALLBACK;
  }
  let clean = url.trim();

  // If unsplash, force fm=jpg and remove auto=format (which causes image/avif 36001 error on Meta)
  if (clean.includes('images.unsplash.com')) {
    clean = clean.replace(/auto=format/g, 'fm=jpg');
    if (!clean.includes('fm=jpg')) {
      clean += (clean.includes('?') ? '&' : '?') + 'fm=jpg&q=85';
    }
    return clean;
  }

  // Only fallback if it's explicitly the default placeholder logo.png
  if (clean.includes('/logo.png')) {
    return DEFAULT_JPEG_FALLBACK;
  }

  return clean;
}

export function saveBase64ToPublicJpeg(dataUrl: string, productId: string, publicOrigin?: string): string {
  try {
    if (!dataUrl || typeof dataUrl !== 'string') return DEFAULT_JPEG_FALLBACK;
    if (!dataUrl.startsWith('data:')) {
      return formatForInstagramJpeg(dataUrl);
    }

    const commaIdx = dataUrl.indexOf(',');
    const base64Data = commaIdx !== -1 ? dataUrl.slice(commaIdx + 1) : dataUrl;
    if (!base64Data || base64Data.length < 50) {
      return DEFAULT_JPEG_FALLBACK;
    }

    const buffer = Buffer.from(base64Data, 'base64');
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const cleanId = (productId || 'prod').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `shoe_${cleanId}_${Date.now()}.jpg`;
    const filepath = path.join(uploadsDir, filename);
    fs.writeFileSync(filepath, buffer);

    const origin = (publicOrigin && publicOrigin.startsWith('http') && !publicOrigin.includes('localhost') && !publicOrigin.includes('127.0.0.1'))
      ? publicOrigin
      : 'https://ais-dev-psu5hzueipibaar3vwmcf4-294921380831.asia-east1.run.app';

    return `${origin}/uploads/${filename}`;
  } catch (err) {
    console.error('Error saving base64 to public JPEG file:', err);
    return DEFAULT_JPEG_FALLBACK;
  }
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

    const buffer = Buffer.from(base64Data, 'base64');
    const form = new FormData();
    form.append('reqtype', 'fileupload');
    form.append('time', '72h');
    form.append('fileToUpload', new Blob([buffer], { type: 'image/jpeg' }), 'shoe_upload.jpg');

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
    console.warn('Public CDN upload error:', err);
    return null;
  }
}

export async function processWebhookDispatch(options: WebhookDispatchOptions): Promise<WebhookDispatchResult> {
  const { webhookUrl, secretToken, payload, metaConfig, publicOrigin } = options;
  const timestamp = new Date().toISOString();

  // 1. Process and guarantee 100% public JPEG image URL for the ACTUAL product photo
  const baseOrigin = publicOrigin || 'https://ais-dev-psu5hzueipibaar3vwmcf4-294921380831.asia-east1.run.app';
  const prodId = payload?.product?.id || 'product';

  // Look for the actual product image first (prioritizing real images)
  let rawImg = '';
  if (Array.isArray(payload?.product?.images) && payload.product.images.length > 0 && payload.product.images[0]) {
    rawImg = payload.product.images[0];
  } else if (payload?.product?.imageUrl) {
    rawImg = payload.product.imageUrl;
  } else if (payload?.social?.primaryImageUrl) {
    rawImg = payload.social.primaryImageUrl;
  } else if (payload?.photo_url) {
    rawImg = payload.photo_url;
  }

  let finalJpegUrl = '';
  // Case A: If already an accessible external public HTTP image URL (not localhost or .run.app)
  if (rawImg && typeof rawImg === 'string' && rawImg.startsWith('http') && isExternallyAccessibleHttpUrl(rawImg)) {
    finalJpegUrl = formatForInstagramJpeg(rawImg);
  }
  // Case B: If image is a base64 string (user uploaded photo from phone / gallery / camera)
  else if (rawImg && typeof rawImg === 'string' && rawImg.startsWith('data:')) {
    // Upload the EXACT photo to public direct JPEG CDN so Instagram can fetch the real photo!
    const cdnUrl = await uploadBase64ToPublicCdn(rawImg);
    if (cdnUrl) {
      finalJpegUrl = cdnUrl;
    } else {
      finalJpegUrl = getBrandMatchedJpeg(payload?.product?.brand, payload?.product?.name);
    }
  }
  // Case C: Fallback
  else {
    finalJpegUrl = getBrandMatchedJpeg(payload?.product?.brand, payload?.product?.name);
  }

  // Set this guaranteed public JPEG URL across ALL image parameters (never send binary or data: URLs)
  if (payload) {
    payload.photo_url = finalJpegUrl;
    payload.photoUrl = finalJpegUrl;
    payload.image_url = finalJpegUrl;
    payload.imageUrl = finalJpegUrl;

    if (payload.product) {
      payload.product.imageUrl = finalJpegUrl;
      if (Array.isArray(payload.product.images)) {
        payload.product.images = payload.product.images.map((img: any) => {
          if (typeof img === 'string' && img.startsWith('data:')) {
            return finalJpegUrl;
          }
          return typeof img === 'string' ? formatForInstagramJpeg(img) : finalJpegUrl;
        });
      } else {
        payload.product.images = [finalJpegUrl];
      }
    }

    if (payload.social) {
      payload.social.primaryImageUrl = finalJpegUrl;
    }
  }

  let overallSuccess = true;
  const summaries: string[] = [];
  let webhookResult: WebhookDispatchResult['webhookResult'];
  let facebookResult: WebhookDispatchResult['facebookResult'];
  let instagramResult: WebhookDispatchResult['instagramResult'];

  // 1. Dispatch to Webhook URL (Make.com, Zapier, n8n, custom endpoint)
  if (webhookUrl && webhookUrl.trim().startsWith('http')) {
    const startTime = Date.now();
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'EStore-Webhook-Agent/1.0',
        'X-EStore-Event': payload?.event || 'product.created',
        'X-EStore-Timestamp': timestamp
      };

      if (secretToken && secretToken.trim()) {
        headers['Authorization'] = `Bearer ${secretToken.trim()}`;
        headers['X-Webhook-Secret'] = secretToken.trim();
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(webhookUrl.trim(), {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const durationMs = Date.now() - startTime;

      let resData: any = null;
      const text = await response.text();
      try {
        resData = JSON.parse(text);
      } catch {
        resData = text.slice(0, 500);
      }

      if (response.ok) {
        webhookResult = {
          success: true,
          statusCode: response.status,
          durationMs,
          response: resData
        };
        summaries.push(`Webhook URL berhasil terkirim (HTTP ${response.status})`);
      } else {
        overallSuccess = false;
        webhookResult = {
          success: false,
          statusCode: response.status,
          durationMs,
          response: resData,
          error: `Endpoint merespons HTTP ${response.status}`
        };
        summaries.push(`Webhook URL gagal: HTTP ${response.status}`);
      }
    } catch (err: any) {
      overallSuccess = false;
      const durationMs = Date.now() - startTime;
      const errMsg = err?.name === 'AbortError' ? 'Timeout (15 detik)' : (err?.message || 'Gagal menghubungi server webhook');
      webhookResult = {
        success: false,
        statusCode: 0,
        durationMs,
        response: null,
        error: errMsg
      };
      summaries.push(`Webhook URL error: ${errMsg}`);
    }
  }

  // 2. Direct Meta Graph API (Facebook Page & Instagram Business)
  if (metaConfig?.enabled && metaConfig.pageAccessToken) {
    const token = metaConfig.pageAccessToken.trim();
    const caption = payload?.social?.caption || payload?.product?.name || '';
    const imageUrl = payload?.product?.images?.[0] || payload?.product?.imageUrl || '';

    // A. Facebook Page Posting
    if (metaConfig.pageId && metaConfig.pageId.trim()) {
      const pageId = metaConfig.pageId.trim();
      try {
        let fbUrl = `https://graph.facebook.com/v19.0/${pageId}/feed`;
        const fbBody: Record<string, string> = {
          access_token: token,
          message: caption
        };

        // If valid public image is available, use /photos endpoint for richer post
        if (imageUrl && imageUrl.startsWith('http')) {
          fbUrl = `https://graph.facebook.com/v19.0/${pageId}/photos`;
          fbBody['url'] = imageUrl;
          fbBody['caption'] = caption;
          delete fbBody['message'];
        }

        const fbRes = await fetch(fbUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(fbBody)
        });

        const fbData = await fbRes.json();
        if (fbRes.ok && (fbData.id || fbData.post_id)) {
          facebookResult = {
            success: true,
            postId: fbData.id || fbData.post_id
          };
          summaries.push(`Facebook Page post berhasil (ID: ${fbData.id || fbData.post_id})`);
        } else {
          overallSuccess = false;
          facebookResult = {
            success: false,
            error: fbData?.error?.message || 'Gagal memposting ke Facebook Page'
          };
          summaries.push(`Facebook Page error: ${facebookResult.error}`);
        }
      } catch (fbErr: any) {
        overallSuccess = false;
        facebookResult = {
          success: false,
          error: fbErr?.message || 'Koneksi ke Facebook API gagal'
        };
        summaries.push(`Facebook error: ${facebookResult.error}`);
      }
    }

    // B. Instagram Business Account Posting
    if (metaConfig.instagramAccountId && metaConfig.instagramAccountId.trim()) {
      const igId = metaConfig.instagramAccountId.trim();
      try {
        if (!imageUrl || !imageUrl.startsWith('http')) {
          throw new Error('Instagram mewajibkan foto produk dengan URL publik (https://)');
        }

        // Step 1: Create media container
        const step1Res = await fetch(`https://graph.facebook.com/v19.0/${igId}/media`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image_url: imageUrl,
            caption: caption,
            access_token: token
          })
        });

        const step1Data = await step1Res.json();
        if (!step1Res.ok || !step1Data.id) {
          throw new Error(step1Data?.error?.message || 'Gagal membuat container media Instagram');
        }

        const creationId = step1Data.id;

        // Step 2: Publish media container
        const step2Res = await fetch(`https://graph.facebook.com/v19.0/${igId}/media_publish`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            creation_id: creationId,
            access_token: token
          })
        });

        const step2Data = await step2Res.json();
        if (step2Res.ok && step2Data.id) {
          instagramResult = {
            success: true,
            mediaId: step2Data.id
          };
          summaries.push(`Instagram post berhasil (ID: ${step2Data.id})`);
        } else {
          throw new Error(step2Data?.error?.message || 'Gagal mempublikasikan media ke Instagram');
        }
      } catch (igErr: any) {
        overallSuccess = false;
        instagramResult = {
          success: false,
          error: igErr?.message || 'Gagal posting ke Instagram'
        };
        summaries.push(`Instagram error: ${instagramResult.error}`);
      }
    }
  }

  if (summaries.length === 0) {
    return {
      success: false,
      timestamp,
      summary: 'Tidak ada tujuan webhook atau akun Meta yang aktif dikonfigurasi.',
      webhookResult,
      facebookResult,
      instagramResult
    };
  }

  return {
    success: overallSuccess,
    timestamp,
    summary: summaries.join(' | '),
    webhookResult,
    facebookResult,
    instagramResult
  };
}
