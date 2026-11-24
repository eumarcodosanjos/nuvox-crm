/**
 * Tipos TypeScript gerados a partir do schema (db/schema.ts) via Drizzle.
 * Não edite à mão: altere o schema e rode `npm run db:gerar`.
 */
import type {
  CANAIS,
  ETAPAS,
  ORIGENS,
  STATUS_PROPOSTA,
  TIPOS_LEAD,
  leads,
  licencas,
  metas,
  negocios,
  produtos,
  propostas,
  tarefas,
} from "../../db/schema";

export type Produto = typeof produtos.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type Negocio = typeof negocios.$inferSelect;
export type Proposta = typeof propostas.$inferSelect;
export type Tarefa = typeof tarefas.$inferSelect;
export type Licenca = typeof licencas.$inferSelect;
export type Meta = typeof metas.$inferSelect;

export type Etapa = (typeof ETAPAS)[number];
export type Origem = (typeof ORIGENS)[number];
export type TipoLead = (typeof TIPOS_LEAD)[number];
export type StatusProposta = (typeof STATUS_PROPOSTA)[number];
export type Canal = (typeof CANAIS)[number];
export type NomeProduto = Produto["nome"];

export type Periodo = "hoje" | "semana" | "mes" | "ano";

/* ── Respostas da API do Dashboard ──────────────────────────────── */

export interface DashboardKpis {
  receitaRecorrente: { valor: number; clientes: number };
  pipelineAberto: { valor: number; negocios: number };
  fechadoPeriodo: { valor: number; negocios: number };
  meta: { valor: number | null; fechadoMes: number; percentual: number | null };
  implantacoes: { quantidade: number; valor: number };
}

/* ── Pipeline (kanban) ──────────────────────────────────────────── */

export interface NegocioPipeline {
  id: number;
  etapa: Etapa;
  leadNome: string;
  organizacao: string | null;
  produto: NomeProduto;
  valor: number;
  criadoEm: string;
  fechadoEm: string | null;
  proximaTarefa: { titulo: string; dataHora: string } | null;
}

export interface FunilEtapa {
  etapa: Exclude<Etapa, "perdido">;
  quantidade: number;
  valor: number;
}

export interface FunilResposta {
  etapas: FunilEtapa[];
  conversao: number | null;
  cicloMedioDias: number | null;
  ticketMedio: number | null;
  produtos: { id: number; nome: NomeProduto; modeloCobranca: string; valorAberto: number; negocios: number }[];
}

export interface PropostaVencendo {
  id: number;
  venceEm: string;
  diasRestantes: number;
  leadNome: string;
  organizacao: string | null;
  produto: NomeProduto;
  valor: number;
}

export interface TarefaHoje {
  id: number;
  titulo: string;
  canal: Canal;
  dataHora: string;
  concluida: boolean;
}

export interface OrigemLeads {
  origem: Origem;
  quantidade: number;
}
