import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Etapa, NegocioPipeline } from "@/lib/tipos";

const CHAVE = ["pipeline"] as const;

export function usePipeline() {
  return useQuery({
    queryKey: CHAVE,
    queryFn: () => api<NegocioPipeline[]>("pipeline"),
  });
}

/**
 * Move um negócio de etapa com atualização otimista.
 * "Perdido" sai do quadro na hora; se o servidor falhar, tudo volta como estava.
 * Ao terminar, atualiza também os números do Dashboard.
 */
export function useMoverNegocio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, etapa }: { id: number; etapa: Etapa }) =>
      api<{ id: number; etapa: Etapa; fechadoEm: string | null }>(`negocios/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ etapa }),
      }),
    onMutate: async ({ id, etapa }) => {
      await qc.cancelQueries({ queryKey: CHAVE });
      const anterior = qc.getQueryData<NegocioPipeline[]>(CHAVE);
      qc.setQueryData<NegocioPipeline[]>(CHAVE, (lista) =>
        etapa === "perdido"
          ? lista?.filter((n) => n.id !== id)
          : lista?.map((n) =>
              n.id === id
                ? {
                    ...n,
                    etapa,
                    fechadoEm: etapa === "fechado" ? (n.fechadoEm ?? new Date().toISOString()) : null,
                  }
                : n,
            ),
      );
      return { anterior };
    },
    onError: (_erro, _vars, ctx) => {
      if (ctx?.anterior) qc.setQueryData(CHAVE, ctx.anterior);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: CHAVE });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
