import { useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
  type Announcements,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
  type KeyboardCoordinateGetter,
} from "@dnd-kit/core";
import { Search } from "lucide-react";
import { CabecalhoPagina } from "@/components/app/CabecalhoPagina";
import { FiltroProduto } from "@/components/app/FiltroProduto";
import { IndicadoresCompactos, type CelulaIndicador } from "@/components/dashboard/IndicadoresCompactos";
import { Erro } from "@/components/dashboard/Estados";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { MetaDegraus } from "@/components/dashboard/MetaDegraus";
import { Icone } from "@/components/marca/Icone";
import { COLUNAS, COR_COLUNA, TITULO_COLUNA, ehColuna, type EtapaColuna } from "@/components/pipeline/etapas";
import { NovoLeadDialog } from "@/components/leads/NovoLeadDialog";
import { CardConteudo } from "@/components/pipeline/NegocioCard";
import { PipelineColuna, ZonaPerdido } from "@/components/pipeline/PipelineColuna";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardKpis } from "@/hooks/useDashboardKpis";
import { useProdutoSelecionado } from "@/hooks/useProdutos";
import { useMoverNegocio, usePipeline } from "@/hooks/usePipeline";
import { moeda, moedaCurta, normalizar, percentual, plural } from "@/lib/formato";
import type { DashboardKpis, Etapa, NegocioPipeline } from "@/lib/tipos";
import { cn } from "@/lib/utils";

const nomeEtapa = (id: unknown) => {
  const etapa = String(id);
  if (etapa === "perdido") return "Perdido";
  return ehColuna(etapa) ? TITULO_COLUNA[etapa] : "";
};

/**
 * Teclado: ← e → pulam direto para a coluna vizinha; ↓ vai para "Perdido"; ↑ volta para o quadro.
 * (O padrão do dnd-kit anda 25px por tecla, o que não serve para colunas.)
 */
const pularColunas: KeyboardCoordinateGetter = (evento, { context }) => {
  const { collisionRect, droppableRects } = context;
  if (!collisionRect) return undefined;
  const colunas = COLUNAS.map((id) => droppableRects.get(id)).filter((r): r is NonNullable<typeof r> => !!r);
  const centroX = collisionRect.left + collisionRect.width / 2;
  const atual = colunas.findIndex((r) => centroX >= r.left && centroX <= r.left + r.width);
  const centralizar = (r: { left: number; top: number; width: number }) => ({
    x: r.left + (r.width - collisionRect.width) / 2,
    y: r.top + 72,
  });

  switch (evento.code) {
    case "ArrowRight":
    case "ArrowLeft": {
      evento.preventDefault();
      const passo = evento.code === "ArrowRight" ? 1 : -1;
      const destino = colunas[Math.min(colunas.length - 1, Math.max(0, (atual === -1 ? 0 : atual) + passo))];
      return destino ? centralizar(destino) : undefined;
    }
    case "ArrowDown": {
      evento.preventDefault();
      const perdido = droppableRects.get("perdido");
      return perdido ? { x: perdido.left + (perdido.width - collisionRect.width) / 2, y: perdido.top } : undefined;
    }
    case "ArrowUp": {
      evento.preventDefault();
      const destino = colunas[atual === -1 ? 0 : atual];
      return destino ? centralizar(destino) : undefined;
    }
  }
  return undefined;
};

/**
 * Onde o card cai. A zona "Perdido" fica por cima das colunas, então ela tem prioridade:
 * com mouse/toque vale onde o ponteiro está; no teclado (sem ponteiro), vale a posição do card.
 */
