import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { FunilResposta, Periodo } from "@/lib/tipos";

/** Funil de vendas + pipeline por produto (mesma consulta no servidor). */
export function useFunil(periodo: Periodo) {
  return useQuery({
    queryKey: ["dashboard", "funil", periodo],
    queryFn: () => api<FunilResposta>(`dashboard/funil?periodo=${periodo}`),
  });
}
