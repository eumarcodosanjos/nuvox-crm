/**
 * Leads: listar, cadastrar (o cadastro já cria o negócio no Pipeline), abrir e editar.
 */
import { valorNegocio } from "../src/lib/negocio.js";
import { CARGOS_OPCOES, ORIGENS_OPCOES, REDES_OPCOES, TIPOS, UFS } from "../src/lib/opcoes.js";
import type { Etapa, LeadDetalhe, LeadEdicao, LeadLista, NomeProduto, NovoLead } from "../src/lib/tipos.js";
import { consultar } from "./db.js";
import { moverNegocio } from "./pipeline.js";

export async function listarLeads(): Promise<LeadLista[]> {
  const linhas = await consultar<{
    id: number;
    nome: string;
    organizacao: string | null;
    tipo: LeadLista["tipo"];
    origem: LeadLista["origem"];
    telefone: string | null;
    email: string | null;
    municipio: string | null;
    uf: string | null;
    created_at: string;
    negocio_id: number | null;
    etapa: Etapa | null;
    valor_implantacao: number | null;
    valor_mensal: number | null;
    valor_avulso: number | null;
    produto_id: number | null;
    produto: NomeProduto | null;
    produto_cor: string | null;
  }>(
    `SELECT l.id, l.nome, l.organizacao, l.tipo, l.origem, l.telefone, l.email, l.municipio, l.uf, l.created_at,
            n.id AS negocio_id, n.etapa, n.valor_implantacao, n.valor_mensal, n.valor_avulso,
            n.produto_id, pr.nome AS produto, pr.cor AS produto_cor
       FROM leads l
       LEFT JOIN negocios n ON n.id = (
            SELECT id FROM negocios WHERE lead_id = l.id ORDER BY created_at DESC, id DESC LIMIT 1)
       LEFT JOIN produtos pr ON pr.id = n.produto_id
      ORDER BY l.created_at DESC, l.id DESC`,
  );
  return linhas.map((l) => ({
    id: l.id,
    nome: l.nome,
    organizacao: l.organizacao,
    tipo: l.tipo,
    origem: l.origem,
    telefone: l.telefone,
    email: l.email,
    municipio: l.municipio,
    uf: l.uf,
    criadoEm: l.created_at,
    negocio:
      l.negocio_id != null && l.etapa && l.produto_id != null
        ? {
            id: l.negocio_id,
            etapa: l.etapa,
            valor: valorNegocio({
              valor_implantacao: l.valor_implantacao ?? 0,
              valor_mensal: l.valor_mensal ?? 0,
              valor_avulso: l.valor_avulso ?? 0,
            }),
            produtoId: l.produto_id,
            produto: l.produto ?? "",
            produtoCor: l.produto_cor ?? "#B5B5B0",
          }
        : null,
  }));
}

/* ── Validação ─────────────────────────────────────────────────── */

export class ErroValidacao extends Error {
  constructor(public campos: Record<string, string>) {
    super("Confira os campos destacados.");
  }
}

const ETAPAS_INICIAIS = ["novo", "contato", "proposta", "negociacao", "fechado"] as const;
const ETAPAS_EDICAO = [...ETAPAS_INICIAIS, "perdido"] as const;
const texto = (v: unknown, max: number) =>
  typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null;
const inteiro = (v: unknown) => (v === null || v === undefined || v === "" ? null : Number(v));
const em = <T extends string>(v: unknown, lista: readonly { valor: T }[] | readonly T[]) =>
  (lista as readonly (T | { valor: T })[]).some((o) => (typeof o === "string" ? o : o.valor) === v);