const colisao: CollisionDetection = (args) => {
  const perdido = args.droppableContainers.filter((c) => c.id === "perdido");
  const colunas = args.droppableContainers.filter((c) => c.id !== "perdido");
  if (args.pointerCoordinates) {
    const noPerdido = pointerWithin({ ...args, droppableContainers: perdido });
    if (noPerdido.length) return noPerdido;
    const naColuna = pointerWithin({ ...args, droppableContainers: colunas });
    return naColuna.length ? naColuna : rectIntersection({ ...args, droppableContainers: colunas });
  }
  const noPerdido = rectIntersection({ ...args, droppableContainers: perdido });
  return noPerdido.length ? noPerdido : rectIntersection({ ...args, droppableContainers: colunas });
};

export default function Pipeline() {
  const { data: negocios, isPending, isError, error, refetch } = usePipeline();
  const mover = useMoverNegocio();
  const [busca, setBusca] = useState("");
  const [arrastando, setArrastando] = useState<NegocioPipeline | null>(null);
  const [editando, setEditando] = useState<number | null>(null);
  const [salvo, setSalvo] = useState<string | null>(null);
  // Depois de soltar um card, o navegador pode disparar um "click": não abre a edição nesse caso.
  const fimDoArraste = useRef(0);
  const abrirEdicao = (n: NegocioPipeline) => {
    if (Date.now() - fimDoArraste.current > 400) setEditando(n.leadId);
  };
  /** Celular: uma coluna por vez, escolhida nas abas. */
  const [aba, setAba] = useState<EtapaColuna>("novo");
  const quadroRef = useRef<HTMLDivElement>(null);
  function trocarAba(etapa: EtapaColuna) {
    setAba(etapa);
    // Se a lista já foi rolada, a nova aba começa do primeiro card (logo abaixo das abas fixas).
    const quadro = quadroRef.current;
    const tabs = quadro?.previousElementSibling;
    if (!quadro || !tabs) return;
    const fimDasAbas = tabs.getBoundingClientRect().bottom;
    const topo = quadro.getBoundingClientRect().top;
    if (topo < fimDasAbas) window.scrollTo({ top: window.scrollY + topo - fimDasAbas - 8 });
  }

  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: pularColunas }),
  );

  const [produto] = useProdutoSelecionado();
  const filtrados = useMemo(() => {
    const termo = normalizar(busca.trim());
    return (negocios ?? []).filter(
      (n) =>
        (produto == null || n.produtoId === produto) &&
        (!termo || normalizar(`${n.leadNome} ${n.organizacao ?? ""} ${n.produto}`).includes(termo)),
    );
  }, [negocios, busca, produto]);

  function moverPara(id: number, etapa: Etapa) {
    const atual = negocios?.find((n) => n.id === id);
    if (!atual || atual.etapa === etapa) return;
    mover.mutate({ id, etapa });
  }

  function aoComecar(e: DragStartEvent) {
    setArrastando((e.active.data.current?.negocio as NegocioPipeline) ?? null);
  }

  function aoSoltar(e: DragEndEvent) {
    setArrastando(null);
    fimDoArraste.current = Date.now();
    if (e.over) moverPara(Number(e.active.id), e.over.id as Etapa);
  }

  const negocioPorId = (id: unknown) => negocios?.find((n) => n.id === Number(id));
  const anuncios: Announcements = {
    onDragStart: ({ active }) => `Pegou ${negocioPorId(active.id)?.leadNome ?? "o card"}.`,
    onDragOver: ({ over }) => (over ? `Sobre a coluna ${nomeEtapa(over.id)}.` : "Fora das colunas."),
    onDragEnd: ({ active, over }) =>
      over
        ? `${negocioPorId(active.id)?.leadNome ?? "Card"} movido para ${nomeEtapa(over.id)}.`
        : "Card solto fora das colunas. Nada mudou.",
    onDragCancel: () => "Movimento cancelado.",
  };
  return (
    <div className="flex flex-col gap-3 sm:gap-6">
      {/* Cabeçalho */}
      <CabecalhoPagina sobretitulo={<span className="rotulo">Comercial</span>} titulo="Pipeline de vendas" tituloCurto="Pipeline" novoLead={{ para: "/leads?novo=1" }}>
        <label className="relative flex-1 sm:w-72 sm:flex-none">
          <span className="sr-only">Buscar lead</span>
          <Icone icone={Search} className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-apoio" />
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar lead ou organização"
            className="min-h-11 w-full border border-borda bg-superficie pl-9 pr-3 text-sm text-tatame placeholder:text-apoio focus:border-tatame focus:outline-none"
          />
        </label>
      </CabecalhoPagina>

      <FiltroProduto className="sm:-mt-2" />

      <Indicadores produto={produto} />

      {salvo && (
        <p role="status" className="border-l-2 border-limao bg-superficie px-4 py-3 text-sm text-tatame">
          <strong>{salvo}</strong> salvo.
        </p>
      )}

      {mover.isError && (
        <p role="alert" className="border-l-2 border-alerta bg-superficie px-4 py-3 text-sm text-alerta">
          Não deu para mover o card: {mover.error.message} Ele voltou para onde estava.
        </p>
      )}

      {/* Quadro */}
      {isError ? (
        <div className="border border-borda bg-superficie p-5">
          <Erro mensagem={error.message} aoTentar={() => refetch()} />
        </div>
      ) : isPending ? (
        <QuadroCarregando />
      ) : (
        <DndContext
          sensors={sensores}
          collisionDetection={colisao}
          onDragStart={aoComecar}
          onDragEnd={aoSoltar}
          onDragCancel={() => {
            setArrastando(null);
            fimDoArraste.current = Date.now();
          }}
          accessibility={{
            announcements: anuncios,
            screenReaderInstructions: {
              draggable:
                "Enter abre o lead para editar. Para mover um card, pressione espaço para pegar. Setas para os lados escolhem a coluna; seta para baixo marca como perdido. Espaço solta, Esc cancela.",
            },
          }}
        >
          <p className="-mb-3 text-xs text-apoio" aria-live="polite">
            {busca || produto
              ? `${plural(filtrados.length, "negócio encontrado", "negócios encontrados")}`
              : (
                <>
                  {plural(filtrados.length, "negócio", "negócios")} no quadro
                  <span className="hidden sm:inline"> · arraste os cards ou use o menu ⋯</span>
                  <span className="sm:hidden"> · use o menu ⋯ para mover</span>
                </>
              )}
          </p>

          {/* Celular: abas das etapas (fixas no topo ao rolar) */}
          <div
            role="tablist"
            aria-label="Etapas do pipeline"
            className="sticky top-[61px] z-10 -mx-4 -mb-2 flex overflow-x-auto border-b border-borda bg-podio px-1.5 sm:hidden"
          >
            {COLUNAS.map((etapa) => {
              const ativa = aba === etapa;
              return (
                <button
                  key={etapa}
                  type="button"
                  role="tab"
                  aria-selected={ativa}
                  aria-controls={`painel-${etapa}`}
                  onClick={() => trocarAba(etapa)}
                  className={cn(
                    "relative flex min-h-12 shrink-0 items-center gap-1 px-2.5 text-[11px] font-semibold uppercase tracking-rotulo focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-limao",
                    ativa ? "text-tatame" : "text-apoio",
                  )}
                >
                  {etapa === "fechado" ? "Fechado" : TITULO_COLUNA[etapa]}
                  <span className={cn("num font-normal tracking-normal", ativa ? "text-tatame" : "text-degrau-2")}>
                    {filtrados.filter((n) => n.etapa === etapa).length}
                  </span>
                  {ativa && <span aria-hidden className={cn("absolute inset-x-2.5 bottom-0 h-[3px]", COR_COLUNA[etapa].linha)} />}
                </button>
              );
            })}
          </div>

          <div ref={quadroRef} className="scroll-mt-28 sm:overflow-x-auto sm:pb-2">
            <div className="sm:grid sm:min-w-[1088px] sm:grid-cols-5 sm:gap-3">
              {COLUNAS.map((etapa) => (
                <PipelineColuna
                  key={etapa}
                  etapa={etapa}
                  negocios={filtrados.filter((n) => n.etapa === etapa)}
                  filtrando={!!busca.trim()}
                  ativa={aba === etapa}
                  aoMover={moverPara}
                  aoEditar={abrirEdicao}
                />
              ))}
            </div>
          </div>
          <ZonaPerdido visivel={!!arrastando} />
          <DragOverlay dropAnimation={null}>
            {arrastando ? <CardConteudo negocio={arrastando} flutuando className="w-[208px] sm:w-[240px]" /> : null}
          </DragOverlay>
        </DndContext>
      )}

      <NovoLeadDialog
        aberto={editando != null}
        leadId={editando}
        aoMudar={(aberto) => !aberto && setEditando(null)}
        aoCriar={(nome) => {
          setSalvo(nome);
          setTimeout(() => setSalvo(null), 5000);
        }}
      />
    </div>
  );
}

