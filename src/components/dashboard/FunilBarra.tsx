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
    <li className="grid grid-cols-[84px_minmax(0,1fr)] items-center gap-x-3 gap-y-1 sm:grid-cols-[96px_minmax(0,1fr)_128px]">
      <span className="text-sm font-medium text-tatame">{nome}</span>
      <div className="h-9 bg-borda" title={descricao} aria-label={descricao} role="img">
        {etapa.quantidade > 0 && (
          <div
            className={cn("flex h-full min-w-11 items-center px-3 transition-[width] duration-500", cor.barra)}
            style={{ width: `${largura}%` }}
          >
            <span className={cn("num font-titulo text-sm", cor.texto)}>{etapa.quantidade}</span>
          </div>
        )}
        {etapa.quantidade === 0 && (
          <span className="num flex h-full items-center px-3 font-titulo text-sm text-apoio">0</span>
        )}
      </div>
      <span className="num col-start-2 text-right text-sm font-semibold text-tatame sm:col-start-auto">
        {moeda(etapa.valor)}
      </span>
    </li>
  );
}
