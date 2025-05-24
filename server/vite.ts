// server/vite.ts
import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteDevServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

// Unified logger
export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

// Setup Vite for Development (Middleware Mode with HMR)
export async function setupVite(app: Express, server: Server) {
  const vite = await createViteDevServer({
    ...viteConfig,
    configFile: false,
    appType: "custom",
    server: {
      middlewareMode: true,
      hmr: {
        server,
        port: 5000,
        host: "0.0.0.0",
      },
      allowedHosts: "all",
    },
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1); // Fail fast on startup error
      },
    },
  });

  app.use(vite.middlewares);

  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplatePath = path.resolve(
        process.cwd(),
        "client",
        "index.html"
      );

      let template = await fs.promises.readFile(clientTemplatePath, "utf-8");

      // Add cache-busting to the main entry point
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );

      const html = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(html);
    } catch (err) {
      vite.ssrFixStacktrace(err as Error);
      next(err);
    }
  });
}

// Serve Static Files in Production
export function serveStatic(app: Express) {
  const distPath = path.resolve(process.cwd(), "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}. Did you forget to run 'vite build'?`
    );
  }

  app.use(express.static(distPath));

  // Fallback to index.html for client-side routing
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
