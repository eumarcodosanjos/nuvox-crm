import { useQuery } from "@tanstack/react-query";
import { filtroProduto } from "@/hooks/useProdutos";
import { api } from "@/lib/api";
import type { PropostaVencendo } from "@/lib/tipos";

export function usePropostasVencendo(produto: number | null = null) {
  return useQuery({
    queryKey: ["dashboard", "propostas-vencendo", produto],
    queryFn: () => api<PropostaVencendo[]>(`dashboard/propostas-vencendo?${filtroProduto(produto).slice(1)}`),
  });
}
