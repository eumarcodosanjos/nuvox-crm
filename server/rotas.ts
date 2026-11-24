/**
 * Roteador da API. Recebe um Request (padrão Web) e devolve um Response.
 * Funciona igual no Cloudflare Worker (worker/index.ts) e no `npm run dev` (plugin do Vite).
 *
 * Sem login por enquanto: o CRM é de uso pessoal. Quem tiver a URL acessa os dados.
 *
 *   GET    /api/produtos                  id, nome, cor e modelo de cobrança
 *   (as rotas do dashboard aceitam &produto=<id> para filtrar por produto)
 *   GET    /api/dashboard/kpis?periodo=mes
 *   GET    /api/dashboard/funil?periodo=mes
 *   GET    /api/dashboard/propostas-vencendo
 *   GET    /api/dashboard/tarefas-hoje
 *   GET    /api/dashboard/origem-leads?periodo=mes
 *   GET    /api/leads                  leads com o negócio mais recente
 *   POST   /api/leads                  cria lead + negócio (422 com { campos } se inválido)
 *   GET    /api/leads/:id              lead com o negócio mais recente (para editar)
 *   PATCH  /api/leads/:id              salva lead + negócio (mesmo corpo do POST; etapa pode ser "perdido")
 *   GET    /api/pipeline               negócios abertos + fechados no mês
 *   PATCH  /api/negocios/:id           { etapa }
 *   PATCH  /api/tarefas/:id            { concluida: boolean }
 */
import { ErroBanco } from "./db.js";
import { tratarKime } from "./kime.js";
import * as dash from "./dashboard.js";
import { periodoValido } from "./periodo.js";
import * as leads from "./leads.js";
import * as pipeline from "./pipeline.js";

const json = (dados: unknown, status = 200) =>
  new Response(JSON.stringify(dados), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });

const erro = (mensagem: string, status: number) => json({ erro: mensagem }, status);

/** ?produto=<id> filtra por produto; ausente ou inválido = todos. */
function produtoValido(v: string | null): number | null {
  const n = Number(v);
  return v && Number.isInteger(n) && n > 0 ? n : null;
}

/** Rota relativa a /api, ex.: "dashboard/kpis". */
function rotaDe(url: URL): string {
  return url.pathname.replace(/^\/api\/?/, "").replace(/^\/+|\/+$/g, "");
}

export async function tratar(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const rota = rotaDe(url);
  const periodo = periodoValido(url.searchParams.get("periodo"));
  const produto = produtoValido(url.searchParams.get("produto"));

  try {
    if (rota.startsWith("integracoes/kime/")) return await tratarKime(req, rota);
    if (req.method === "GET") {
      switch (rota) {
        case "produtos":
          return json(await dash.listarProdutos());
        case "dashboard/kpis":
          return json(await dash.kpis(periodo, produto));
        case "dashboard/funil":
          return json(await dash.funil(periodo, produto));
        case "dashboard/propostas-vencendo":
          return json(await dash.propostasVencendo(produto));
        case "dashboard/tarefas-hoje":
          return json(await dash.tarefasHoje(produto));
        case "dashboard/origem-leads":
          return json(await dash.origemLeads(periodo, produto));
      }
    }

    if (rota === "leads") {
      if (req.method === "GET") return json(await leads.listarLeads());
      if (req.method === "POST") {
        const corpo = await req.json().catch(() => null);
        return json(await leads.criarLead(corpo), 201);
      }
    }

    const lead = /^leads\/(\d+)$/.exec(rota);
    if (lead) {
      const id = Number(lead[1]);
      if (req.method === "GET") {
        const encontrado = await leads.buscarLead(id);
        return encontrado ? json(encontrado) : erro("Lead não encontrado.", 404);
      }
      if (req.method === "PATCH") {
        const corpo = await req.json().catch(() => null);
        const salvo = await leads.atualizarLead(id, corpo);
        return salvo ? json(salvo) : erro("Lead não encontrado.", 404);
      }
    }

    if (req.method === "GET" && rota === "pipeline") {
      return json(await pipeline.listarPipeline());
    }

    const negocio = /^negocios\/(\d+)$/.exec(rota);
    if (negocio && req.method === "PATCH") {
      const corpo = (await req.json().catch(() => null)) as { etapa?: unknown } | null;
      if (!pipeline.etapaValida(corpo?.etapa)) return erro("Envie { etapa } com uma etapa válida.", 400);
      const movido = await pipeline.moverNegocio(Number(negocio[1]), corpo.etapa);
      return movido ? json(movido) : erro("Negócio não encontrado.", 404);
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
    if (e instanceof leads.ErroValidacao) return json({ erro: e.message, campos: e.campos }, 422);
    console.error(`[api] ${req.method} /${rota}`, e);
    const msg = e instanceof ErroBanco ? e.message : "Erro interno. Tente de novo em instantes.";
    return erro(msg, 500);
  }
}
