import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Card padrão do Dashboard: superfície, borda 1px, cantos retos, sem sombra.
 * Celular: título numa faixa com linha embaixo e conteúdo com respiro menor (mais informação por tela).
 * Do tablet para cima: o card arejado de sempre.
 */
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
      className={cn("flex min-w-0 flex-col border border-borda bg-superficie sm:p-5", className)}
    >
      <header className="flex min-h-11 flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-borda pl-3.5 pr-1 sm:mb-5 sm:border-0 sm:px-0">
        <h2 className="font-titulo text-[13px] text-tatame sm:text-[15px]">{titulo}</h2>
        {acao}
      </header>
      <div className="flex-1 p-3.5 sm:p-0">{children}</div>
      {rodape && <footer className="border-t border-borda sm:mt-5 sm:pt-4">{rodape}</footer>}
    </section>
  );
}
