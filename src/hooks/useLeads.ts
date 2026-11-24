import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { LeadDetalhe, LeadEdicao, LeadLista, NovoLead } from "@/lib/tipos";

export function useLeads() {
  return useQuery({
    queryKey: ["leads"],
    queryFn: () => api<LeadLista[]>("leads"),
  });
}

/** Cadastra lead + negócio; atualiza lista, Pipeline e Dashboard. */
export function useCriarLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (lead: NovoLead) =>
      api<{ leadId: number; negocioId: number }>("leads", { method: "POST", body: JSON.stringify(lead) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["pipeline"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

/** Um lead completo, para o formulário de edição. */
export function useLead(id: number | null) {
  return useQuery({
    queryKey: ["leads", id],
    queryFn: () => api<LeadDetalhe>(`leads/${id}`),
    enabled: id != null,
  });
}

/** Salva as alterações do lead e do negócio; atualiza lista, Pipeline e Dashboard. */
export function useAtualizarLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, lead }: { id: number; lead: LeadEdicao }) =>
      api<LeadDetalhe>(`leads/${id}`, { method: "PATCH", body: JSON.stringify(lead) }),
    onSuccess: (salvo) => {
      qc.setQueryData(["leads", salvo.id], salvo);
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["pipeline"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
