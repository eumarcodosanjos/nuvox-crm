import { moeda, percentual } from "@/lib/formato";
import { cn } from "@/lib/utils";

const DEGRAUS = 5;

/** Barra de meta em 5 blocos: cada bloco é um degrau de 20% da meta do mês. */
export function MetaDegraus({
  percentual: fracao,
  meta,
  semCabecalho = false,
}: {
  percentual: number | null;
  meta: number | null;
  /** Esconde "Meta do mês · R$ … / %" quando o card já mostra esses números. */
  semCabecalho?: boolean;
}) {
  if (meta == null || fracao == null) {
    return <p className="mt-4 text-xs text-apoio">Sem meta cadastrada para este mês.</p>;
  }
  const preenchidos = Math.min(DEGRAUS, Math.floor(fracao * DEGRAUS));
  return (
    <div className="mt-4">
      <div className={cn("mb-2 flex items-baseline justify-between gap-2", semCabecalho && "sr-only")}>
        <span className="rotulo">Meta do mês · {moeda(meta)}</span>
        <span className="num text-xs font-semibold text-tatame">{percentual(fracao)}</span>
      </div>
      <div
        role="meter"
        aria-label="Meta do mês"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(fracao * 100)}
        aria-valuetext={`${percentual(fracao)} da meta`}
        className="grid grid-cols-5 gap-1"
      >
        {Array.from({ length: DEGRAUS }, (_, i) => (
          <span key={i} className={cn("h-2", i < preenchidos ? "bg-limao" : "bg-borda")} />
        ))}
      </div>
    </div>
  );
}
