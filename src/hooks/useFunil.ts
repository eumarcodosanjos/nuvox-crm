import { useQuery } from "@tanstack/react-query";
import { filtroProduto } from "@/hooks/useProdutos";
import { api } from "@/lib/api";
import type { FunilResposta, Periodo } from "@/lib/tipos";

/** Funil de vendas + pipeline por produto (mesma consulta no servidor). */
export function useFunil(periodo: Periodo, produto: number | null = null) {
  return useQuery({
    queryKey: ["dashboard", "funil", periodo, produto],
    queryFn: () => api<FunilResposta>(`dashboard/funil?periodo=${periodo}${filtroProduto(produto)}`),
  });
}
