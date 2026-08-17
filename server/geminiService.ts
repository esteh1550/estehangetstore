import { GoogleGenAI, Type } from "@google/genai";

export function getApiKey() {
  const keys = {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY?.trim(),
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY?.trim(),
    VITE_GEMINI_API_KEY: process.env.VITE_GEMINI_API_KEY?.trim(),
    API_KEY: process.env.API_KEY?.trim()
  };

  const entries = Object.entries(keys).filter(([_, val]) => val && val !== "" && val !== "MY_GEMINI_API_KEY" && val !== "undefined");
  
  if (entries.length > 0) {
    return entries[0][1] as string;
  }

  const foundPlaceholders = Object.entries(keys).filter(([_, val]) => val === "MY_GEMINI_API_KEY" || val === "undefined");
  if (foundPlaceholders.length > 0) {
    throw new Error(`API Key placeholder ditemukan (${foundPlaceholders.map(p => p[0]).join(', ')}). Harap atur GEMINI_API_KEY asli di Vercel Environment Variables.`);
  }

  throw new Error("GEMINI_API_KEY belum diatur. Harap tambahkan GEMINI_API_KEY di Environment Variables pada Vercel Dashboard Anda.");
}

export function formatError(error: any): string {
  const errorString = error?.message || (typeof error === 'string' ? error : JSON.stringify(error));
  
  if (errorString.includes("API_KEY_HTTP_REFERRER_BLOCKED")) {
    return "KESALAHAN SETTING API KEY: API Key Anda memiliki batasan 'HTTP Referrer'. Harap hapus batasan tersebut di Google Cloud Console agar Vercel/Server bisa mengakses AI.";
  }
  if (errorString.includes("reported as leaked")) {
    return "KESALAHAN API KEY: API Key Anda terdeteksi bocor (leaked) dan telah diblokir oleh Google. Silakan buat API Key baru di Google AI Studio (aistudio.google.com) dan update di Vercel Environment Variables.";
  }
  if (errorString.includes("expired") || errorString.includes("API_KEY_INVALID") || errorString.includes("renew the API key") || errorString.includes("API key not valid")) {
    return "KESALAHAN API KEY: API Key Anda tidak valid atau terhapus. Silakan buat API Key baru di Google AI Studio (aistudio.google.com) dan perbarui di Vercel Environment Variables.";
  }
  if (errorString.includes("429") || errorString.toLowerCase().includes("quota")) {
    return "Batas pemakaian AI (Quota Limit) telah tercapai. Silakan coba lagi beberapa saat lagi.";
  }
  return errorString;
}

export async function processChat(messages: any[], systemInstruction?: string, referer?: string) {
  const apiKey = getApiKey();
  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
        ...(referer ? { 'Referer': referer } : {})
      }
    }
  });

  const response = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: messages.map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    })),
    config: {
      systemInstruction,
      temperature: 0.7,
    },
  });

  return response.text;
}

export async function processExtractProduct(url: string, referer?: string) {
  const apiKey = getApiKey();
  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
        ...(referer ? { 'Referer': referer } : {})
      }
    }
  });

  const response = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: `Extract product details (name, price, description, category, specifications, images) from this URL: ${url}. 
    Use Google Search to find the actual data if needed.
    Return the data in valid JSON format.`,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          price: { type: Type.NUMBER },
          category: { type: Type.STRING, enum: ["gadget", "pakaian", "sepatu", "digital"] },
          description: { type: Type.STRING },
          specifications: { type: Type.ARRAY, items: { type: Type.STRING } },
          images: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["name", "price", "category", "description"]
      }
    }
  });

  return JSON.parse(response.text || '{}');
}
