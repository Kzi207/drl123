import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  const API_BASE = process.env.API_BASE || "https://database.kzii.site";
  const API_KEY = process.env.API_KEY || ""; 

  // Proxy API requests
  app.all("/api-proxy/*", async (req, res) => {
    const targetPath = req.params[0] || "";
    const queryIndex = req.url.indexOf("?");
    const queryString = queryIndex !== -1 ? req.url.substring(queryIndex) : "";
    let url = `${API_BASE}/${targetPath}${queryString}`;
    console.log(`Proxying ${req.method} request to: ${url}`);
    
    const headers: Record<string, string> = {
      "Accept": "application/json, text/plain, */*",
      "Accept-Language": "en-US,en;q=0.9,vi;q=0.8",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      "Cache-Control": "no-cache",
      "Pragma": "no-cache"
    };

    if (API_KEY && !targetPath.startsWith("admin-api") && !targetPath.startsWith("uploads") && !targetPath.startsWith("img") && !targetPath.startsWith("status") && !targetPath.startsWith("login")) {
      headers["x-api-key"] = API_KEY;
    }

    if (req.headers.authorization) {
      headers["Authorization"] = req.headers.authorization as string;
    }

    if (req.headers["x-api-key"]) {
      headers["x-api-key"] = req.headers["x-api-key"] as string;
    }

    try {
      const fetchOptions: any = {
        method: req.method,
        headers,
      };

      if (req.method !== "GET" && req.method !== "HEAD") {
        fetchOptions.body = JSON.stringify(req.body);
        headers["Content-Type"] = "application/json";
      }

      let response = await fetch(url, fetchOptions);
      console.log(`Primary proxy response: ${response.status} ${response.statusText}`);

      // Fallback to old domain if 404 or 503/502
      if (response.status === 404 || response.status === 503 || response.status === 502) {
        const fallbackUrl = `${FALLBACK_API_BASE}/${targetPath}${queryString}`;
        console.log(`Fallback proxying to: ${fallbackUrl}`);
        try {
          const fallbackResponse = await fetch(fallbackUrl, fetchOptions);
          console.log(`Fallback proxy response: ${fallbackResponse.status} ${fallbackResponse.statusText}`);
          response = fallbackResponse;
        } catch (fallbackError) {
          console.error("Fallback proxy error:", fallbackError);
          // Keep the original response if fallback fails
        }
      }

      const contentType = response.headers.get("content-type");
      
      if (contentType) {
        res.setHeader("Content-Type", contentType);
      }
      res.status(response.status);

      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        res.json(data);
      } else {
        const buffer = await response.arrayBuffer();
        res.send(Buffer.from(buffer));
      }
    } catch (error) {
      console.error("Proxy error:", error);
      res.status(500).json({ error: "Proxy error" });
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
