import type { VercelRequest, VercelResponse } from '@vercel/node';
import { processExtractProduct, formatError } from '../server/geminiService';

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
    const { url } = req.body || {};
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    const referer = (req.headers.referer || req.headers.host || '') as string;
    const product = await processExtractProduct(url, referer);
    return res.status(200).json({ text: JSON.stringify(product), ...product });
  } catch (error: any) {
    console.error("Vercel Extract error:", error);
    const formatted = formatError(error);
    return res.status(500).json({ error: formatted });
  }
}
