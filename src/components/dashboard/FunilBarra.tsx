import type { FunilEtapa } from "@/lib/tipos";
import { moeda, plural, ROTULO_ETAPA } from "@/lib/formato";
import { cn } from "@/lib/utils";

/** Cores fixas por etapa (manual de marca). Texto escuro nas barras claras. */
export const COR_ETAPA: Record<FunilEtapa["etapa"], { barra: string; texto: string }> = {
  novo: { barra: "bg-degrau-1", texto: "text-tatame" },
  contato: { barra: "bg-degrau-2", texto: "text-tatame" },
  proposta: { barra: "bg-roxo", texto: "text-tatame" },
  negociacao: { barra: "bg-tatame", texto: "text-podio" },
  fechado: { barra: "bg-limao", texto: "text-podio" },
};

/** Uma barra do funil: largura proporcional à quantidade, quantidade dentro, valor à direita. */
export function FunilBarra({ etapa, maximo }: { etapa: FunilEtapa; maximo: number }) {
  const largura = maximo > 0 ? (etapa.quantidade / maximo) * 100 : 0;
  const cor = COR_ETAPA[etapa.etapa];
  const nome = ROTULO_ETAPA[etapa.etapa];
  const descricao = `${nome}: ${plural(etapa.quantidade, "negócio", "negócios")}, ${moeda(etapa.valor)}`;

  return (
    <li className="grid grid-cols-[84px_minmax(0,1fr)_40px] items-center gap-x-3 sm:grid-cols-[96px_minmax(0,1fr)_128px]">
      <span className="text-[13px] text-tatame sm:text-sm sm:font-medium">{nome}</span>
      <div className="h-3.5 bg-borda sm:h-9" title={descricao} aria-label={descricao} role="img">
        {etapa.quantidade > 0 && (
          <div
            className={cn("flex h-full min-w-1 items-center transition-[width] duration-500 sm:min-w-11 sm:px-3", cor.barra, etapa.etapa === "novo" && "max-sm:bg-degrau-2")}
            style={{ width: `${largura}%` }}
          >
            <span className={cn("num hidden font-titulo text-sm sm:inline", cor.texto)}>{etapa.quantidade}</span>
          </div>
        )}
        {etapa.quantidade === 0 && (
          <span className="num hidden h-full items-center px-3 font-titulo text-sm text-apoio sm:flex">0</span>
        )}
      </div>
      {/* Celular: a quantidade fica à direita da barra fina; do tablet para cima, o valor */}
      <span
        aria-hidden
        className={cn(
          "num text-right text-[13px] font-semibold sm:hidden",
          etapa.etapa === "fechado" && etapa.quantidade > 0 ? "text-limao" : "text-tatame",
        )}
      >
        {etapa.quantidade}
      </span>
      <span className="num hidden text-right text-sm font-semibold text-tatame sm:block">{moeda(etapa.valor)}</span>
    </li>
  );
}
