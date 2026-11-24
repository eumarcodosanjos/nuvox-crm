/**
 * Pipeline (kanban): negócios abertos + fechados no mês, e mudança de etapa.
 */
import { valorNegocio } from "../src/lib/negocio.js";
import type { Etapa, NegocioPipeline, NomeProduto } from "../src/lib/tipos.js";
import { consultar } from "./db.js";
import { intervalo } from "./periodo.js";

const AGORA_ISO = `strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`;

export async function listarPipeline(): Promise<NegocioPipeline[]> {
  const inicioDoMes = intervalo("mes").inicio;
  const linhas = await consultar<{
    id: number;
    lead_id: number;
    etapa: Etapa;
    valor_implantacao: number;
    valor_mensal: number;
    valor_avulso: number;
    created_at: string;
    fechado_em: string | null;
    lead_nome: string;
    organizacao: string | null;
    produto_id: number;
    produto: NomeProduto;
    produto_cor: string;
    tarefa_titulo: string | null;
    tarefa_em: string | null;
  }>(
    `SELECT n.id, n.lead_id, n.etapa, n.valor_implantacao, n.valor_mensal, n.valor_avulso,
            n.created_at, n.fechado_em,
            l.nome AS lead_nome, l.organizacao,
            n.produto_id, pr.nome AS produto, pr.cor AS produto_cor,
            t.titulo AS tarefa_titulo, t.data_hora AS tarefa_em
       FROM negocios n
       JOIN leads l     ON l.id = n.lead_id
       JOIN produtos pr ON pr.id = n.produto_id
       LEFT JOIN tarefas t ON t.id = (
            SELECT id FROM tarefas
             WHERE negocio_id = n.id AND concluida = 0
             ORDER BY data_hora ASC, id ASC
             LIMIT 1)
      WHERE n.etapa IN ('novo', 'contato', 'proposta', 'negociacao')
         OR (n.etapa = 'fechado' AND n.fechado_em >= ?)
      ORDER BY n.created_at DESC, n.id DESC`,
    [inicioDoMes],
  );

  return linhas.map((l) => ({
    id: l.id,
    leadId: l.lead_id,
    etapa: l.etapa,
    leadNome: l.lead_nome,
    organizacao: l.organizacao,
    produtoId: l.produto_id,
    produto: l.produto,
    produtoCor: l.produto_cor,
    valor: valorNegocio(l),
    criadoEm: l.created_at,
    fechadoEm: l.fechado_em,
    proximaTarefa: l.tarefa_titulo && l.tarefa_em ? { titulo: l.tarefa_titulo, dataHora: l.tarefa_em } : null,
  }));
}

/** Todas as etapas; o Record garante em tempo de compilação que nenhuma ficou de fora. */
const ETAPAS: Record<Etapa, true> = {
  novo: true,
  contato: true,
  proposta: true,
  negociacao: true,
  fechado: true,
  perdido: true,
};

export function etapaValida(v: unknown): v is Etapa {
  return typeof v === "string" && Object.hasOwn(ETAPAS, v);
}

/**
 * Muda a etapa de um negócio.
 * - Entrou em "fechado": grava fechado_em agora (se já estava fechado, mantém a data).
 * - Saiu de "fechado": limpa fechado_em.
 * - Fechado → propostas abertas viram "aceita"; perdido → viram "recusada".
 */
export async function moverNegocio(id: number, etapa: Etapa): Promise<{ id: number; etapa: Etapa; fechadoEm: string | null } | null> {
  const [atualizado] = await consultar<{ id: number; etapa: Etapa; fechado_em: string | null }>(
    `UPDATE negocios
        SET fechado_em = CASE
              WHEN ? = 'fechado' THEN COALESCE(CASE WHEN etapa = 'fechado' THEN fechado_em END, ${AGORA_ISO})
              ELSE NULL
            END,
            etapa = ?
      WHERE id = ?
      RETURNING id, etapa, fechado_em`,
    [etapa, etapa, id],
  );
  if (!atualizado) return null;

  const novoStatus = etapa === "fechado" ? "aceita" : etapa === "perdido" ? "recusada" : null;
  if (novoStatus) {
    await consultar(`UPDATE propostas SET status = ? WHERE negocio_id = ? AND status = 'aberta'`, [novoStatus, id]);
  }
  return { id: atualizado.id, etapa: atualizado.etapa, fechadoEm: atualizado.fechado_em };
}
