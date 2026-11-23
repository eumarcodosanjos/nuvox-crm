/**
 * Roteador da API. Recebe um Request (padrão Web) e devolve um Response.
 * Funciona igual no Cloudflare Worker (worker/index.ts) e no `npm run dev` (plugin do Vite).
 *
 *   POST   /api/sessao                 login   { email, senha }
 *   GET    /api/sessao                 usuário logado (ou null)
 *   DELETE /api/sessao                 sair
 *   GET    /api/dashboard/kpis?periodo=mes
 *   GET    /api/dashboard/funil?periodo=mes
 *   GET    /api/dashboard/propostas-vencendo
 *   GET    /api/dashboard/tarefas-hoje
 *   GET    /api/dashboard/origem-leads?periodo=mes
 *   PATCH  /api/tarefas/:id            { concluida: boolean }
 */
import { conferirSenha, cookieSaida, criarCookieSessao, lerSessao } from "./auth.js";
import { consultar, ErroBanco } from "./db.js";
import * as dash from "./dashboard.js";
import { periodoValido } from "./periodo.js";

const json = (dados: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(dados), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers },
  });

const erro = (mensagem: string, status: number) => json({ erro: mensagem }, status);

/** Rota relativa a /api, ex.: "dashboard/kpis". */
function rotaDe(url: URL): string {
  return url.pathname.replace(/^\/api\/?/, "").replace(/^\/+|\/+$/g, "");
}

export async function tratar(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const rota = rotaDe(url);
  const https = url.protocol === "https:" || req.headers.get("x-forwarded-proto") === "https";

  try {
    // ── Sessão (pública) ─────────────────────────────────────────
    if (rota === "sessao") {
      if (req.method === "POST") return await entrar(req, https);
      if (req.method === "DELETE") return json({ ok: true }, 200, { "Set-Cookie": cookieSaida(https) });
      if (req.method === "GET") {
        // Sem login responde 200 com null (não é erro: só "ninguém logado").
        return json(await lerSessao(req));
      }
      return erro("Método não permitido.", 405);
    }

    // ── Daqui pra baixo, só autenticado ──────────────────────────
    const sessao = await lerSessao(req);
    if (!sessao) return erro("Não autenticado.", 401);

    const periodo = periodoValido(url.searchParams.get("periodo"));

    if (req.method === "GET") {
      switch (rota) {
        case "dashboard/kpis":
          return json(await dash.kpis(periodo));
        case "dashboard/funil":
          return json(await dash.funil(periodo));
        case "dashboard/propostas-vencendo":
          return json(await dash.propostasVencendo());
        case "dashboard/tarefas-hoje":
          return json(await dash.tarefasHoje());
        case "dashboard/origem-leads":
          return json(await dash.origemLeads(periodo));
      }
    }

    const tarefa = /^tarefas\/(\d+)$/.exec(rota);
    if (tarefa && req.method === "PATCH") {
      const corpo = (await req.json().catch(() => null)) as { concluida?: unknown } | null;
      if (typeof corpo?.concluida !== "boolean") return erro("Envie { concluida: true | false }.", 400);
      const ok = await dash.marcarTarefa(Number(tarefa[1]), corpo.concluida);
      return ok ? json({ ok: true }) : erro("Tarefa não encontrada.", 404);
    }

    return erro("Rota não encontrada.", 404);
  } catch (e) {
    console.error(`[api] ${req.method} /${rota}`, e);
    const msg = e instanceof ErroBanco ? e.message : "Erro interno. Tente de novo em instantes.";
    return erro(msg, 500);
  }
}

const HASH_FALSO = "pbkdf2$100000$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

async function entrar(req: Request, https: boolean): Promise<Response> {
  const corpo = (await req.json().catch(() => null)) as { email?: unknown; senha?: unknown } | null;
  const email = typeof corpo?.email === "string" ? corpo.email.trim().toLowerCase() : "";
  const senha = typeof corpo?.senha === "string" ? corpo.senha : "";
  if (!email || !senha) return erro("Informe e-mail e senha.", 400);

  const [usuario] = await consultar<{ id: number; nome: string; email: string; senha_hash: string }>(
    `SELECT id, nome, email, senha_hash FROM usuarios WHERE email = ?`,
    [email],
  );
  // Mesmo sem usuário, calcula um hash para não revelar pelo tempo de resposta se o e-mail existe.
  const ok = await conferirSenha(senha, usuario?.senha_hash ?? HASH_FALSO);
  if (!usuario || !ok) return erro("E-mail ou senha incorretos.", 401);

  const sessao = { id: usuario.id, nome: usuario.nome, email: usuario.email };
  return json(sessao, 200, { "Set-Cookie": await criarCookieSessao(sessao, https) });
}
