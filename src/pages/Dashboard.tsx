import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, Plus } from "lucide-react";
import { Bloco } from "@/components/dashboard/Bloco";
import { Erro, SkeletonLinhas, Vazio } from "@/components/dashboard/Estados";
import { FunilBarra } from "@/components/dashboard/FunilBarra";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { MetaDegraus } from "@/components/dashboard/MetaDegraus";
import { OrigemBarra } from "@/components/dashboard/OrigemBarra";
import { ProdutoLinha } from "@/components/dashboard/ProdutoLinha";
import { PropostaItem } from "@/components/dashboard/PropostaItem";
import { TarefaItem } from "@/components/dashboard/TarefaItem";
import { FiltroProduto } from "@/components/app/FiltroProduto";
import { Icone } from "@/components/marca/Icone";
import { Button } from "@/components/ui/button";
import { useDashboardKpis } from "@/hooks/useDashboardKpis";
import { useFunil } from "@/hooks/useFunil";
import { useProdutoSelecionado } from "@/hooks/useProdutos";
import { useOrigemLeads } from "@/hooks/useOrigemLeads";
import { usePropostasVencendo } from "@/hooks/usePropostasVencendo";
import { useMarcarTarefa, useTarefasHoje } from "@/hooks/useTarefasHoje";
import {
  moeda,
  moedaCurta,
  percentual,
  PERIODOS,
  plural,
  primeiroNome,
  ROTULO_ORIGEM,
  saudacao,
} from "@/lib/formato";
import type { DashboardKpis, OrigemLeads, Periodo } from "@/lib/tipos";
import { Skeleton } from "@/components/ui/skeleton";
import { USUARIO } from "@/lib/usuario";
import { cn } from "@/lib/utils";

function lerPeriodo(v: string | null): Periodo {
  return v === "hoje" || v === "semana" || v === "ano" ? v : "mes";
}

export default function Dashboard() {
  const [params, setParams] = useSearchParams();
  const periodo = lerPeriodo(params.get("periodo"));
  const tituloPeriodo = PERIODOS.find((p) => p.valor === periodo)!.titulo;

  return (
    // Celular: uma coluna, gaps menores e tarefas logo depois dos números (ordem via `order`).
    <div className="flex flex-col gap-3 sm:gap-6">
      {/* 1. Cabeçalho */}
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 sm:gap-y-4">
        <div className="flex w-full items-end justify-between gap-3 sm:block sm:w-auto">
          <div>
            <p className="text-sm text-apoio">
              {saudacao()}, {primeiroNome(USUARIO.nome)}
            </p>
            <h1 className="mt-1 font-titulo text-[26px] text-tatame sm:text-[44px]">Dashboard</h1>
          </div>
          <Button asChild size="icone" className="sm:hidden">
            <Link to="/leads?novo=1" aria-label="Novo lead">
              <Icone icone={Plus} className="!size-5" strokeWidth={3} />
            </Link>
          </Button>
        </div>
        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
          <FiltroPeriodo
            valor={periodo}
            aoMudar={(p) =>
              setParams(
                (atual) => {
                  const novo = new URLSearchParams(atual);
                  if (p === "mes") novo.delete("periodo");
                  else novo.set("periodo", p);
                  return novo;
                },
                { replace: true },
              )
            }
          />
          <Button asChild className="hidden sm:inline-flex">
            <Link to="/leads?novo=1">
              <Icone icone={Plus} className="size-4" strokeWidth={3} />
              Novo lead
            </Link>
          </Button>
        </div>
      </header>

      {/* Filtro por produto */}
      <FiltroProduto className="sm:-mt-2" />

      {/* 2. Indicadores */}
      <Indicadores periodo={periodo} tituloPeriodo={tituloPeriodo} />

      {/* 3. Funil + Pipeline por produto */}
      <FunilEProdutos periodo={periodo} />

      {/* 4. Propostas, tarefas e origem (no celular, os três viram itens da coluna principal) */}
      <div className="contents sm:flex sm:flex-wrap sm:gap-4">
        <PropostasVencendo />
        <TarefasDeHoje />
        <OrigemDosLeads periodo={periodo} tituloPeriodo={tituloPeriodo} />
      </div>
    </div>
  );
}

