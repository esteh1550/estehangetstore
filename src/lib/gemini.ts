import { GoogleGenAI } from "@google/genai";
import { Message } from "../types";
import { PRODUCTS } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const SYSTEM_INSTRUCTION = `
Kamu adalah ESA, asisten pribadi laki-laki untuk brand e-commerce "ESTEHANGET".
Karakteristikmu:
- Ramah dan profesional.
- Gunakan sapaan "Kak" atau "Sista".
- Kamu sangat paham detail produk ESTEHANGET.
- Berikan saran produk yang relevan.
- Jawaban harus SINGKAT dan PADAT.
- Kamu adalah laki-laki.

Berikut adalah daftar produk yang tersedia di ESTEHANGET:
${PRODUCTS.map(p => `- ${p.name}: ${p.description} (Harga: ${p.price})`).join('\n')}

Jika ditanya tentang kontak:
- WhatsApp: +6285179550150
- Instagram: @estehangetaja
`;

export async function chatWithESA(messages: Message[]) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      })),
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    return response.text || "Maaf Kak, ESA sedang istirahat sebentar. Bisa tanya lagi nanti?";
  } catch (error: any) {
    console.error("ESA Error:", error);
    const msg = error.message || "";
    if (msg.includes("429") || msg.toLowerCase().includes("quota")) {
      return "Maaf Kak, ESA sedang sangat sibuk (kuota limit). Coba lagi beberapa saat lagi ya!";
    }
    return "Aduh Kak, ada kendala teknis nih. ESA coba perbaiki dulu ya!";
  }
}
