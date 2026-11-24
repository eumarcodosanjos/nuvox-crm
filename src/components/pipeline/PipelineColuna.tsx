import { useEffect, useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { moeda, plural } from "@/lib/formato";
import type { Etapa, NegocioPipeline } from "@/lib/tipos";
import { cn } from "@/lib/utils";
import { COR_COLUNA, TITULO_COLUNA, type EtapaColuna } from "./etapas";
import { NegocioCard } from "./NegocioCard";

/** Quantos cards cada coluna mostra de cada vez (colunas com centenas de leads ficam leves). */
const POR_PAGINA = 30;

export function PipelineColuna({
  etapa,
  negocios,
  filtrando,
  ativa,
  aoMover,
  aoEditar,
}: {
  etapa: EtapaColuna;
  negocios: NegocioPipeline[];
  filtrando: boolean;
  /** No celular só a coluna da aba escolhida aparece; do tablet para cima, todas. */
  ativa: boolean;
  aoMover: (id: number, etapa: Etapa) => void;
  aoEditar: (negocio: NegocioPipeline) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: etapa });
  const [limite, setLimite] = useState(POR_PAGINA);
  useEffect(() => setLimite(POR_PAGINA), [filtrando]);
  const visiveis = negocios.slice(0, limite);
  const restantes = negocios.length - visiveis.length;
  const total = negocios.reduce((t, n) => t + n.valor, 0);
  const idTitulo = `coluna-${etapa}`;

  return (
    <section
      ref={setNodeRef}
      id={`painel-${etapa}`}
      aria-labelledby={idTitulo}
      className={cn(
        "min-w-0 flex-col transition-colors sm:min-h-[420px] sm:border sm:p-3",
        ativa ? "flex" : "hidden sm:flex",
        isOver ? "sm:border-tatame sm:bg-superficie" : "sm:border-borda sm:bg-superficie/60",
      )}
    >
      {/* No celular a aba já diz a etapa e a contagem; aqui fica só o total em R$ */}
      <p className="num mb-3 text-xs text-apoio sm:hidden">Total na etapa · {moeda(total)}</p>
      <header className="mb-3 hidden px-1 sm:block">
        <h2 id={idTitulo} className="text-xs font-semibold uppercase tracking-rotulo text-tatame">
          {TITULO_COLUNA[etapa]}
        </h2>
        <p className="num mt-1 text-xs text-apoio">
          {plural(negocios.length, "negócio", "negócios")} · {moeda(total)}
        </p>
        <span aria-hidden className={cn("mt-3 block h-[3px]", COR_COLUNA[etapa].linha)} />
      </header>

      {negocios.length === 0 ? (
        <p className="flex min-h-20 items-center justify-center border border-dashed border-borda px-3 text-center text-xs text-apoio">
          {filtrando ? "Nada encontrado aqui." : etapa === "fechado" ? "Nenhum fechamento no mês. Ainda." : "Solte um card aqui."}
        </p>
      ) : (
        <>
          <ul className="flex flex-col gap-2">
            {visiveis.map((n) => (
              <NegocioCard key={n.id} negocio={n} aoMover={(nova) => aoMover(n.id, nova)} aoEditar={() => aoEditar(n)} />
            ))}
          </ul>
          {restantes > 0 && (
            <button
              type="button"
              onClick={() => setLimite((l) => l + POR_PAGINA)}
              className="mt-2 min-h-11 border border-borda text-xs font-semibold uppercase tracking-rotulo text-apoio hover:border-degrau-2 hover:text-tatame focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-limao"
            >
              Mostrar mais {Math.min(POR_PAGINA, restantes)} <span className="num font-normal normal-case tracking-normal">· faltam {restantes}</span>
            </button>
          )}
        </>
      )}
    </section>
  );
}

/** Área de "Perdido" que aparece enquanto um card está sendo arrastado. */
export function ZonaPerdido({ visivel }: { visivel: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: "perdido" });
  return (
    <div
      ref={setNodeRef}
      aria-hidden={!visivel}
      className={cn(
        "fixed inset-x-4 bottom-4 z-30 flex min-h-16 items-center justify-center border-2 border-dashed text-[11px] font-semibold uppercase tracking-rotulo transition-all lg:left-[236px]",
        visivel ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0",
        isOver ? "border-alerta bg-alerta text-podio" : "border-alerta bg-podio text-alerta",
      )}
    >
      Solte aqui para marcar como perdido
    </div>
  );
}
