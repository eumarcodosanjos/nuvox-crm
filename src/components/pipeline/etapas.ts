import type { Etapa } from "@/lib/tipos";

/** Colunas do kanban, na ordem da subida. */
export const COLUNAS = ["novo", "contato", "proposta", "negociacao", "fechado"] as const;
export type EtapaColuna = (typeof COLUNAS)[number];

/** Cor da linha sob o título da coluna e do ícone da próxima tarefa (manual, tela "Pipeline de vendas"). */
export const COR_COLUNA: Record<EtapaColuna, { linha: string; icone: string }> = {
  novo: { linha: "bg-degrau-2", icone: "text-apoio" },
  contato: { linha: "bg-apoio", icone: "text-tatame" },
  proposta: { linha: "bg-roxo", icone: "text-[#8D86E0]" },
  negociacao: { linha: "bg-tatame", icone: "text-tatame" },
  fechado: { linha: "bg-limao", icone: "text-limao" },
};

export const TITULO_COLUNA: Record<EtapaColuna, string> = {
  novo: "Novo",
  contato: "Contato",
  proposta: "Proposta",
  negociacao: "Negociação",
  fechado: "Fechado no mês",
};

export const ehColuna = (e: Etapa | string): e is EtapaColuna => (COLUNAS as readonly string[]).includes(e);
