import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  console.log('Creating Vite server...');
  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: {
      middlewareMode: true,
      // CRITICAL FIX #0-2: Enable HMR with proper WebSocket configuration for Replit
      hmr: {
        overlay: true,
        // Use same port as server for WebSocket connection
        port: 5000,
        // Let Vite auto-detect the protocol and host
        server: server, // Use existing HTTP server for WebSocket upgrades
      },
      host: '0.0.0.0',
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
      watch: {
        usePolling: true,
      },
    },
    appType: "custom",
  });

  console.log('Vite server created, adding middlewares...');
  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    // CRITICAL FIX: Only serve index.html for actual navigation requests
    // Skip if: wrong method, headers sent, non-HTML Accept, or has file extension
    
    // 1. Only handle GET/HEAD requests
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return next();
    }
    
    // 2. Skip if response already sent (Vite handled it)
    if (res.headersSent) {
      return next();
    }
    
    const url = req.originalUrl;
    const urlPath = url.split('?')[0];
    
    // 3. Skip requests with non-HTML file extensions (assets)
    const hasNonHtmlExtension = /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|json|map|txt|xml)$/i.test(urlPath);
    if (hasNonHtmlExtension) {
      return next();
    }
    
    // 4. Only serve HTML if Accept header prefers HTML
    const acceptHeader = req.headers.accept || '';
    const prefersHtml = acceptHeader.includes('text/html');
    if (!prefersHtml && !urlPath.endsWith('.html')) {
      return next();
    }

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
