import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { LeadLista, NovoLead } from "@/lib/tipos";

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
