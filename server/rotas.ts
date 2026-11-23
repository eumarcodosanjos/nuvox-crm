/**
 * Roteador da API. Recebe um Request (padrão Web) e devolve um Response.
 * Funciona igual no Cloudflare Worker (worker/index.ts) e no `npm run dev` (plugin do Vite).
 *
 * Sem login por enquanto: o CRM é de uso pessoal. Quem tiver a URL acessa os dados.
 *
 *   GET    /api/dashboard/kpis?periodo=mes
 *   GET    /api/dashboard/funil?periodo=mes
 *   GET    /api/dashboard/propostas-vencendo
 *   GET    /api/dashboard/tarefas-hoje
 *   GET    /api/dashboard/origem-leads?periodo=mes
 *   PATCH  /api/tarefas/:id            { concluida: boolean }
 */
import { ErroBanco } from "./db.js";
import * as dash from "./dashboard.js";
import { periodoValido } from "./periodo.js";

const json = (dados: unknown, status = 200) =>
  new Response(JSON.stringify(dados), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });

const erro = (mensagem: string, status: number) => json({ erro: mensagem }, status);

/** Rota relativa a /api, ex.: "dashboard/kpis". */
function rotaDe(url: URL): string {
  return url.pathname.replace(/^\/api\/?/, "").replace(/^\/+|\/+$/g, "");
}

export async function tratar(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const rota = rotaDe(url);
  const periodo = periodoValido(url.searchParams.get("periodo"));

  try {
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
