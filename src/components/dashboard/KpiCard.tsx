import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Indicador: rótulo pequeno, número grande em Archivo e uma linha de apoio. */
export function KpiCard({
  rotulo,
  valor,
  detalhe,
  destaque = false,
  carregando = false,
  children,
}: {
  rotulo: string;
  valor: ReactNode;
  detalhe?: ReactNode;
  destaque?: boolean;
  carregando?: boolean;
  children?: ReactNode;
}) {
  return (
    <article
      className="flex min-w-0 flex-col border border-borda bg-superficie p-5"
      style={{ containerType: "inline-size" }}
      aria-busy={carregando || undefined}
    >
      <h3 className="rotulo">{rotulo}</h3>
      {carregando ? (
        <div aria-hidden className="mt-3 flex flex-col gap-2">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ) : (
        <>
          <p
            className={cn(
              "num mt-3 break-words font-titulo leading-tight",
              destaque ? "text-limao" : "text-tatame",
            )}
            // Fluido pela largura do card, para "R$ 115.552,00" caber de 230px a 1fr
            style={{ fontSize: "clamp(18px, 9.5cqi, 30px)" }}
          >
            {valor}
          </p>
          {detalhe && <p className="mt-2 text-sm text-apoio">{detalhe}</p>}
          {children}
        </>
      )}
    </article>
  );
}