function FiltroPeriodo({ valor, aoMudar }: { valor: Periodo; aoMudar: (p: Periodo) => void }) {
  return (
    <div role="group" aria-label="Período" className="grid flex-1 grid-cols-4 border border-borda sm:flex-none">
      {PERIODOS.map((p) => {
        const ativo = p.valor === valor;
        return (
          <button
            key={p.valor}
            type="button"
            aria-pressed={ativo}
            onClick={() => aoMudar(p.valor)}
            className={cn(
              "min-h-11 px-4 text-[11px] font-semibold uppercase tracking-rotulo transition-colors",
              ativo ? "bg-tatame text-podio" : "text-apoio hover:text-tatame",
            )}
          >
            {p.rotulo}
          </button>
        );
      })}
    </div>
  );
}

function Indicadores({ periodo, tituloPeriodo }: { periodo: Periodo; tituloPeriodo: string }) {
  const [produto] = useProdutoSelecionado();
  const { data, isPending, isError, error, refetch } = useDashboardKpis(periodo, produto);

  if (isError) {
    return (
      <div className="border border-borda bg-superficie p-5">
        <Erro mensagem={error.message} aoTentar={() => refetch()} />
      </div>
    );
  }

  return (
    <>
    <IndicadoresCelular dados={data} carregando={isPending} tituloPeriodo={tituloPeriodo} geral={produto != null} />
    <div className="hidden gap-4 sm:grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))" }}>
      <KpiCard
        carregando={isPending}
        rotulo="Receita recorrente"
        valor={data && moeda(data.receitaRecorrente.valor)}
        detalhe={data && `por mês · ${plural(data.receitaRecorrente.clientes, "cliente", "clientes")}`}
      />
      <KpiCard
        carregando={isPending}
        rotulo="Pipeline aberto"
        valor={data && moeda(data.pipelineAberto.valor)}
        detalhe={data && plural(data.pipelineAberto.negocios, "negócio em andamento", "negócios em andamento")}
      />
      <KpiCard
        carregando={isPending}
        destaque
        rotulo={`Fechado ${tituloPeriodo}`}
        valor={data && moeda(data.fechadoPeriodo.valor)}
        detalhe={data && plural(data.fechadoPeriodo.negocios, "negócio fechado", "negócios fechados")}
      >
        {data && <MetaDegraus percentual={data.meta.percentual} meta={data.meta.valor} geral={produto != null} />}
      </KpiCard>
      <KpiCard
        carregando={isPending}
        rotulo="Implantações"
        valor={data?.implantacoes.quantidade}
        detalhe={data && `${moeda(data.implantacoes.valor)} em implantação ${tituloPeriodo}`}
      />
    </div>
    </>
  );
}

