import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { OrigemLeads, Periodo } from "@/lib/tipos";

export function useOrigemLeads(periodo: Periodo) {
  return useQuery({
    queryKey: ["dashboard", "origem-leads", periodo],
    queryFn: () => api<OrigemLeads[]>(`dashboard/origem-leads?periodo=${periodo}`),
  });
}
