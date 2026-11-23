/**
 * API do Nuvox CRM como Cloudflare Worker.
 * O D1 chega pelo binding `DB` (sem token) e o SESSION_SECRET como secret.
 * A Vercel serve o site e repassa /api/* para cá (veja vercel.json).
 */
import { definirAmbiente } from "../server/config.js";
import { tratar } from "../server/rotas.js";

export default {
  async fetch(request: Request, env: Record<string, unknown>): Promise<Response> {
    definirAmbiente(env);
    const { pathname } = new URL(request.url);
    if (pathname !== "/api" && !pathname.startsWith("/api/")) {
      return new Response("Nuvox CRM API", { status: 404 });
    }
    return tratar(request);
  },
};
