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
    <li className="flex items-start justify-between gap-3 border-b border-borda py-3 first:pt-0 last:border-b-0 last:pb-0">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-tatame">{proposta.organizacao ?? nome}</p>
        <p className="text-xs text-apoio">
          {proposta.organizacao ? `${nome} · ` : ""}
          <span aria-hidden className="mr-1.5 inline-block size-2 align-[1px]" style={{ background: proposta.produtoCor }} />
          {proposta.produto} · <span className="num">{moeda(proposta.valor)}</span>
        </p>
      </div>
      <span
        className={cn(
          "shrink-0 border px-2 py-1 text-[11px] font-semibold uppercase leading-none tracking-rotulo",
          urgente ? "border-alerta text-alerta" : "border-apoio text-apoio",
        )}
      >
        {textoVencimento(proposta.diasRestantes)}
      </span>
    </li>
  );
}
