/**
 * Tipos TypeScript gerados a partir do schema (db/schema.ts) via Drizzle.
 * Não edite à mão: altere o schema e rode `npm run db:gerar`.
 */
import type {
  CARGOS,
  REDES_ENSINO,
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
export type Cargo = (typeof CARGOS)[number];
export type RedeEnsino = (typeof REDES_ENSINO)[number];

export type Periodo = "hoje" | "semana" | "mes" | "ano";

/* ── Respostas da API do Dashboard ──────────────────────────────── */

export interface DashboardKpis {
  receitaRecorrente: { valor: number; clientes: number };
  pipelineAberto: { valor: number; negocios: number };
  fechadoPeriodo: { valor: number; negocios: number };
  meta: { valor: number | null; fechadoMes: number; percentual: number | null };
  implantacoes: { quantidade: number; valor: number };
}

/* ── Leads ──────────────────────────────────────────────────────── */

/** Lead na lista, com o negócio mais recente (se houver). */
export interface LeadLista {
  id: number;
  nome: string;
  organizacao: string | null;
  tipo: TipoLead;
  origem: Origem;
  telefone: string | null;
  email: string | null;
  municipio: string | null;
  uf: string | null;
  criadoEm: string;
  negocio: { id: number; etapa: Etapa; valor: number; produtoId: number; produto: NomeProduto; produtoCor: string } | null;
}

/** Corpo do POST /api/leads. Valores em centavos. */
export interface NovoLead {
  nome: string;
  organizacao?: string | null;
  tipo: TipoLead;
  origem: Origem;
  telefone?: string | null;
  email?: string | null;
  observacoes?: string | null;
  municipio?: string | null;
  uf?: string | null;
  cargo_contato?: Cargo | null;
  rede_ensino?: RedeEnsino | null;
  qtd_escolas?: number | null;
  qtd_alunos?: number | null;
  negocio: {
    produto_id: number;
    etapa: Exclude<Etapa, "perdido">;
    valor_implantacao: number;
    valor_mensal: number;
    valor_avulso: number;
  };
}

/* ── Pipeline (kanban) ──────────────────────────────────────────── */

export interface ProdutoResumo {
  id: number;
  nome: NomeProduto;
  /** Cor de identidade do produto (hex). */
  cor: string;
  modeloCobranca: string;
}

export interface NegocioPipeline {
  id: number;
  etapa: Etapa;
  leadNome: string;
  organizacao: string | null;
  produtoId: number;
  produto: NomeProduto;
  produtoCor: string;
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
  produtos: (ProdutoResumo & { valorAberto: number; negocios: number })[];
}

export interface PropostaVencendo {
  id: number;
  venceEm: string;
  diasRestantes: number;
  leadNome: string;
  organizacao: string | null;
  produto: NomeProduto;
  produtoCor: string;
  valor: number;
}

export interface TarefaHoje {
  id: number;
  titulo: string;
  canal: Canal;
  dataHora: string;
  concluida: boolean;
  /** Cor do produto do negócio ligado à tarefa (null se a tarefa não tem negócio). */
  produtoCor: string | null;
}

export interface OrigemLeads {
  origem: Origem;
  quantidade: number;
}
