import { ROTULO_ETAPA } from "@/lib/formato";
import type { Etapa } from "@/lib/tipos";
import { cn } from "@/lib/utils";

/** Etiqueta de etapa, como no manual (tela "Elementos e interface"). */
const ESTILO: Record<Etapa, string> = {
  novo: "bg-degrau-1 text-tatame border-degrau-1",
  contato: "border-tatame text-tatame",
  proposta: "bg-roxo text-tatame border-roxo",
  negociacao: "bg-tatame text-podio border-tatame",
  fechado: "bg-limao text-podio border-limao",
  perdido: "border-alerta text-alerta",
};

export function EtapaTag({ etapa, className }: { etapa: Etapa; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center border px-2 py-1 text-[11px] font-semibold uppercase leading-none tracking-rotulo",
        ESTILO[etapa],
        className,
      )}
    >
      {ROTULO_ETAPA[etapa]}
    </span>
  );
}
