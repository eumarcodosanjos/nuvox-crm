import { forwardRef, type HTMLAttributes } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CalendarDays } from "lucide-react";
import { Icone } from "@/components/marca/Icone";
import { moeda, quando } from "@/lib/formato";
import type { Etapa, NegocioPipeline } from "@/lib/tipos";
import { cn } from "@/lib/utils";
import { COR_COLUNA, ehColuna } from "./etapas";
import { MoverParaMenu } from "./MoverParaMenu";

/**
 * Conteúdo visual do card (usado no quadro e na "sombra" que acompanha o arraste).
 * Compacto: produto, nome, organização numa linha, valor só quando existe e
 * a próxima tarefa numa linha só — a última linha tem 44px para o link "Reuniões".
 */
export const CardConteudo = forwardRef<
  HTMLDivElement,
  { negocio: NegocioPipeline; flutuando?: boolean } & HTMLAttributes<HTMLDivElement>
>(({ negocio, flutuando, className, ...props }, ref) => {
  const cor = ehColuna(negocio.etapa) ? COR_COLUNA[negocio.etapa] : COR_COLUNA.novo;
  const tarefa = negocio.proximaTarefa;
  const prazo = tarefa ? quando(tarefa.dataHora) : null;
  const atrasada = prazo?.startsWith("Atrasada") ?? false;

  return (
    <div
      ref={ref}
      className={cn(
        "relative border border-borda bg-superficie pl-4 pr-3 pt-3 text-left",
        flutuando && "cursor-grabbing border-tatame",
        className,
      )}
      {...props}
    >
      {/* Faixa com a cor do produto */}
      <span aria-hidden className="absolute -left-px -top-px bottom-[-1px] w-1" style={{ background: negocio.produtoCor }} />
      <p className="rotulo truncate pr-9 !text-[10px]">{negocio.produto}</p>
      <p className="mt-1 line-clamp-2 pr-8 text-[15px] font-semibold leading-snug text-tatame">{negocio.leadNome}</p>
      {negocio.organizacao && (
        <p className="mt-0.5 truncate text-[13px] text-apoio" title={negocio.organizacao}>
          {negocio.organizacao}
        </p>
      )}
      {negocio.valor > 0 && <p className="num mt-1 text-sm font-semibold text-tatame">{moeda(negocio.valor)}</p>}
      <p className={cn("flex min-h-11 items-center gap-1.5 pr-20 text-xs", tarefa ? "text-tatame" : "text-apoio")}>
        <Icone icone={CalendarDays} className={cn("size-3.5 shrink-0", atrasada ? "text-alerta" : cor.icone)} />
        {tarefa ? (
          <span className="truncate">
            {tarefa.titulo} <span className={cn("num", atrasada ? "text-alerta" : "text-apoio")}>· {prazo}</span>
          </span>
        ) : (
          <span className="truncate">Sem tarefa</span>
        )}
      </p>
    </div>
  );
});
CardConteudo.displayName = "CardConteudo";

/** Card arrastável + menu "Mover para…" (fora da área arrastável, para não aninhar botões). */
export function NegocioCard({
  negocio,
  aoMover,
  aoEditar,
}: {
  negocio: NegocioPipeline;
  aoMover: (etapa: Etapa) => void;
  /** Toque/clique no card (sem arrastar) abre o lead para edição. */
  aoEditar: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: negocio.id,
    data: { negocio },
  });

  return (
    <li className="relative">
      <CardConteudo
        ref={setNodeRef}
        negocio={negocio}
        {...attributes}
        {...listeners}
        onClick={aoEditar}
        onKeyDown={(e) => {
          if (e.key === "Enter") aoEditar();
          listeners?.onKeyDown?.(e);
        }}
        aria-roledescription="card arrastável"
        aria-label={`${negocio.leadNome}, ${negocio.organizacao ?? negocio.produto}, ${moeda(negocio.valor)}. Enter para editar, espaço para pegar e mover.`}
        className={cn(
          "cursor-grab touch-manipulation transition-colors hover:border-degrau-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-limao",
          isDragging && "opacity-30",
        )}
      />
      <a
        href={`https://kime-prototipo-navegacao.eumarcoodosanjos.chatgpt.site/api/nuvox-crm/negocios/${negocio.id}/abrir`}
        aria-label={`Reuniões de ${negocio.leadNome}`}
        className="absolute bottom-px right-px inline-flex min-h-11 items-center px-3 text-[11px] font-semibold uppercase tracking-rotulo text-apoio hover:text-tatame focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-limao"
      >
        Reuniões
      </a>
      <div className="absolute right-0 top-0">
        <MoverParaMenu etapaAtual={negocio.etapa} nome={negocio.leadNome} aoMover={aoMover} aoEditar={aoEditar} />
      </div>
    </li>
  );
}
