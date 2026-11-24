import { useQuery } from "@tanstack/react-query";
import { filtroProduto } from "@/hooks/useProdutos";
import { api } from "@/lib/api";
import type { DashboardKpis, Periodo } from "@/lib/tipos";

export function useDashboardKpis(periodo: Periodo, produto: number | null = null) {
  return useQuery({
    queryKey: ["dashboard", "kpis", periodo, produto],
    queryFn: () => api<DashboardKpis>(`dashboard/kpis?periodo=${periodo}${filtroProduto(produto)}`),
  });
}
