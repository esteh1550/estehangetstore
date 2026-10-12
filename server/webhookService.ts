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

export async function processWebhookDispatch(options: WebhookDispatchOptions): Promise<WebhookDispatchResult> {
  const { webhookUrl, secretToken, payload, metaConfig } = options;
  const timestamp = new Date().toISOString();

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
