import { useProdutoSelecionado, useProdutos } from "@/hooks/useProdutos";
import { cn } from "@/lib/utils";

/** Nome curto no filtro: "Nuvox Federações" → "Federações". */
const curto = (nome: string) => nome.replace(/^Nuvox\s+/i, "");

/** Botões "Todos · Federações · Combat · Academia", cada produto com seu quadradinho de cor. */
export function FiltroProduto({ className }: { className?: string }) {
  const { data: produtos } = useProdutos();
  const [selecionado, selecionar] = useProdutoSelecionado();

  if (!produtos?.length) return null;

  const opcoes = [{ id: null, nome: "Todos", cor: null as string | null }, ...produtos];

  return (
    <div className={cn("-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0", className)}>
      <div role="group" aria-label="Filtrar por produto" className="flex w-max gap-2">
        {opcoes.map((p) => {
          const ativo = p.id === selecionado;
          return (
            <button
              key={p.id ?? "todos"}
              type="button"
              aria-pressed={ativo}
              onClick={() => selecionar(p.id)}
              className={cn(
                "flex min-h-11 items-center gap-2 border px-4 text-[11px] font-semibold uppercase tracking-rotulo transition-colors",
                ativo ? "border-tatame bg-tatame text-podio" : "border-borda text-apoio hover:text-tatame",
              )}
            >
              {p.cor && <span aria-hidden className="size-2.5 shrink-0" style={{ background: p.cor }} />}
              {curto(p.nome)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
