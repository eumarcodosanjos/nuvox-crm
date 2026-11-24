import path from "node:path";
import { Readable } from "node:stream";
import type { IncomingMessage, ServerResponse } from "node:http";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type Plugin } from "vite";
import { VitePWA } from "vite-plugin-pwa";

/**
 * Em desenvolvimento (`npm run dev`) e no `npm run preview`, atende /api/* com o
 * mesmo roteador do Cloudflare Worker (server/rotas.ts).
 */
function apiLocal(): Plugin {
  async function atender(
    carregar: () => Promise<typeof import("./server/rotas")>,
    req: IncomingMessage & { originalUrl?: string },
    res: ServerResponse,
  ) {
    try {
      const { tratar } = await carregar();
      const url = `http://${req.headers.host}${req.originalUrl ?? req.url}`;
      const temCorpo = req.method !== "GET" && req.method !== "HEAD";
      const request = new Request(url, {
        method: req.method,
        headers: req.headers as Record<string, string>,
        body: temCorpo ? (Readable.toWeb(req) as ReadableStream) : undefined,
        // @ts-expect-error — exigido pelo Node para corpo em stream
        duplex: "half",
      });
      const resposta = await tratar(request);
      res.statusCode = resposta.status;
      resposta.headers.forEach((valor, chave) => res.setHeader(chave, valor));
      res.end(Buffer.from(await resposta.arrayBuffer()));
    } catch (e) {
      console.error(e);
      res.statusCode = 500;
      res.end(JSON.stringify({ erro: "Erro no servidor de desenvolvimento." }));
    }
  }

  return {
    name: "nuvox-api-local",
    configureServer(server) {
      server.middlewares.use("/api", (req, res) =>
        atender(() => server.ssrLoadModule("/server/rotas.ts") as never, req, res),
      );
    },
    configurePreviewServer(server) {
      // O preview serve o build final (para testar o app instalável) e não compila TypeScript;
      // um carregador do Vite em modo middleware, criado uma vez, roda a mesma API.
      let carregador: Promise<import("vite").ViteDevServer> | undefined;
      server.middlewares.use("/api", (req, res) => {
        carregador ??= import("vite").then(({ createServer }) =>
          createServer({ server: { middlewareMode: true }, appType: "custom", logLevel: "silent" }),
        );
        return atender(async () => (await carregador!).ssrLoadModule("/server/rotas.ts") as never, req, res);
      });
    },
  };
}

/** App instalável (PWA): manifesto, ícones e service worker. */
function appInstalavel() {
  return VitePWA({
    registerType: "prompt", // avisa "versão nova" em vez de recarregar sozinho no meio do uso
    injectRegister: false, // o registro fica em src/components/app/AppPwa.tsx
    includeAssets: ["favicon.ico", "simbolo.svg", "icones/apple-touch-icon.png", "icones/favicon-32.png"],
    manifest: {
      id: "/",
      name: "Nuvox CRM",
      short_name: "Nuvox CRM",
      description: "CRM comercial da Nuvox. Toda venda é uma subida.",
      lang: "pt-BR",
      dir: "ltr",
      start_url: "/dashboard?origem=app",
      scope: "/",
      display: "standalone",
      display_override: ["standalone", "minimal-ui"],
      orientation: "any",
      background_color: "#0A0A0A",
      theme_color: "#0A0A0A",
      categories: ["business", "productivity"],
      icons: [
        { src: "/icones/icone-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
        { src: "/icones/icone-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
        { src: "/icones/icone-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
        { src: "/icones/icone-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      ],
      shortcuts: [
        {
          name: "Dashboard",
          url: "/dashboard",
          icons: [{ src: "/icones/icone-192.png", sizes: "192x192", type: "image/png" }],
        },
        {
          name: "Pipeline",
          url: "/pipeline",
          icons: [{ src: "/icones/icone-192.png", sizes: "192x192", type: "image/png" }],
        },
        {
          name: "Novo lead",
          url: "/leads?novo=1",
          icons: [{ src: "/icones/icone-192.png", sizes: "192x192", type: "image/png" }],
        },
      ],
    },
    workbox: {
      // A "casca" do app (HTML, JS, CSS, ícones) fica salva para abrir na hora.
      globPatterns: ["**/*.{js,css,html,ico,png,svg,webmanifest}"],
      navigateFallback: "/index.html",
      navigateFallbackDenylist: [/^\/api\//],
      cleanupOutdatedCaches: true,
      runtimeCaching: [
        // Dados do CRM: SEMPRE da rede. Nunca mostrar números velhos.
        { urlPattern: ({ url }) => url.pathname.startsWith("/api/"), handler: "NetworkOnly" },
        // Fontes da marca (Archivo + Inter) também funcionam sem internet.
        {
          urlPattern: ({ url }) => url.origin === "https://fonts.googleapis.com",
          handler: "StaleWhileRevalidate",
          options: { cacheName: "fontes-css" },
        },
        {
          urlPattern: ({ url }) => url.origin === "https://fonts.gstatic.com",
          handler: "CacheFirst",
          options: {
            cacheName: "fontes-arquivos",
            expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
            cacheableResponse: { statuses: [0, 200] },
          },
        },
      ],
    },
  });
}

export default defineConfig(({ mode }) => {
  // Disponibiliza as variáveis do .env (sem prefixo VITE_) só para o servidor local.
  Object.assign(process.env, loadEnv(mode, process.cwd(), ""));
  return {
    plugins: [react(), apiLocal(), appInstalavel()],
    resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
  };
});
