import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import * as dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // AI Logic for Product Extraction
  app.post("/api/extract-product", async (req, res) => {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    try {
      // In a real app, we'd use a robust scraper. 
      // For this environment, we'll use a mocked "scraping" or try to fetch content if possible.
      // But scraping Tokopedia usually requires more than a simple fetch.
      // We'll use Gemini to "simulate" extraction or provide a template if scraping fails.
      
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Extract product details (name, price, description, category, specifications, images) from this URL: ${url}. 
        Find the current price in IDR if possible. Return ONLY valid JSON.`,
        config: {
          tools: [{ googleSearch: {} }],
          toolConfig: { includeServerSideToolInvocations: true },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              price: { type: Type.NUMBER },
              description: { type: Type.STRING },
              category: { type: Type.STRING, enum: ["gadget", "pakaian", "sepatu", "digital"] },
              specifications: { type: Type.ARRAY, items: { type: Type.STRING } },
              images: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["name", "price", "description", "category", "specifications", "images"]
          }
        }
      });

      const product = JSON.parse(response.text);
      res.json(product);
    } catch (error: any) {
      console.error("Extraction error:", error);
      res.status(500).json({ error: "Gagal mengekstrak data produk: " + error.message });
    }
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
