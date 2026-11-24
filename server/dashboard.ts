/**
 * Consultas do Dashboard.
 *
 * Os valores de negócio são somados em TypeScript com valorNegocio(), para que a
 * regra exista em um lugar só. Com o volume de um CRM comercial (centenas ou
 * poucos milhares de negócios) isso é instantâneo. Se crescer muito, dá para
 * levar a mesma conta para SQL.
 */
import { valorNegocio } from "../src/lib/negocio.js";
import type {
  DashboardKpis,
  Etapa,
  FunilEtapa,
  FunilResposta,
  NomeProduto,
  Origem,
  OrigemLeads,
  Periodo,
  ProdutoResumo,
  PropostaVencendo,
  TarefaHoje,
} from "../src/lib/tipos.js";
import { consultar } from "./db.js";
import { dataHojeSP, intervalo, primeiroDiaDoMesSP } from "./periodo.js";

interface LinhaNegocio {
  id: number;
  produto_id: number;
  etapa: Etapa;
  valor_implantacao: number;
  valor_mensal: number;
  valor_avulso: number;
  created_at: string;
  fechado_em: string | null;
}

const ABERTAS: Etapa[] = ["novo", "contato", "proposta", "negociacao"];
const DIA_MS = 86_400_000;

/** Filtro de produto: id do produto, ou null para todos. */
export type FiltroProduto = number | null;
const doProduto = <T extends { produto_id: number }>(lista: T[], produto: FiltroProduto) =>
  produto == null ? lista : lista.filter((n) => n.produto_id === produto);

const soma = (ns: LinhaNegocio[]) => ns.reduce((t, n) => t + valorNegocio(n), 0);
const noIntervalo = (iso: string | null, i: { inicio: string; fim: string }) =>
  !!iso && iso >= i.inicio && iso < i.fim;

function carregarNegocios() {
  return consultar<LinhaNegocio>(
    `SELECT id, produto_id, etapa, valor_implantacao, valor_mensal, valor_avulso, created_at, fechado_em
       FROM negocios`,
  );
}

export async function kpis(periodo: Periodo, produto: FiltroProduto = null): Promise<DashboardKpis> {
  const [todos, [licencas], [meta]] = await Promise.all([
    carregarNegocios(),
    consultar<{ valor: number; clientes: number }>(
      `SELECT COALESCE(SUM(valor_mensal), 0) AS valor, COUNT(DISTINCT lead_id) AS clientes
         FROM licencas WHERE ativa = 1 AND (? IS NULL OR produto_id = ?)`,
      [produto, produto],
    ),
    consultar<{ valor: number }>(`SELECT valor FROM metas WHERE mes = ?`, [primeiroDiaDoMesSP()]),
  ]);

  const doPeriodo = intervalo(periodo);
  const doMes = intervalo("mes");
  const negocios = doProduto(todos, produto);
  const abertos = negocios.filter((n) => ABERTAS.includes(n.etapa));
  const fechados = negocios.filter((n) => n.etapa === "fechado");
  const fechadosPeriodo = fechados.filter((n) => noIntervalo(n.fechado_em, doPeriodo));
  // A meta é uma só para a empresa: compara com o fechado no mês de TODOS os produtos.
  const fechadoMes = soma(todos.filter((n) => n.etapa === "fechado" && noIntervalo(n.fechado_em, doMes)));
  const comImplantacao = fechadosPeriodo.filter((n) => n.valor_implantacao > 0);
  const valorMeta = meta?.valor ?? null;

  return {
    receitaRecorrente: { valor: licencas?.valor ?? 0, clientes: licencas?.clientes ?? 0 },
    pipelineAberto: { valor: soma(abertos), negocios: abertos.length },
    fechadoPeriodo: { valor: soma(fechadosPeriodo), negocios: fechadosPeriodo.length },
    meta: {
      valor: valorMeta,
      fechadoMes,
      percentual: valorMeta ? fechadoMes / valorMeta : null,
    },
    implantacoes: {
      quantidade: comImplantacao.length,
      valor: comImplantacao.reduce((t, n) => t + n.valor_implantacao, 0),
    },
  };
}

export async function funil(periodo: Periodo, produto: FiltroProduto = null): Promise<FunilResposta> {
  const [todos, produtos] = await Promise.all([
    carregarNegocios(),
    listarProdutos(),
  ]);
  const negocios = doProduto(todos, produto);
  const doPeriodo = intervalo(periodo);
  const fechados = negocios.filter((n) => n.etapa === "fechado");
  const perdidos = negocios.filter((n) => n.etapa === "perdido");

  // Etapas abertas: foto atual. Fechado: negócios fechados no período escolhido.
  const etapas: FunilEtapa[] = [...ABERTAS, "fechado" as const].map((etapa) => {
    const grupo =
      etapa === "fechado"
        ? fechados.filter((n) => noIntervalo(n.fechado_em, doPeriodo))
        : negocios.filter((n) => n.etapa === etapa);
    return { etapa: etapa as FunilEtapa["etapa"], quantidade: grupo.length, valor: soma(grupo) };
  });

  // Indicadores do rodapé: histórico completo
  const decididos = fechados.length + perdidos.length;
  const ciclos = fechados
    .filter((n) => n.fechado_em)
    .map((n) => (Date.parse(n.fechado_em!) - Date.parse(n.created_at)) / DIA_MS);

  // "Pipeline por produto" mostra sempre os três produtos, para comparar.
  const abertos = todos.filter((n) => ABERTAS.includes(n.etapa));

  return {
    etapas,
    conversao: decididos ? fechados.length / decididos : null,
    cicloMedioDias: ciclos.length ? Math.round(ciclos.reduce((a, b) => a + b, 0) / ciclos.length) : null,
    ticketMedio: fechados.length ? Math.round(soma(fechados) / fechados.length) : null,
    produtos: produtos.map((p) => {
      const abertosDoProduto = abertos.filter((n) => n.produto_id === p.id);
      return {
        id: p.id,
        nome: p.nome,
        cor: p.cor,
        modeloCobranca: p.modeloCobranca,
        valorAberto: soma(abertosDoProduto),
        negocios: abertosDoProduto.length,
      };
    }),
  };
}

