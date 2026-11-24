import type { FunilResposta } from "@/lib/tipos";
import { moeda, plural } from "@/lib/formato";

type Produto = FunilResposta["produtos"][number];

export function ProdutoLinha({ produto, maximo }: { produto: Produto; maximo: number }) {
  const largura = maximo > 0 ? (produto.valorAberto / maximo) * 100 : 0;
  return (
    <li className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <span className="flex min-w-0 items-center gap-2.5">
          <span aria-hidden className="size-3 shrink-0" style={{ background: produto.cor }} />
          <span className="truncate text-sm font-semibold text-tatame">{produto.nome}</span>
        </span>
        <span className="num shrink-0 text-sm font-semibold text-tatame">{moeda(produto.valorAberto)}</span>
      </div>
      <div
        className="h-2 bg-borda"
        role="img"
        aria-label={`${produto.nome}: ${moeda(produto.valorAberto)} em aberto`}
        title={`${plural(produto.negocios, "negócio aberto", "negócios abertos")}`}
      >
        <div className="h-full transition-[width] duration-500" style={{ width: `${largura}%`, background: produto.cor }} />
      </div>
      <p className="text-xs text-apoio">
        {produto.modeloCobranca} · {plural(produto.negocios, "negócio", "negócios")}
      </p>
    </li>
  );
}