/** Celular: os 4 números numa caixa só (2×2) e a meta do mês numa linha embaixo. */
function IndicadoresCelular({
  dados,
  carregando,
  tituloPeriodo,
  geral,
}: {
  dados: DashboardKpis | undefined;
  carregando: boolean;
  tituloPeriodo: string;
  geral: boolean;
}) {
  const celulas = dados
    ? [
        {
          rotulo: "Receita recorrente",
          valor: moedaCurta(dados.receitaRecorrente.valor),
          completo: moeda(dados.receitaRecorrente.valor),
          detalhe: `por mês · ${plural(dados.receitaRecorrente.clientes, "cliente", "clientes")}`,
        },
        {
          rotulo: "Pipeline aberto",
          valor: moedaCurta(dados.pipelineAberto.valor),
          completo: moeda(dados.pipelineAberto.valor),
          detalhe: plural(dados.pipelineAberto.negocios, "negócio", "negócios"),
        },
        {
          rotulo: `Fechado ${tituloPeriodo}`,
          valor: moedaCurta(dados.fechadoPeriodo.valor),
          completo: moeda(dados.fechadoPeriodo.valor),
          detalhe: plural(dados.fechadoPeriodo.negocios, "negócio", "negócios"),
          destaque: true,
        },
        {
          rotulo: "Implantações",
          valor: String(dados.implantacoes.quantidade),
          completo: plural(dados.implantacoes.quantidade, "implantação", "implantações"),
          detalhe: `${moedaCurta(dados.implantacoes.valor)} ${tituloPeriodo}`,
        },
      ]
    : [];
  const meta = dados?.meta;
  const preenchidos = meta?.percentual != null ? Math.min(5, Math.floor(meta.percentual * 5)) : 0;

  return (
    <section aria-label="Indicadores" aria-busy={carregando || undefined} className="border border-borda bg-superficie sm:hidden">
      <dl className="grid grid-cols-2">
        {(carregando || !dados ? Array.from({ length: 4 }, () => null) : celulas).map((c, i) => (
          <div
            key={c?.rotulo ?? i}
            className={cn("min-w-0 px-3.5 py-3", i % 2 === 0 && "border-r border-borda", i < 2 && "border-b border-borda")}
          >
            {c ? (
              <>
                <dt className="rotulo truncate !text-[10px]">{c.rotulo}</dt>
                <dd
                  className={cn("num mt-2 truncate font-titulo text-[19px] max-[359px]:text-[15px]", c.destaque ? "text-limao" : "text-tatame")}
                  title={c.completo}
                >
                  {c.valor}
                </dd>
                <dd className="num mt-1.5 truncate text-xs text-apoio">{c.detalhe}</dd>
              </>
            ) : (
              <div aria-hidden className="flex flex-col gap-2">
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-5 w-4/5" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            )}
          </div>
        ))}
      </dl>
      <div className="flex min-h-11 items-center gap-2.5 border-t border-borda px-3.5 py-2.5">
        <span className="rotulo shrink-0 !text-[10px]">{geral ? "Meta · geral" : "Meta do mês"}</span>
        {meta?.valor && meta.percentual != null ? (
          <>
            <span
              role="meter"
              aria-label="Meta do mês"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(meta.percentual * 100)}
              aria-valuetext={`${percentual(meta.percentual)} da meta`}
              className="grid w-16 shrink-0 grid-cols-5 gap-0.5"
            >
              {Array.from({ length: 5 }, (_, i) => (
                <span key={i} className={cn("h-1.5", i < preenchidos ? "bg-limao" : "bg-borda")} />
              ))}
            </span>
            <span className="num ml-auto truncate text-[13px]" title={`${moeda(meta.fechadoMes)} de ${moeda(meta.valor)}`}>
              <span className="font-semibold text-tatame">{percentual(meta.percentual)}</span>
              <span className="text-apoio"> de {moedaCurta(meta.valor)}</span>
            </span>
          </>
        ) : (
          <span className="ml-auto text-xs text-apoio">{carregando ? "" : "Sem meta cadastrada"}</span>
        )}
      </div>
    </section>
  );
}

function FunilEProdutos({ periodo }: { periodo: Periodo }) {
  const [produto] = useProdutoSelecionado();
  const { data, isPending, isError, error, refetch } = useFunil(periodo, produto);
  const maxEtapa = Math.max(0, ...(data?.etapas.map((e) => e.quantidade) ?? []));
  const maxValor = Math.max(0, ...(data?.produtos.map((p) => p.valorAberto) ?? []));
  // Sem valores preenchidos ainda, as barras de produto medem a quantidade de negócios.
  const porQuantidade = maxValor === 0;
  const maxProduto = porQuantidade ? Math.max(0, ...(data?.produtos.map((p) => p.negocios) ?? [])) : maxValor;
  const zerados = data?.produtos.filter((p) => p.negocios === 0).map((p) => p.nome) ?? [];
  const semNegocios = data && data.etapas.every((e) => e.quantidade === 0);

  return (
    <div className="order-2 flex flex-wrap gap-3 sm:order-none sm:gap-4">
      <Bloco
        titulo="Funil de vendas"
        className="flex-[2_1_480px]"
        ocupado={isPending}
        acao={
          <Link
            to="/pipeline"
            className="flex min-h-11 items-center gap-1.5 px-2.5 text-[11px] font-semibold uppercase tracking-rotulo text-tatame hover:text-limao sm:-mr-2 sm:px-2"
          >
            <span className="sm:hidden">Pipeline</span>
            <span className="hidden sm:inline">Abrir pipeline</span>
            <Icone icone={ArrowRight} className="size-4" />
          </Link>
        }
        rodape={
          data && !semNegocios ? (
            <dl className="grid grid-cols-3 divide-x divide-borda sm:gap-4 sm:divide-x-0">
              <Metrica rotulo="Conversão" valor={data.conversao != null ? percentual(data.conversao) : "—"} />
              <Metrica
                rotulo="Ciclo médio"
                valor={data.cicloMedioDias != null ? plural(data.cicloMedioDias, "dia", "dias") : "—"}
              />
              <Metrica
                rotulo="Ticket médio"
                valor={data.ticketMedio != null ? moeda(data.ticketMedio) : "—"}
                curto={data.ticketMedio != null ? moedaCurta(data.ticketMedio) : "—"}
              />
            </dl>
          ) : undefined
        }
      >
        {isPending && <SkeletonLinhas linhas={5} />}
        {isError && <Erro mensagem={error.message} aoTentar={() => refetch()} />}
        {semNegocios && <Vazio>Funil vazio. Cadastre o primeiro lead e comece a subida.</Vazio>}
        {data && !semNegocios && (
          <ol className="flex flex-col gap-2.5 sm:gap-3" aria-label="Negócios por etapa">
            {data.etapas.map((e) => (
              <FunilBarra key={e.etapa} etapa={e} maximo={maxEtapa} />
            ))}
          </ol>
        )}
      </Bloco>

      <Bloco titulo="Pipeline por produto" className="flex-[1_1_300px]" ocupado={isPending}>
        {isPending && <SkeletonLinhas linhas={3} altura="h-12" />}
        {isError && <Erro mensagem={error.message} aoTentar={() => refetch()} />}
        {data && (
          <>
            <ul className="flex flex-col gap-4 sm:gap-6">
              {data.produtos.map((p) => (
                <ProdutoLinha key={p.id} produto={p} maximo={maxProduto} porQuantidade={porQuantidade} />
              ))}
            </ul>
            {/* Celular: produtos sem negócio viram uma frase, em vez de linhas zeradas */}
            {zerados.length > 0 && zerados.length < data.produtos.length && (
              <p className="mt-3 border-t border-borda pt-3 text-xs text-apoio sm:hidden">
                {juntar(zerados)}: nenhum negócio aberto.
              </p>
            )}
          </>
        )}
      </Bloco>
    </div>
  );
}

const juntar = (nomes: string[]) =>
  nomes.length <= 1 ? (nomes[0] ?? "") : `${nomes.slice(0, -1).join(", ")} e ${nomes[nomes.length - 1]}`;

function Metrica({ rotulo, valor, curto }: { rotulo: string; valor: string; curto?: string }) {
  return (
    <div className="min-w-0 px-3.5 py-2.5 sm:p-0">
      <dt className="rotulo truncate max-sm:!text-[10px]">{rotulo}</dt>
      <dd className="num mt-1 truncate text-[15px] font-semibold text-tatame sm:hidden" title={valor}>
        {curto ?? valor}
      </dd>
      <dd className="num mt-1 hidden font-titulo text-base text-tatame sm:block">{valor}</dd>
    </div>
  );
}

function PropostasVencendo() {
  const [produto] = useProdutoSelecionado();
  const { data, isPending, isError, error, refetch } = usePropostasVencendo(produto);
  return (
    <Bloco titulo="Propostas vencendo" className="order-3 sm:order-none sm:flex-[1_1_300px]" ocupado={isPending}>
      {isPending && <SkeletonLinhas linhas={4} altura="h-10" />}
      {isError && <Erro mensagem={error.message} aoTentar={() => refetch()} />}
      {data?.length === 0 && <Vazio>Nenhuma proposta vencendo. Bora prospectar.</Vazio>}
      {data && data.length > 0 && (
        <ul>
          {data.map((p) => (
            <PropostaItem key={p.id} proposta={p} />
          ))}
        </ul>
      )}
    </Bloco>
  );
}

function TarefasDeHoje() {
  const [produto] = useProdutoSelecionado();
  const { data, isPending, isError, error, refetch } = useTarefasHoje(produto);
  const marcar = useMarcarTarefa();
  const pendentes = data?.filter((t) => !t.concluida).length ?? 0;

  return (
    <Bloco
      titulo="Tarefas de hoje"
      className="order-1 sm:order-none sm:flex-[1_1_300px]"
      ocupado={isPending}
      acao={
        data && data.length > 0 ? (
          <span className="num mr-2.5 border border-tatame px-2 py-1 text-[11px] font-semibold uppercase leading-none tracking-rotulo text-tatame sm:mr-0">
            {pendentes === 0 ? "Tudo feito" : `${pendentes} ${pendentes === 1 ? "pendente" : "pendentes"}`}
          </span>
        ) : undefined
      }
    >
      {isPending && <SkeletonLinhas linhas={4} altura="h-10" />}
      {isError && <Erro mensagem={error.message} aoTentar={() => refetch()} />}
      {data?.length === 0 && <Vazio>Agenda livre hoje. Hora de abrir conversa nova.</Vazio>}
      {data && data.length > 0 && (
        <ul>
          {data.map((t) => (
            <TarefaItem
              key={t.id}
              tarefa={t}
              aoMarcar={(concluida) => marcar.mutate({ id: t.id, concluida })}
            />
          ))}
        </ul>
      )}
      {marcar.isError && (
        <p role="alert" className="mt-3 text-xs text-alerta">
          Não deu para salvar a tarefa. Desfizemos a marcação — tente de novo.
        </p>
      )}
    </Bloco>
  );
}

function OrigemDosLeads({ periodo, tituloPeriodo }: { periodo: Periodo; tituloPeriodo: string }) {
  const [produto] = useProdutoSelecionado();
  const { data, isPending, isError, error, refetch } = useOrigemLeads(periodo, produto);
  const total = data?.reduce((t, o) => t + o.quantidade, 0) ?? 0;
  const maximo = Math.max(0, ...(data?.map((o) => o.quantidade) ?? []));

  return (
    <Bloco
      titulo="Origem dos leads"
      className="order-4 sm:order-none sm:flex-[1_1_300px]"
      ocupado={isPending}
      acao={
        data && total > 0 ? (
          <span className="rotulo num mr-2.5 sm:mr-0">
            {plural(total, "lead", "leads")} {tituloPeriodo}
          </span>
        ) : undefined
      }
    >
      {isPending && <SkeletonLinhas linhas={5} altura="h-5" />}
      {isError && <Erro mensagem={error.message} aoTentar={() => refetch()} />}
      {data && total === 0 && <Vazio>Nenhum lead novo {tituloPeriodo}. Bora prospectar.</Vazio>}
      {data && total > 0 && (
        <>
          <OrigemEmpilhada origens={data} total={total} />
          <ul className="hidden flex-col gap-3 sm:flex">
            {data.map((o) => (
              <OrigemBarra key={o.origem} origem={o} maximo={maximo} />
            ))}
          </ul>
        </>
      )}
    </Bloco>
  );
}

/** Cores da barra empilhada, da maior origem para a menor (só cores da marca). */
const CORES_ORIGEM = ["bg-limao", "bg-tatame", "bg-roxo", "bg-apoio", "bg-degrau-2"];

/** Celular: uma barra só, dividida por origem, com a legenda em duas colunas. */
function OrigemEmpilhada({ origens, total }: { origens: OrigemLeads[]; total: number }) {
  const ordenadas = [...origens].filter((o) => o.quantidade > 0).sort((a, b) => b.quantidade - a.quantidade);
  const descricao = ordenadas.map((o) => `${ROTULO_ORIGEM[o.origem]}: ${o.quantidade}`).join(", ");
  return (
    <div className="sm:hidden">
      <div role="img" aria-label={`${plural(total, "lead", "leads")}. ${descricao}`} className="flex h-3.5 gap-0.5">
        {ordenadas.map((o, i) => (
          <span key={o.origem} className={CORES_ORIGEM[i % CORES_ORIGEM.length]} style={{ flex: o.quantidade }} />
        ))}
      </div>
      <ul className="num mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        {ordenadas.map((o, i) => (
          <li key={o.origem} className="flex items-center gap-2">
            <span aria-hidden className={cn("size-2.5 shrink-0", CORES_ORIGEM[i % CORES_ORIGEM.length])} />
            <span className="truncate text-tatame">{ROTULO_ORIGEM[o.origem]}</span>
            <span className="ml-auto font-semibold text-tatame">{o.quantidade}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
