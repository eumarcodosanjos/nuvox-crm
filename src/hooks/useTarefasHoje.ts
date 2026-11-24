import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { filtroProduto } from "@/hooks/useProdutos";
import { api } from "@/lib/api";
import type { TarefaHoje } from "@/lib/tipos";

const CHAVE = ["dashboard", "tarefas-hoje"] as const;

export function useTarefasHoje(produto: number | null = null) {
  return useQuery({
    queryKey: [...CHAVE, produto],
    queryFn: () => api<TarefaHoje[]>(`dashboard/tarefas-hoje?${filtroProduto(produto).slice(1)}`),
  });
}

/** Marca/desmarca uma tarefa com atualização otimista (volta atrás se falhar). */
export function useMarcarTarefa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, concluida }: { id: number; concluida: boolean }) =>
      api<{ ok: true }>(`tarefas/${id}`, { method: "PATCH", body: JSON.stringify({ concluida }) }),
    onMutate: async ({ id, concluida }) => {
      // Atualiza a tarefa em todas as listas em cache (todos os produtos e cada filtro).
      await qc.cancelQueries({ queryKey: CHAVE });
      const anteriores = qc.getQueriesData<TarefaHoje[]>({ queryKey: CHAVE });
      qc.setQueriesData<TarefaHoje[]>({ queryKey: CHAVE }, (lista) =>
        lista?.map((t) => (t.id === id ? { ...t, concluida } : t)),
      );
      return { anteriores };
    },
    onError: (_erro, _vars, ctx) => {
      ctx?.anteriores.forEach(([chave, dados]) => qc.setQueryData(chave, dados));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: CHAVE }),
  });
}
