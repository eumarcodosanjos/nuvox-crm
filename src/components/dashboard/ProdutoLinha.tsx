import type { FunilResposta } from "@/lib/tipos";
import { moeda, moedaCurta, plural } from "@/lib/formato";
import { cn } from "@/lib/utils";

type Produto = FunilResposta["produtos"][number];

/**
 * Uma linha por produto. A barra mede o valor em aberto; se nenhum negócio tem valor
 * ainda, mede a quantidade de negócios (`porQuantidade`), para a barra não ficar vazia.
 * Celular: cor, nome e "156 · R$ 82,4 mil" numa linha, com barra fina embaixo.
 */
export function ProdutoLinha({
  produto,
  maximo,
  porQuantidade = false,
}: {
  produto: Produto;
  maximo: number;
  porQuantidade?: boolean;
}) {
  const medida = porQuantidade ? produto.negocios : produto.valorAberto;
  const largura = maximo > 0 ? (medida / maximo) * 100 : 0;
  const negocios = plural(produto.negocios, "negócio aberto", "negócios abertos");
  return (
    <li className={cn("flex flex-col gap-2", produto.negocios === 0 && "max-sm:hidden")}>
      <div className="flex items-center justify-between gap-3">
        <span className="flex min-w-0 items-center gap-2.5">
          <span aria-hidden className="size-2.5 shrink-0 sm:size-3" style={{ background: produto.cor }} />
          <span className="truncate text-[13px] text-tatame sm:text-sm sm:font-semibold">{produto.nome}</span>
        </span>
        <span className="num shrink-0 text-[13px] sm:hidden" title={`${negocios} · ${moeda(produto.valorAberto)}`}>
          <span className="font-semibold text-tatame">{produto.negocios}</span>
          <span className="text-apoio"> · {moedaCurta(produto.valorAberto)}</span>
        </span>
        <span className="num hidden shrink-0 text-sm font-semibold text-tatame sm:inline">{moeda(produto.valorAberto)}</span>
      </div>
      <div
        className="h-[3px] bg-borda sm:h-2"
        role="img"
        aria-label={`${produto.nome}: ${negocios}, ${moeda(produto.valorAberto)} em aberto`}
        title={negocios}
      >
        <div className="h-full transition-[width] duration-500" style={{ width: `${largura}%`, background: produto.cor }} />
      </div>
      <p className="hidden text-xs text-apoio sm:block">
        {produto.modeloCobranca} · {plural(produto.negocios, "negócio", "negócios")}
      </p>
    </li>
  );
}
