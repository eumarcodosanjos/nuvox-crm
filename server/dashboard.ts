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

const soma = (ns: LinhaNegocio[]) => ns.reduce((t, n) => t + valorNegocio(n), 0);
const noIntervalo = (iso: string | null, i: { inicio: string; fim: string }) =>
  !!iso && iso >= i.inicio && iso < i.fim;

function carregarNegocios() {
  return consultar<LinhaNegocio>(
    `SELECT id, produto_id, etapa, valor_implantacao, valor_mensal, valor_avulso, created_at, fechado_em
       FROM negocios`,
  );
}

export async function kpis(periodo: Periodo): Promise<DashboardKpis> {
  const [negocios, [licencas], [meta]] = await Promise.all([
    carregarNegocios(),
    consultar<{ valor: number; clientes: number }>(
      `SELECT COALESCE(SUM(valor_mensal), 0) AS valor, COUNT(DISTINCT lead_id) AS clientes
         FROM licencas WHERE ativa = 1`,
    ),
    consultar<{ valor: number }>(`SELECT valor FROM metas WHERE mes = ?`, [primeiroDiaDoMesSP()]),
  ]);

  const doPeriodo = intervalo(periodo);
  const doMes = intervalo("mes");
  const abertos = negocios.filter((n) => ABERTAS.includes(n.etapa));
  const fechados = negocios.filter((n) => n.etapa === "fechado");
  const fechadosPeriodo = fechados.filter((n) => noIntervalo(n.fechado_em, doPeriodo));
  const fechadoMes = soma(fechados.filter((n) => noIntervalo(n.fechado_em, doMes)));
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

export async function funil(periodo: Periodo): Promise<FunilResposta> {
  const [negocios, produtos] = await Promise.all([
    carregarNegocios(),
    consultar<{ id: number; nome: NomeProduto; modelo_cobranca: string }>(
      `SELECT id, nome, modelo_cobranca FROM produtos ORDER BY id`,
    ),
  ]);
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

  const abertos = negocios.filter((n) => ABERTAS.includes(n.etapa));

  return {
    etapas,
    conversao: decididos ? fechados.length / decididos : null,
    cicloMedioDias: ciclos.length ? Math.round(ciclos.reduce((a, b) => a + b, 0) / ciclos.length) : null,
    ticketMedio: fechados.length ? Math.round(soma(fechados) / fechados.length) : null,
    produtos: produtos.map((p) => {
      const doProduto = abertos.filter((n) => n.produto_id === p.id);
      return {
        id: p.id,
        nome: p.nome,
        modeloCobranca: p.modelo_cobranca,
        valorAberto: soma(doProduto),
        negocios: doProduto.length,
      };
    }),
  };
}

export async function propostasVencendo(limite = 6): Promise<PropostaVencendo[]> {
  const linhas = await consultar<{
    id: number;
    vence_em: string;
    dias: number;
    lead_nome: string;
    organizacao: string | null;
    produto: NomeProduto;
    valor_implantacao: number;
    valor_mensal: number;
    valor_avulso: number;
  }>(
    `SELECT p.id, p.vence_em,
            CAST(julianday(p.vence_em) - julianday(?) AS INTEGER) AS dias,
            l.nome AS lead_nome, l.organizacao, pr.nome AS produto,
            n.valor_implantacao, n.valor_mensal, n.valor_avulso
       FROM propostas p
       JOIN negocios n  ON n.id = p.negocio_id
       JOIN leads l     ON l.id = n.lead_id
       JOIN produtos pr ON pr.id = n.produto_id
      WHERE p.status = 'aberta'
      ORDER BY p.vence_em ASC
      LIMIT ?`,
    [dataHojeSP(), limite],
  );
  return linhas.map((l) => ({
    id: l.id,
    venceEm: l.vence_em,
    diasRestantes: l.dias,
    leadNome: l.lead_nome,
    organizacao: l.organizacao,
    produto: l.produto,
    valor: valorNegocio(l),
  }));
}

export async function tarefasHoje(): Promise<TarefaHoje[]> {
  const { inicio, fim } = intervalo("hoje");
  const linhas = await consultar<{
    id: number;
    titulo: string;
    canal: TarefaHoje["canal"];
    data_hora: string;
    concluida: number;
  }>(
    `SELECT id, titulo, canal, data_hora, concluida
       FROM tarefas
      WHERE data_hora >= ? AND data_hora < ?
      ORDER BY data_hora ASC, id ASC`,
    [inicio, fim],
  );
  return linhas.map((t) => ({
    id: t.id,
    titulo: t.titulo,
    canal: t.canal,
    dataHora: t.data_hora,
    concluida: !!t.concluida,
  }));
}

export async function marcarTarefa(id: number, concluida: boolean): Promise<boolean> {
  const linhas = await consultar<{ id: number }>(
    `UPDATE tarefas SET concluida = ? WHERE id = ? RETURNING id`,
    [concluida ? 1 : 0, id],
  );
  return linhas.length > 0;
}

const ORIGENS: Origem[] = ["whatsapp", "instagram", "indicacao", "site", "outro"];

export async function origemLeads(periodo: Periodo): Promise<OrigemLeads[]> {
  const { inicio, fim } = intervalo(periodo);
  const linhas = await consultar<{ origem: Origem; quantidade: number }>(
    `SELECT origem, COUNT(*) AS quantidade
       FROM leads
      WHERE created_at >= ? AND created_at < ?
      GROUP BY origem`,
    [inicio, fim],
  );
  const mapa = new Map(linhas.map((l) => [l.origem, l.quantidade]));
  return ORIGENS.map((origem) => ({ origem, quantidade: mapa.get(origem) ?? 0 })).sort(
    (a, b) => b.quantidade - a.quantidade,
  );
}
