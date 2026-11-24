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
  percentual,
  PERIODOS,
  plural,
  primeiroNome,
  saudacao,
} from "@/lib/formato";
import type { Periodo } from "@/lib/tipos";
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
    <div className="flex flex-col gap-6">
      {/* 1. Cabeçalho */}
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div>
          <p className="text-sm text-apoio">
            {saudacao()}, {primeiroNome(USUARIO.nome)}
          </p>
          <h1 className="mt-1 font-titulo text-[34px] text-tatame sm:text-[44px]">Dashboard</h1>
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
          <Button asChild className="w-full sm:w-auto">
            <Link to="/leads?novo=1">
              <Icone icone={Plus} className="size-4" strokeWidth={3} />
              Novo lead
            </Link>
          </Button>
        </div>
      </header>

      {/* Filtro por produto */}
      <FiltroProduto className="-mt-2" />

      {/* 2. Indicadores */}
      <Indicadores periodo={periodo} tituloPeriodo={tituloPeriodo} />

      {/* 3. Funil + Pipeline por produto */}
      <FunilEProdutos periodo={periodo} />

      {/* 4. Propostas, tarefas e origem */}
      <div className="flex flex-wrap gap-4">
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
    <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))" }}>
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
  );
}

function FunilEProdutos({ periodo }: { periodo: Periodo }) {
  const [produto] = useProdutoSelecionado();
  const { data, isPending, isError, error, refetch } = useFunil(periodo, produto);
  const maxEtapa = Math.max(0, ...(data?.etapas.map((e) => e.quantidade) ?? []));
  const maxProduto = Math.max(0, ...(data?.produtos.map((p) => p.valorAberto) ?? []));
  const semNegocios = data && data.etapas.every((e) => e.quantidade === 0);

  return (
    <div className="flex flex-wrap gap-4">
      <Bloco
        titulo="Funil de vendas"
        className="flex-[2_1_480px]"
        ocupado={isPending}
        acao={
          <Link
            to="/pipeline"
            className="-mr-2 flex min-h-11 items-center gap-1.5 px-2 text-[11px] font-semibold uppercase tracking-rotulo text-tatame hover:text-limao"
          >
            Abrir pipeline
            <Icone icone={ArrowRight} className="size-4" />
          </Link>
        }
        rodape={
          data && !semNegocios ? (
            <dl className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))" }}>
              <Metrica rotulo="Conversão" valor={data.conversao != null ? percentual(data.conversao) : "—"} />
              <Metrica
                rotulo="Ciclo médio"
                valor={data.cicloMedioDias != null ? plural(data.cicloMedioDias, "dia", "dias") : "—"}
              />
              <Metrica rotulo="Ticket médio" valor={data.ticketMedio != null ? moeda(data.ticketMedio) : "—"} />
            </dl>
          ) : undefined
        }
      >
        {isPending && <SkeletonLinhas linhas={5} />}
        {isError && <Erro mensagem={error.message} aoTentar={() => refetch()} />}
        {semNegocios && <Vazio>Funil vazio. Cadastre o primeiro lead e comece a subida.</Vazio>}
        {data && !semNegocios && (
          <ol className="flex flex-col gap-3" aria-label="Negócios por etapa">
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
          <ul className="flex flex-col gap-6">
            {data.produtos.map((p) => (
              <ProdutoLinha key={p.id} produto={p} maximo={maxProduto} />
            ))}
          </ul>
        )}
      </Bloco>
    </div>
  );
}

function Metrica({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="min-w-0">
      <dt className="rotulo">{rotulo}</dt>
      <dd className="num mt-1 font-titulo text-base text-tatame">{valor}</dd>
    </div>
  );
}

function PropostasVencendo() {
  const [produto] = useProdutoSelecionado();
  const { data, isPending, isError, error, refetch } = usePropostasVencendo(produto);
  return (
    <Bloco titulo="Propostas vencendo" className="flex-[1_1_300px]" ocupado={isPending}>
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
      className="flex-[1_1_300px]"
      ocupado={isPending}
      acao={
        data && data.length > 0 ? (
          <span className="num border border-tatame px-2 py-1 text-[11px] font-semibold uppercase leading-none tracking-rotulo text-tatame">
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
      className="flex-[1_1_300px]"
      ocupado={isPending}
      acao={data && total > 0 ? <span className="rotulo num">{plural(total, "lead", "leads")} {tituloPeriodo}</span> : undefined}
    >
      {isPending && <SkeletonLinhas linhas={5} altura="h-5" />}
      {isError && <Erro mensagem={error.message} aoTentar={() => refetch()} />}
      {data && total === 0 && <Vazio>Nenhum lead novo {tituloPeriodo}. Bora prospectar.</Vazio>}
      {data && total > 0 && (
        <ul className="flex flex-col gap-3">
          {data.map((o) => (
            <OrigemBarra key={o.origem} origem={o} maximo={maximo} />
          ))}
        </ul>
      )}
    </Bloco>
  );
}
