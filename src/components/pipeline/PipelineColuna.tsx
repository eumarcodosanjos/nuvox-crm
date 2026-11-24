import { useDroppable } from "@dnd-kit/core";
import { moeda, plural } from "@/lib/formato";
import type { Etapa, NegocioPipeline } from "@/lib/tipos";
import { cn } from "@/lib/utils";
import { COR_COLUNA, TITULO_COLUNA, type EtapaColuna } from "./etapas";
import { NegocioCard } from "./NegocioCard";

export function PipelineColuna({
  etapa,
  negocios,
  filtrando,
  aoMover,
}: {
  etapa: EtapaColuna;
  negocios: NegocioPipeline[];
  filtrando: boolean;
  aoMover: (id: number, etapa: Etapa) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: etapa });
  const total = negocios.reduce((t, n) => t + n.valor, 0);
  const idTitulo = `coluna-${etapa}`;

  return (
    <section
      ref={setNodeRef}
      aria-labelledby={idTitulo}
      className={cn(
        "flex min-h-[420px] min-w-0 flex-col border bg-superficie/60 p-3 transition-colors",
        isOver ? "border-tatame bg-superficie" : "border-borda",
      )}
    >
      <header className="mb-3 px-1">
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
        <ul className="flex flex-col gap-2">
          {negocios.map((n) => (
            <NegocioCard key={n.id} negocio={n} aoMover={(nova) => aoMover(n.id, nova)} />
          ))}
        </ul>
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
