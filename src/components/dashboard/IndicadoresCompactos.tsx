import { Skeleton } from "@/components/ui/skeleton";
import { moeda, moedaCurta, percentual } from "@/lib/formato";
import type { DashboardKpis } from "@/lib/tipos";
import { cn } from "@/lib/utils";

export interface CelulaIndicador {
  rotulo: string;
  /** Valor curto mostrado ("R$ 115,6 mil"). */
  valor: string;
  /** Valor completo, no title ("R$ 115.552,00"). */
  completo: string;
  detalhe: string;
  destaque?: boolean;
}

/**
 * Celular: indicadores numa caixa só, em duas colunas, com a meta do mês numa linha embaixo.
 * Usado no Dashboard (4 números) e no Pipeline (2 números). Some do tablet para cima.
 */
export function IndicadoresCompactos({
  celulas,
  meta,
  geral,
  carregando,
  quantidade,
}: {
  celulas: CelulaIndicador[] | null;
  meta: DashboardKpis["meta"] | undefined;
  /** Com filtro de produto: a meta é da empresa toda. */
  geral: boolean;
  carregando: boolean;
  /** Quantas células mostrar enquanto carrega. */
  quantidade: number;
}) {
  const preenchidos = meta?.percentual != null ? Math.min(5, Math.floor(meta.percentual * 5)) : 0;
  const lista = carregando || !celulas ? Array.from({ length: quantidade }, () => null) : celulas;

  return (
    <section aria-label="Indicadores" aria-busy={carregando || undefined} className="border border-borda bg-superficie sm:hidden">
      <dl className="grid grid-cols-2">
        {lista.map((c, i) => (
          <div
            key={c?.rotulo ?? i}
            className={cn(
              "min-w-0 px-3.5 py-3",
              i % 2 === 0 && "border-r border-borda",
              i < lista.length - 2 && "border-b border-borda",
            )}
          >
            {c ? (
              <>
                <dt className="rotulo truncate !text-[10px]">{c.rotulo}</dt>
                <dd
                  className={cn(
                    "num mt-2 truncate font-titulo text-[18px] max-[359px]:text-[15px]",
                    c.destaque ? "text-limao" : "text-tatame",
                  )}
                  title={c.completo}
                >
                  {c.valor}
                </dd>
                <dd className="num mt-1.5 truncate text-xs text-apoio">{c.detalhe}</dd>
              </>
            ) : (
              <div aria-hidden className="flex flex-col gap-2">
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-5 w-4/5" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            )}
          </div>
        ))}
      </dl>
      <div className="flex min-h-11 items-center gap-2.5 border-t border-borda px-3.5 py-2.5">
        <span className="rotulo shrink-0 !text-[10px]">{geral ? "Meta · geral" : "Meta do mês"}</span>
        {meta?.valor && meta.percentual != null ? (
          <>
            <span
              role="meter"
              aria-label="Meta do mês"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(meta.percentual * 100)}
              aria-valuetext={`${percentual(meta.percentual)} da meta`}
              className="grid w-16 shrink-0 grid-cols-5 gap-0.5"
            >
              {Array.from({ length: 5 }, (_, i) => (
                <span key={i} className={cn("h-1.5", i < preenchidos ? "bg-limao" : "bg-borda")} />
              ))}
            </span>
            <span className="num ml-auto truncate text-[13px]" title={`${moeda(meta.fechadoMes)} de ${moeda(meta.valor)}`}>
              <span className="font-semibold text-tatame">{percentual(meta.percentual)}</span>
              <span className="text-apoio"> de {moedaCurta(meta.valor)}</span>
            </span>
          </>
        ) : (
          <span className="ml-auto text-xs text-apoio">{carregando ? "" : "Sem meta cadastrada"}</span>
        )}
      </div>
    </section>
  );
}
