import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { DashboardKpis, Periodo } from "@/lib/tipos";

export function useDashboardKpis(periodo: Periodo) {
  return useQuery({
    queryKey: ["dashboard", "kpis", periodo],
    queryFn: () => api<DashboardKpis>(`dashboard/kpis?periodo=${periodo}`),
  });
}