function validar(corpo: unknown, edicao = false): LeadEdicao {
  const c = (corpo ?? {}) as Record<string, unknown>;
  const n = (c.negocio ?? {}) as Record<string, unknown>;
  const erros: Record<string, string> = {};

  const nome = texto(c.nome, 120);
  if (!nome || nome.length < 2) erros.nome = "Informe o nome do contato.";

  const email = texto(c.email, 160);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) erros.email = "E-mail inválido.";

  const telefone = texto(c.telefone, 30);
  if (telefone && telefone.replace(/\D/g, "").length < 8) erros.telefone = "Telefone incompleto.";

  if (!em(c.tipo, TIPOS)) erros.tipo = "Escolha o tipo.";
  if (!em(c.origem, ORIGENS_OPCOES)) erros.origem = "Escolha a origem.";

  const uf = texto(c.uf, 2)?.toUpperCase() ?? null;
  if (uf && !em(uf, UFS)) erros.uf = "UF inválida.";
  const cargo = texto(c.cargo_contato, 40);
  if (cargo && !em(cargo, CARGOS_OPCOES)) erros.cargo_contato = "Cargo inválido.";
  const rede = texto(c.rede_ensino, 20);
  if (rede && !em(rede, REDES_OPCOES)) erros.rede_ensino = "Rede inválida.";

  const qtdEscolas = inteiro(c.qtd_escolas);
  if (qtdEscolas != null && !(Number.isInteger(qtdEscolas) && qtdEscolas >= 0)) erros.qtd_escolas = "Número inválido.";
  const qtdAlunos = inteiro(c.qtd_alunos);
  if (qtdAlunos != null && !(Number.isInteger(qtdAlunos) && qtdAlunos >= 0)) erros.qtd_alunos = "Número inválido.";

  const produtoId = Number(n.produto_id);
  if (!Number.isInteger(produtoId) || produtoId <= 0) erros.produto_id = "Escolha o produto.";
  if (!em(n.etapa, edicao ? ETAPAS_EDICAO : ETAPAS_INICIAIS)) erros.etapa = "Etapa inválida.";
  const valores = ["valor_implantacao", "valor_mensal", "valor_avulso"].map((k) => {
    const v = Number(n[k] ?? 0);
    if (!Number.isInteger(v) || v < 0 || v > 100_000_000_00) erros[k] = "Valor inválido.";
    return v;
  });

  if (Object.keys(erros).length) throw new ErroValidacao(erros);
  return {
    nome: nome!,
    organizacao: texto(c.organizacao, 160),
    tipo: c.tipo as NovoLead["tipo"],
    origem: c.origem as NovoLead["origem"],
    telefone,
    email,
    observacoes: texto(c.observacoes, 2000),
    municipio: texto(c.municipio, 80),
    uf,
    cargo_contato: cargo as NovoLead["cargo_contato"],
    rede_ensino: rede as NovoLead["rede_ensino"],
    qtd_escolas: qtdEscolas,
    qtd_alunos: qtdAlunos,
    negocio: {
      produto_id: produtoId,
      etapa: n.etapa as Etapa,
      valor_implantacao: valores[0]!,
      valor_mensal: valores[1]!,
      valor_avulso: valores[2]!,
    },
  };
}

/* ── Cadastro ──────────────────────────────────────────────────── */

export async function criarLead(corpo: unknown): Promise<{ leadId: number; negocioId: number }> {
  const l = validar(corpo) as NovoLead;

  const [produto] = await consultar<{ id: number }>(`SELECT id FROM produtos WHERE id = ?`, [l.negocio.produto_id]);
  if (!produto) throw new ErroValidacao({ produto_id: "Produto não encontrado." });

  const [lead] = await consultar<{ id: number }>(
    `INSERT INTO leads (nome, organizacao, tipo, origem, telefone, email, observacoes,
                        municipio, uf, cargo_contato, rede_ensino, qtd_escolas, qtd_alunos)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     RETURNING id`,
    [l.nome, l.organizacao ?? null, l.tipo, l.origem, l.telefone ?? null, l.email ?? null, l.observacoes ?? null,
     l.municipio ?? null, l.uf ?? null, l.cargo_contato ?? null, l.rede_ensino ?? null, l.qtd_escolas ?? null, l.qtd_alunos ?? null],
  );
  if (!lead) throw new Error("O banco não devolveu o id do lead.");

  try {
    const [negocio] = await consultar<{ id: number }>(
      `INSERT INTO negocios (lead_id, produto_id, etapa, valor_implantacao, valor_mensal, valor_avulso, fechado_em)
       VALUES (?, ?, ?, ?, ?, ?, CASE WHEN ? = 'fechado' THEN strftime('%Y-%m-%dT%H:%M:%fZ', 'now') END)
       RETURNING id`,
      [lead.id, l.negocio.produto_id, l.negocio.etapa, l.negocio.valor_implantacao, l.negocio.valor_mensal,
       l.negocio.valor_avulso, l.negocio.etapa],
    );
    if (!negocio) throw new Error("O banco não devolveu o id do negócio.");
    return { leadId: lead.id, negocioId: negocio.id };
  } catch (e) {
    // Não deixa lead "órfão" sem negócio se a segunda gravação falhar.
    await consultar(`DELETE FROM leads WHERE id = ?`, [lead.id]).catch(() => {});
    throw e;
  }
}

/* ── Abrir e editar ────────────────────────────────────────────── */

