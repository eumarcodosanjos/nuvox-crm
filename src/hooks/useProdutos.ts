import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { api } from "@/lib/api";
import type { ProdutoResumo } from "@/lib/tipos";

/** Produtos com cor de identidade (mudam raramente: cache de 10 min). */
export function useProdutos() {
  return useQuery({
    queryKey: ["produtos"],
    queryFn: () => api<ProdutoResumo[]>("produtos"),
    staleTime: 10 * 60_000,
  });
}

/** Produto escolhido no filtro, guardado no endereço (?produto=ID). null = todos. */
export function useProdutoSelecionado(): [number | null, (id: number | null) => void] {
  const [params, setParams] = useSearchParams();
  const bruto = Number(params.get("produto"));
  const selecionado = Number.isInteger(bruto) && bruto > 0 ? bruto : null;
  const selecionar = (id: number | null) =>
    setParams(
      (atual) => {
        const novo = new URLSearchParams(atual);
        if (id == null) novo.delete("produto");
        else novo.set("produto", String(id));
        return novo;
      },
      { replace: true },
    );
  return [selecionado, selecionar];
}

/** Monta "&produto=ID" para as rotas do dashboard. */
export const filtroProduto = (produto: number | null) => (produto ? `&produto=${produto}` : "");
