/**
 * Schema do Nuvox CRM (Cloudflare D1 / SQLite).
 *
 * Fonte única da verdade: a migration SQL (drizzle/) e os tipos TypeScript
 * (src/lib/tipos.ts) são derivados deste arquivo.
 *
 * Convenções:
 * - Dinheiro em CENTAVOS (INTEGER) para não ter erro de arredondamento.
 * - Datas com hora em ISO-8601 UTC (TEXT), ex.: 2026-11-23T14:30:00.000Z.
 * - Datas sem hora em 'YYYY-MM-DD' (TEXT).
 * - "Enums" são CHECK constraints (SQLite não tem enum).
 */
import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

const agora = sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`;
const id = () => integer("id").primaryKey({ autoIncrement: true });
const lista = (valores: readonly string[]) => sql.raw(valores.map((v) => `'${v}'`).join(", "));

export const PRODUTOS = ["Nuvox Federações", "Nuvox Combat", "Nuvox Academia"] as const;
export const TIPOS_LEAD = ["federacao", "academia", "organizador_evento", "prefeitura", "outro"] as const;
export const ORIGENS = ["whatsapp", "instagram", "indicacao", "site", "outro"] as const;
export const ETAPAS = ["novo", "contato", "proposta", "negociacao", "fechado", "perdido"] as const;
export const STATUS_PROPOSTA = ["aberta", "aceita", "recusada", "vencida"] as const;
export const CANAIS = ["whatsapp", "email", "video", "ligacao", "financeiro"] as const;

export const usuarios = sqliteTable("usuarios", {
  id: id(),
  nome: text("nome").notNull(),
  email: text("email").notNull().unique(),
  senha_hash: text("senha_hash").notNull(),
  created_at: text("created_at").notNull().default(agora),
});

export const produtos = sqliteTable(
  "produtos",
  {
    id: id(),
    nome: text("nome", { enum: PRODUTOS }).notNull().unique(),
    modelo_cobranca: text("modelo_cobranca").notNull(),
  },
  (t) => [check("produtos_nome_check", sql`${t.nome} IN (${lista(PRODUTOS)})`)],
);

export const leads = sqliteTable(
  "leads",
  {
    id: id(),
    nome: text("nome").notNull(),
    organizacao: text("organizacao"),
    tipo: text("tipo", { enum: TIPOS_LEAD }).notNull().default("outro"),
    origem: text("origem", { enum: ORIGENS }).notNull().default("outro"),
    telefone: text("telefone"),
    email: text("email"),
    created_at: text("created_at").notNull().default(agora),
  },
  (t) => [
    check("leads_tipo_check", sql`${t.tipo} IN (${lista(TIPOS_LEAD)})`),
    check("leads_origem_check", sql`${t.origem} IN (${lista(ORIGENS)})`),
    index("leads_created_at_idx").on(t.created_at),
  ],
);

export const negocios = sqliteTable(
  "negocios",
  {
    id: id(),
    lead_id: integer("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
    produto_id: integer("produto_id").notNull().references(() => produtos.id),
    etapa: text("etapa", { enum: ETAPAS }).notNull().default("novo"),
    valor_implantacao: integer("valor_implantacao").notNull().default(0),
    valor_mensal: integer("valor_mensal").notNull().default(0),
    valor_avulso: integer("valor_avulso").notNull().default(0),
    created_at: text("created_at").notNull().default(agora),
    fechado_em: text("fechado_em"),
  },
  (t) => [
    check("negocios_etapa_check", sql`${t.etapa} IN (${lista(ETAPAS)})`),
    check(
      "negocios_valores_check",
      sql`${t.valor_implantacao} >= 0 AND ${t.valor_mensal} >= 0 AND ${t.valor_avulso} >= 0`,
    ),
    index("negocios_etapa_idx").on(t.etapa),
    index("negocios_fechado_em_idx").on(t.fechado_em),
    index("negocios_lead_idx").on(t.lead_id),
  ],
);

export const propostas = sqliteTable(
  "propostas",
  {
    id: id(),
    negocio_id: integer("negocio_id").notNull().references(() => negocios.id, { onDelete: "cascade" }),
    enviada_em: text("enviada_em").notNull(),
    validade_dias: integer("validade_dias").notNull().default(30),
    // Coluna gerada: sempre enviada_em + validade_dias, nunca fica fora de sincronia.
    vence_em: text("vence_em").generatedAlwaysAs(
      sql`date(enviada_em, '+' || validade_dias || ' days')`,
      { mode: "stored" },
    ),
    status: text("status", { enum: STATUS_PROPOSTA }).notNull().default("aberta"),
  },
  (t) => [
    check("propostas_status_check", sql`${t.status} IN (${lista(STATUS_PROPOSTA)})`),
    index("propostas_vence_em_idx").on(t.status, t.vence_em),
  ],
);

export const tarefas = sqliteTable(
  "tarefas",
  {
    id: id(),
    negocio_id: integer("negocio_id").references(() => negocios.id, { onDelete: "set null" }),
    titulo: text("titulo").notNull(),
    canal: text("canal", { enum: CANAIS }).notNull(),
    data_hora: text("data_hora").notNull(),
    concluida: integer("concluida", { mode: "boolean" }).notNull().default(false),
  },
  (t) => [
    check("tarefas_canal_check", sql`${t.canal} IN (${lista(CANAIS)})`),
    index("tarefas_data_hora_idx").on(t.data_hora),
  ],
);

/** Clientes com mensalidade. */
export const licencas = sqliteTable(
  "licencas",
  {
    id: id(),
    lead_id: integer("lead_id").notNull().references(() => leads.id),
    produto_id: integer("produto_id").notNull().references(() => produtos.id),
    valor_mensal: integer("valor_mensal").notNull(),
    inicio: text("inicio").notNull(),
    ultimo_reajuste_ipca: text("ultimo_reajuste_ipca"),
    ativa: integer("ativa", { mode: "boolean" }).notNull().default(true),
  },
  (t) => [index("licencas_ativa_idx").on(t.ativa)],
);

export const metas = sqliteTable(
  "metas",
  {
    id: id(),
    /** Primeiro dia do mês, 'YYYY-MM-01'. */
    mes: text("mes").notNull(),
    valor: integer("valor").notNull(),
  },
  (t) => [
    uniqueIndex("metas_mes_unico").on(t.mes),
    check("metas_mes_check", sql`${t.mes} = strftime('%Y-%m-01', ${t.mes})`),
  ],
);
