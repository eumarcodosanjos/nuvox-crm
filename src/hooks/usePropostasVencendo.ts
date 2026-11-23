import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { PropostaVencendo } from "@/lib/tipos";

export function usePropostasVencendo() {
  return useQuery({
    queryKey: ["dashboard", "propostas-vencendo"],
    queryFn: () => api<PropostaVencendo[]>("dashboard/propostas-vencendo"),
  });
}
