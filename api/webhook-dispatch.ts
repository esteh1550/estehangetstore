import type { VercelRequest, VercelResponse } from '@vercel/node';
import { processWebhookDispatch } from '../server/webhookService';

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

  try {
    const { webhookUrl, secretToken, payload, metaConfig } = req.body || {};
    if (!payload) {
      return res.status(400).json({ error: 'Payload data produk wajib disertakan.' });
    }

    const result = await processWebhookDispatch({
      webhookUrl,
      secretToken,
      payload,
      metaConfig
    });

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Vercel Webhook Dispatch error:', error);
    return res.status(500).json({ error: error?.message || 'Gagal memproses webhook dispatch.' });
  }
}
