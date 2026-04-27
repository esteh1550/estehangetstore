import { Message } from "../types";
import { PRODUCTS } from "../constants";

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
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages,
        systemInstruction: SYSTEM_INSTRUCTION
      })
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || "Gagal menghubungi AI");
    }

    const data = await response.json();
    return data.text || "Maaf Kak, ESA sedang istirahat sebentar. Bisa tanya lagi nanti?";
  } catch (error: any) {
    console.error("ESA Error:", error);
    const msg = error.message || "";
    if (msg.includes("429") || msg.toLowerCase().includes("quota")) {
      return "Maaf Kak, ESA sedang sangat sibuk (kuota limit). Coba lagi beberapa saat lagi ya!";
    }
    return "Aduh Kak, ada kendala teknis nih. ESA coba perbaiki dulu ya!";
  }
}