type LinhaLead = {
  id: number;
  nome: string;
  organizacao: string | null;
  tipo: LeadDetalhe["tipo"];
  origem: LeadDetalhe["origem"];
  telefone: string | null;
  email: string | null;
  observacoes: string | null;
  municipio: string | null;
  uf: string | null;
  cargo_contato: LeadDetalhe["cargo_contato"];
  rede_ensino: LeadDetalhe["rede_ensino"];
  qtd_escolas: number | null;
  qtd_alunos: number | null;
  created_at: string;
  negocio_id: number | null;
  produto_id: number | null;
  etapa: Etapa | null;
  valor_implantacao: number | null;
  valor_mensal: number | null;
  valor_avulso: number | null;
};

/** Lead com o negócio mais recente (o mesmo que aparece na lista e no Pipeline). */
export async function buscarLead(id: number): Promise<LeadDetalhe | null> {
  const [l] = await consultar<LinhaLead>(
    `SELECT l.id, l.nome, l.organizacao, l.tipo, l.origem, l.telefone, l.email, l.observacoes,
            l.municipio, l.uf, l.cargo_contato, l.rede_ensino, l.qtd_escolas, l.qtd_alunos, l.created_at,
            n.id AS negocio_id, n.produto_id, n.etapa, n.valor_implantacao, n.valor_mensal, n.valor_avulso
       FROM leads l
       LEFT JOIN negocios n ON n.id = (
            SELECT id FROM negocios WHERE lead_id = l.id ORDER BY created_at DESC, id DESC LIMIT 1)
      WHERE l.id = ?`,
    [id],
  );
  if (!l) return null;
  return {
    id: l.id,
    nome: l.nome,
    organizacao: l.organizacao,
    tipo: l.tipo,
    origem: l.origem,
    telefone: l.telefone,
    email: l.email,
    observacoes: l.observacoes,
    municipio: l.municipio,
    uf: l.uf,
    cargo_contato: l.cargo_contato,
    rede_ensino: l.rede_ensino,
    qtd_escolas: l.qtd_escolas,
    qtd_alunos: l.qtd_alunos,
    criadoEm: l.created_at,
    negocio:
      l.negocio_id != null && l.produto_id != null && l.etapa
        ? {
            id: l.negocio_id,
            produto_id: l.produto_id,
            etapa: l.etapa,
            valor_implantacao: l.valor_implantacao ?? 0,
            valor_mensal: l.valor_mensal ?? 0,
            valor_avulso: l.valor_avulso ?? 0,
          }
        : null,
  };
}

/**
 * Salva o lead e o negócio mais recente dele (produto, valores e etapa).
 * A etapa passa por moverNegocio, que cuida da data de fechamento e das propostas.
 */
export async function atualizarLead(id: number, corpo: unknown): Promise<LeadDetalhe | null> {
  const l = validar(corpo, true);
  const atual = await buscarLead(id);
  if (!atual) return null;

  const [produto] = await consultar<{ id: number }>(`SELECT id FROM produtos WHERE id = ?`, [l.negocio.produto_id]);
  if (!produto) throw new ErroValidacao({ produto_id: "Produto não encontrado." });

  await consultar(
    `UPDATE leads
        SET nome = ?, organizacao = ?, tipo = ?, origem = ?, telefone = ?, email = ?, observacoes = ?,
            municipio = ?, uf = ?, cargo_contato = ?, rede_ensino = ?, qtd_escolas = ?, qtd_alunos = ?
      WHERE id = ?`,
    [l.nome, l.organizacao ?? null, l.tipo, l.origem, l.telefone ?? null, l.email ?? null, l.observacoes ?? null,
     l.municipio ?? null, l.uf ?? null, l.cargo_contato ?? null, l.rede_ensino ?? null, l.qtd_escolas ?? null,
     l.qtd_alunos ?? null, id],
  );

  if (atual.negocio) {
    await consultar(
      `UPDATE negocios SET produto_id = ?, valor_implantacao = ?, valor_mensal = ?, valor_avulso = ? WHERE id = ?`,
      [l.negocio.produto_id, l.negocio.valor_implantacao, l.negocio.valor_mensal, l.negocio.valor_avulso, atual.negocio.id],
    );
    if (atual.negocio.etapa !== l.negocio.etapa) await moverNegocio(atual.negocio.id, l.negocio.etapa);
  } else {
    await consultar(
      `INSERT INTO negocios (lead_id, produto_id, etapa, valor_implantacao, valor_mensal, valor_avulso, fechado_em)
       VALUES (?, ?, ?, ?, ?, ?, CASE WHEN ? = 'fechado' THEN strftime('%Y-%m-%dT%H:%M:%fZ', 'now') END)`,
      [id, l.negocio.produto_id, l.negocio.etapa, l.negocio.valor_implantacao, l.negocio.valor_mensal,
       l.negocio.valor_avulso, l.negocio.etapa],
    );
  }
  return buscarLead(id);
}
