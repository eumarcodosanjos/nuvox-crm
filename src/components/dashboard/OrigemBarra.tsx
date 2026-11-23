import type { OrigemLeads } from "@/lib/tipos";
import { plural, ROTULO_ORIGEM } from "@/lib/formato";

export function OrigemBarra({ origem, maximo }: { origem: OrigemLeads; maximo: number }) {
  const largura = maximo > 0 ? (origem.quantidade / maximo) * 100 : 0;
  const nome = ROTULO_ORIGEM[origem.origem];
  return (
    <li className="grid grid-cols-[84px_minmax(0,1fr)_32px] items-center gap-3">
      <span className="text-sm text-tatame">{nome}</span>
      <div
        className="h-3 bg-borda"
        role="img"
        aria-label={`${nome}: ${plural(origem.quantidade, "lead", "leads")}`}
        title={`${nome}: ${plural(origem.quantidade, "lead", "leads")}`}
      >
        <div className="h-full bg-tatame transition-[width] duration-500" style={{ width: `${largura}%` }} />
      </div>
      <span className="num text-right text-sm font-semibold text-tatame">{origem.quantidade}</span>
    </li>
  );
}
