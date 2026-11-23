import path from "node:path";
import { Readable } from "node:stream";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type Plugin } from "vite";

/**
 * Em desenvolvimento, atende /api/* com o mesmo roteador usado na Vercel
 * (server/rotas.ts), para `npm run dev` funcionar sem `vercel dev`.
 */
function apiLocal(): Plugin {
  return {
    name: "nuvox-api-local",
    configureServer(server) {
      server.middlewares.use("/api", async (req, res) => {
        try {
          const { tratar } = (await server.ssrLoadModule("/server/rotas.ts")) as typeof import("./server/rotas");
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
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // Disponibiliza as variáveis do .env (sem prefixo VITE_) só para o servidor local.
  Object.assign(process.env, loadEnv(mode, process.cwd(), ""));
  return {
    plugins: [react(), apiLocal()],
    resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
  };
});
