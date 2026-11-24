import { forwardRef, type HTMLAttributes } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CalendarDays } from "lucide-react";
import { Icone } from "@/components/marca/Icone";
import { moeda, quando } from "@/lib/formato";
import type { Etapa, NegocioPipeline } from "@/lib/tipos";
import { cn } from "@/lib/utils";
import { COR_COLUNA, ehColuna } from "./etapas";
import { MoverParaMenu } from "./MoverParaMenu";

/** Conteúdo visual do card (usado no quadro e na "sombra" que acompanha o arraste). */
export const CardConteudo = forwardRef<
  HTMLDivElement,
  { negocio: NegocioPipeline; flutuando?: boolean } & HTMLAttributes<HTMLDivElement>
>(({ negocio, flutuando, className, ...props }, ref) => {
  const cor = ehColuna(negocio.etapa) ? COR_COLUNA[negocio.etapa] : COR_COLUNA.novo;
  const tarefa = negocio.proximaTarefa;
  const atrasada = tarefa ? quando(tarefa.dataHora).startsWith("Atrasada") : false;

  return (
    <div
      ref={ref}
      className={cn(
        "relative border border-borda bg-superficie py-3.5 pl-5 pr-12 text-left",
        flutuando && "cursor-grabbing border-tatame",
        className,
      )}
      {...props}
    >
      {/* Faixa com a cor do produto */}
      <span aria-hidden className="absolute -left-px -top-px bottom-[-1px] w-1.5" style={{ background: negocio.produtoCor }} />
      <p className="rotulo mb-1.5 !text-[10px]">{negocio.produto}</p>
      <p className="text-[15px] font-semibold leading-snug text-tatame">{negocio.leadNome}</p>
      <p className="mt-1 text-sm text-apoio">
        {negocio.organizacao ? `${negocio.organizacao} · ` : ""}
        <span className="num whitespace-nowrap text-tatame">{moeda(negocio.valor)}</span>
      </p>
      <p className={cn("mt-2.5 flex items-start gap-2 text-sm", tarefa ? "text-tatame" : "text-apoio")}>
        <Icone icone={CalendarDays} className={cn("mt-0.5 size-4 shrink-0", atrasada ? "text-alerta" : cor.icone)} />
        {tarefa ? (
          <span>
            {tarefa.titulo}
            <span className={cn("num block text-xs", atrasada ? "text-alerta" : "text-apoio")}>
              {quando(tarefa.dataHora)}
            </span>
          </span>
        ) : (
          <span>Sem próxima tarefa</span>
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
}: {
  negocio: NegocioPipeline;
  aoMover: (etapa: Etapa) => void;
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
        aria-roledescription="card arrastável"
        aria-label={`${negocio.leadNome}, ${negocio.organizacao ?? negocio.produto}, ${moeda(negocio.valor)}. Espaço para pegar e mover.`}
        className={cn(
          "cursor-grab touch-manipulation transition-colors hover:border-degrau-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-limao",
          isDragging && "opacity-30",
        )}
      />
      <a
        href={`https://kime-prototipo-navegacao.eumarcoodosanjos.chatgpt.site/api/nuvox-crm/negocios/${negocio.id}/abrir`}
        className="mt-1 inline-flex min-h-11 items-center px-4 text-xs font-semibold text-apoio hover:text-tatame"
      >
        Reuniões
      </a>
      <div className="absolute right-0.5 top-0.5">
        <MoverParaMenu etapaAtual={negocio.etapa} nome={negocio.leadNome} aoMover={aoMover} />
      </div>
    </li>
  );
}