export async function propostasVencendo(produto: FiltroProduto = null, limite = 6): Promise<PropostaVencendo[]> {
  const linhas = await consultar<{
    id: number;
    vence_em: string;
    dias: number;
    lead_nome: string;
    organizacao: string | null;
    produto: NomeProduto;
    produto_cor: string;
    valor_implantacao: number;
    valor_mensal: number;
    valor_avulso: number;
  }>(
    `SELECT p.id, p.vence_em,
            CAST(julianday(p.vence_em) - julianday(?) AS INTEGER) AS dias,
            l.nome AS lead_nome, l.organizacao, pr.nome AS produto, pr.cor AS produto_cor,
            n.valor_implantacao, n.valor_mensal, n.valor_avulso
       FROM propostas p
       JOIN negocios n  ON n.id = p.negocio_id
       JOIN leads l     ON l.id = n.lead_id
       JOIN produtos pr ON pr.id = n.produto_id
      WHERE p.status = 'aberta' AND (? IS NULL OR n.produto_id = ?)
      ORDER BY p.vence_em ASC
      LIMIT ?`,
    [dataHojeSP(), produto, produto, limite],
  );
  return linhas.map((l) => ({
    id: l.id,
    venceEm: l.vence_em,
    diasRestantes: l.dias,
    leadNome: l.lead_nome,
    organizacao: l.organizacao,
    produto: l.produto,
    produtoCor: l.produto_cor,
    valor: valorNegocio(l),
  }));
}

/** Com filtro de produto, mostra só tarefas ligadas a negócios daquele produto. */
export async function tarefasHoje(produto: FiltroProduto = null): Promise<TarefaHoje[]> {
  const { inicio, fim } = intervalo("hoje");
  const linhas = await consultar<{
    id: number;
    titulo: string;
    canal: TarefaHoje["canal"];
    data_hora: string;
    concluida: number;
    produto_cor: string | null;
    lead_nome: string | null;
    organizacao: string | null;
  }>(
    `SELECT t.id, t.titulo, t.canal, t.data_hora, t.concluida, pr.cor AS produto_cor,
            l.nome AS lead_nome, l.organizacao
       FROM tarefas t
       LEFT JOIN negocios n  ON n.id = t.negocio_id
       LEFT JOIN produtos pr ON pr.id = n.produto_id
       LEFT JOIN leads l     ON l.id = n.lead_id
      WHERE t.data_hora >= ? AND t.data_hora < ?
        AND (? IS NULL OR n.produto_id = ?)
      ORDER BY t.data_hora ASC, t.id ASC`,
    [inicio, fim, produto, produto],
  );
  return linhas.map((t) => ({
    id: t.id,
    titulo: t.titulo,
    canal: t.canal,
    dataHora: t.data_hora,
    concluida: !!t.concluida,
    produtoCor: t.produto_cor,
    leadNome: t.lead_nome,
    organizacao: t.organizacao,
  }));
}

export async function listarProdutos(): Promise<ProdutoResumo[]> {
  const linhas = await consultar<{ id: number; nome: NomeProduto; cor: string; modelo_cobranca: string }>(
    `SELECT id, nome, cor, modelo_cobranca FROM produtos ORDER BY id`,
  );
  return linhas.map((p) => ({ id: p.id, nome: p.nome, cor: p.cor, modeloCobranca: p.modelo_cobranca }));
}

export async function marcarTarefa(id: number, concluida: boolean): Promise<boolean> {
  const linhas = await consultar<{ id: number }>(
    `UPDATE tarefas SET concluida = ? WHERE id = ? RETURNING id`,
    [concluida ? 1 : 0, id],
  );
  return linhas.length > 0;
}

const ORIGENS: Origem[] = ["whatsapp", "instagram", "indicacao", "site", "outro"];

/** Com filtro de produto, conta só leads que têm negócio daquele produto. */
export async function origemLeads(periodo: Periodo, produto: FiltroProduto = null): Promise<OrigemLeads[]> {
  const { inicio, fim } = intervalo(periodo);
  const linhas = await consultar<{ origem: Origem; quantidade: number }>(
    `SELECT l.origem, COUNT(*) AS quantidade
       FROM leads l
      WHERE l.created_at >= ? AND l.created_at < ?
        AND (? IS NULL OR EXISTS (SELECT 1 FROM negocios n WHERE n.lead_id = l.id AND n.produto_id = ?))
      GROUP BY l.origem`,
    [inicio, fim, produto, produto],
  );
  const mapa = new Map(linhas.map((l) => [l.origem, l.quantidade]));
  return ORIGENS.map((origem) => ({ origem, quantidade: mapa.get(origem) ?? 0 })).sort(
    (a, b) => b.quantidade - a.quantidade,
  );
}
