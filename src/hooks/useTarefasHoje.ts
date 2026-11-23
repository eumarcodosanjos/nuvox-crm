import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { TarefaHoje } from "@/lib/tipos";

const CHAVE = ["dashboard", "tarefas-hoje"] as const;

export function useTarefasHoje() {
  return useQuery({
    queryKey: CHAVE,
    queryFn: () => api<TarefaHoje[]>("dashboard/tarefas-hoje"),
  });
}

/** Marca/desmarca uma tarefa com atualização otimista (volta atrás se falhar). */
export function useMarcarTarefa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, concluida }: { id: number; concluida: boolean }) =>
      api<{ ok: true }>(`tarefas/${id}`, { method: "PATCH", body: JSON.stringify({ concluida }) }),
    onMutate: async ({ id, concluida }) => {
      await qc.cancelQueries({ queryKey: CHAVE });
      const anterior = qc.getQueryData<TarefaHoje[]>(CHAVE);
      qc.setQueryData<TarefaHoje[]>(CHAVE, (lista) =>
        lista?.map((t) => (t.id === id ? { ...t, concluida } : t)),
      );
      return { anterior };
    },
    onError: (_erro, _vars, ctx) => {
      if (ctx?.anterior) qc.setQueryData(CHAVE, ctx.anterior);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: CHAVE }),
  });
}
