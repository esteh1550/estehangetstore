import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import * as dotenv from "dotenv";
import { processChat, processExtractProduct, formatError } from "./server/geminiService";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Diagnostic log for environment variables (keys only)
  console.log("Check API Key candidacy:");
  console.log("- process.env.GEMINI_API_KEY:", !!process.env.GEMINI_API_KEY);
  console.log("- process.env.GOOGLE_API_KEY:", !!process.env.GOOGLE_API_KEY);
  console.log("- process.env.VITE_GEMINI_API_KEY:", !!process.env.VITE_GEMINI_API_KEY);
  console.log("- process.env.API_KEY:", !!process.env.API_KEY);

  function getApiKey() {
    const keys = {
      GEMINI_API_KEY: process.env.GEMINI_API_KEY?.trim(),
      GOOGLE_API_KEY: process.env.GOOGLE_API_KEY?.trim(),
      VITE_GEMINI_API_KEY: process.env.VITE_GEMINI_API_KEY?.trim(),
      API_KEY: process.env.API_KEY?.trim()
    };

    // Filter out placeholders and empty values
    const entries = Object.entries(keys).filter(([_, val]) => val && val !== "" && val !== "MY_GEMINI_API_KEY" && val !== "undefined");
    
    if (entries.length > 0) {
      // Use the first valid one
      const [source, val] = entries[0];
      // console.log(`Menggunakan API Key dari: ${source}`); // Keep internal
      return val as string;
    }

    // If we only found placeholders, report specifically which ones
    const foundPlaceholders = Object.entries(keys).filter(([_, val]) => val === "MY_GEMINI_API_KEY" || val === "undefined");
    if (foundPlaceholders.length > 0) {
      throw new Error(`API Key placeholder ditemukan pada: ${foundPlaceholders.map(p => p[0]).join(', ')}. Silakan ganti dengan key asli di panel Secrets.`);
    }

    throw new Error("API Key tidak ditemukan. Pastikan GEMINI_API_KEY sudah diisi di panel Secrets.");
  }

  function formatError(error: any): string {
    const errorString = error?.message || (typeof error === 'string' ? error : JSON.stringify(error));
    
    if (errorString.includes("API_KEY_HTTP_REFERRER_BLOCKED")) {
      return "KESALAHAN SETTING API KEY: API Key Anda memiliki batasan 'HTTP Referrer'. Harap hapus batasan tersebut di Cloud Console agar server bisa mengakses AI.";
    }
    if (errorString.includes("reported as leaked")) {
      return "KESALAHAN API KEY: API Key Anda terdeteksi bocor (leaked) dan telah diblokir oleh Google. Silakan buat API Key baru di Google AI Studio (aistudio.google.com) dan update di panel Secrets aplikasi ini.";
    }
    if (errorString.includes("expired") || errorString.includes("API_KEY_INVALID") || errorString.includes("renew the API key")) {
      return "KESALAHAN API KEY: API Key Anda telah kadaluwarsa atau tidak valid (Expired/Invalid). Silakan buat API Key baru di Google AI Studio (aistudio.google.com) dan perbarui di panel Secrets aplikasi ini.";
    }
    if (errorString.includes("429") || errorString.toLowerCase().includes("quota")) {
      return "Batas pemakaian AI (Quota) telah habis. Silakan coba lagi nanti.";
    }
    return errorString;
  }

  // AI Logic for Product Extraction
  app.post("/api/extract-product", async (req, res) => {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    try {
      const referer = req.headers.referer || `${req.protocol}://${req.get('host')}`;
      const product = await processExtractProduct(url, referer);
      res.json(product);
    } catch (error: any) {
      console.error("Extraction error:", error);
      res.status(500).json({ error: formatError(error) });
    }
  });

  // AI Chat endpoint for ESA (Disabled)
  app.post("/api/chat", async (req, res) => {
    res.json({ text: "Fitur AI Chatbot (ESA) telah dinonaktifkan." });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