function Indicadores({ produto }: { produto: number | null }) {
  const { data, isPending, isError } = useDashboardKpis("mes", produto);
  if (isError) return null;
  return (
    <>
      <FaixaIndicadores dados={data} carregando={isPending} produto={produto} />
      <div className="hidden gap-4 sm:grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))" }}>
      <KpiCard
        carregando={isPending}
        rotulo="Em negociação"
        valor={data && moeda(data.pipelineAberto.valor)}
        detalhe={data && plural(data.pipelineAberto.negocios, "negócio aberto", "negócios abertos")}
      />
      <KpiCard
        carregando={isPending}
        destaque
        rotulo="Fechado no mês"
        valor={data && moeda(data.fechadoPeriodo.valor)}
        detalhe={data && plural(data.fechadoPeriodo.negocios, "negócio fechado", "negócios fechados")}
      />
      <KpiCard
        carregando={isPending}
        rotulo={produto ? "Meta do mês · todos os produtos" : "Meta do mês"}
        valor={data && (data.meta.percentual != null ? percentual(data.meta.percentual) : "Sem meta")}
        detalhe={data?.meta.valor ? `${moeda(data.meta.fechadoMes)} de ${moeda(data.meta.valor)}` : undefined}
      >
        {data && <MetaDegraus percentual={data.meta.percentual} meta={data.meta.valor} semCabecalho />}
      </KpiCard>
      </div>
    </>
  );
}

