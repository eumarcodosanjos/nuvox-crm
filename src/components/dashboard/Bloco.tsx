import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Card padrão do Dashboard: superfície, borda 1px, cantos retos, sem sombra. */
export function Bloco({
  titulo,
  acao,
  rodape,
  children,
  className,
  ocupado,
}: {
  titulo: string;
  acao?: ReactNode;
  rodape?: ReactNode;
  children: ReactNode;
  className?: string;
  ocupado?: boolean;
}) {
  return (
    <section
      aria-busy={ocupado || undefined}
      className={cn("flex min-w-0 flex-col border border-borda bg-superficie p-5", className)}
    >
      <header className="mb-5 flex min-h-11 flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <h2 className="font-titulo text-[15px] text-tatame">{titulo}</h2>
        {acao}
      </header>
      <div className="flex-1">{children}</div>
      {rodape && <footer className="mt-5 border-t border-borda pt-4">{rodape}</footer>}
    </section>
  );
}
