import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { webhookUrl, secretToken, payload, metaConfig } = req.body || {};
  if (!payload) {
    return res.status(400).json({ error: 'Payload data produk wajib disertakan.' });
  }

  // 1. Attempt to run processWebhookDispatch from server module
  try {
    const { processWebhookDispatch } = await import('../server/webhookService.ts');
    const result = await processWebhookDispatch({
      webhookUrl,
      secretToken,
      payload,
      metaConfig
    });
    return res.status(200).json(result);
  } catch (modErr) {
    console.warn('Could not load or execute server module in Vercel function, using direct dispatch fallback:', modErr);
  }

  // 2. Direct Vercel Serverless fetch fallback to Make.com
  if (webhookUrl && typeof webhookUrl === 'string' && webhookUrl.trim().startsWith('http')) {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'EStore-Vercel-Agent/1.0',
        'X-EStore-Event': payload?.event || 'product.created'
      };
      if (secretToken && secretToken.trim()) {
        headers['Authorization'] = `Bearer ${secretToken.trim()}`;
        headers['X-Webhook-Secret'] = secretToken.trim();
      }

      const proxyRes = await fetch(webhookUrl.trim(), {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      return res.status(200).json({
        success: proxyRes.ok,
        timestamp: new Date().toISOString(),
        summary: proxyRes.ok ? 'Webhook URL berhasil terkirim via Vercel' : `Webhook merespons status ${proxyRes.status}`,
        statusCode: proxyRes.status
      });
    } catch (fetchErr: any) {
      console.error('Direct Vercel fetch failed:', fetchErr);
      return res.status(500).json({
        success: false,
        error: fetchErr?.message || 'Gagal mengirim webhook dari server Vercel.'
      });
    }
  }

  return res.status(400).json({
    success: false,
    error: 'URL Webhook tidak valid atau belum diatur.'
  });
}