/** Celular: mesma caixa de indicadores do Dashboard, com os 2 números do Pipeline e a meta. */
function FaixaIndicadores({
  dados,
  carregando,
  produto,
}: {
  dados: DashboardKpis | undefined;
  carregando: boolean;
  produto: number | null;
}) {
  const celulas: CelulaIndicador[] | null = dados
    ? [
        {
          rotulo: "Em negociação",
          valor: moedaCurta(dados.pipelineAberto.valor),
          completo: moeda(dados.pipelineAberto.valor),
          detalhe: plural(dados.pipelineAberto.negocios, "negócio aberto", "negócios abertos"),
        },
        {
          rotulo: "Fechado no mês",
          valor: moedaCurta(dados.fechadoPeriodo.valor),
          completo: moeda(dados.fechadoPeriodo.valor),
          detalhe: plural(dados.fechadoPeriodo.negocios, "negócio", "negócios"),
          destaque: true,
        },
      ]
    : null;
  return (
    <IndicadoresCompactos celulas={celulas} meta={dados?.meta} geral={produto != null} carregando={carregando} quantidade={2} />
  );
}

function QuadroCarregando() {
  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0" aria-busy="true" aria-label="Carregando o pipeline">
      <div className="grid min-w-[1088px] grid-cols-5 gap-3">
        {COLUNAS.map((c, i) => (
          <div key={c} className="flex min-h-[420px] flex-col gap-2 border border-borda bg-superficie/60 p-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mb-2 h-3 w-32" />
            {Array.from({ length: 3 - (i % 3) }, (_, j) => (
              <Skeleton key={j} className="h-28" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
