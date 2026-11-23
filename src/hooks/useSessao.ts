import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Sessao } from "@/lib/tipos";

export const CHAVE_SESSAO = ["sessao"] as const;

/** Usuário logado, ou null. */
export function useSessao() {
  return useQuery({
    queryKey: CHAVE_SESSAO,
    queryFn: () => api<Sessao | null>("sessao"),
    staleTime: Infinity,
    retry: false,
  });
}

export function useEntrar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dados: { email: string; senha: string }) =>
      api<Sessao>("sessao", { method: "POST", body: JSON.stringify(dados) }),
    onSuccess: (sessao) => qc.setQueryData(CHAVE_SESSAO, sessao),
  });
}

export function useSair() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api<{ ok: true }>("sessao", { method: "DELETE" }),
    onSettled: () => {
      qc.clear();
      qc.setQueryData(CHAVE_SESSAO, null);
    },
  });
}
