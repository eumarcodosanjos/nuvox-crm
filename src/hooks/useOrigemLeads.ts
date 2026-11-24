import { useQuery } from "@tanstack/react-query";
import { filtroProduto } from "@/hooks/useProdutos";
import { api } from "@/lib/api";
import type { OrigemLeads, Periodo } from "@/lib/tipos";

export function useOrigemLeads(periodo: Periodo, produto: number | null = null) {
  return useQuery({
    queryKey: ["dashboard", "origem-leads", periodo, produto],
    queryFn: () => api<OrigemLeads[]>(`dashboard/origem-leads?periodo=${periodo}${filtroProduto(produto)}`),
  });
}
