import type { PropostaVencendo } from "@/lib/tipos";
import { moeda } from "@/lib/formato";
import { cn } from "@/lib/utils";

const LIMITE_ALERTA_DIAS = 7;

function textoVencimento(dias: number) {
  if (dias < 0) return `Venceu há ${Math.abs(dias)} ${Math.abs(dias) === 1 ? "dia" : "dias"}`;
  if (dias === 0) return "Vence hoje";
  return `Vence em ${dias} ${dias === 1 ? "dia" : "dias"}`;
}

export function PropostaItem({ proposta }: { proposta: PropostaVencendo }) {
  const urgente = proposta.diasRestantes <= LIMITE_ALERTA_DIAS;
  const nome = proposta.leadNome;
  return (
    <li className="flex items-center justify-between gap-3 border-b border-borda py-2.5 first:pt-0 last:border-b-0 last:pb-0 sm:items-start sm:py-3">
      <span aria-hidden className="w-[3px] self-stretch sm:hidden" style={{ background: proposta.produtoCor }} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-tatame sm:whitespace-normal">{proposta.organizacao ?? nome}</p>
        <p className="truncate text-xs text-apoio sm:whitespace-normal">
          {proposta.organizacao ? `${nome} · ` : ""}
          <span aria-hidden className="mr-1.5 hidden size-2 align-[1px] sm:inline-block" style={{ background: proposta.produtoCor }} />
          {proposta.produto}
          <span className="hidden sm:inline">
            {" · "}
            <span className="num">{moeda(proposta.valor)}</span>
          </span>
        </p>
      </div>
      {/* Celular: valor e prazo à direita, sem a etiqueta com borda */}
      <div className="shrink-0 text-right sm:hidden">
        <p className="num text-[13px] font-semibold text-tatame">{moeda(proposta.valor)}</p>
        <p className={cn("text-[11px] font-semibold", urgente ? "text-alerta" : "text-apoio")}>
          {textoVencimento(proposta.diasRestantes)}
        </p>
      </div>
      <span
        className={cn(
          "hidden shrink-0 border px-2 py-1 text-[11px] font-semibold uppercase leading-none tracking-rotulo sm:inline",
          urgente ? "border-alerta text-alerta" : "border-apoio text-apoio",
        )}
      >
        {textoVencimento(proposta.diasRestantes)}
      </span>
    </li>
  );
}
