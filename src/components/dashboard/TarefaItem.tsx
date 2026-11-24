import { useId } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import type { TarefaHoje } from "@/lib/tipos";
import { horario, ROTULO_CANAL } from "@/lib/formato";
import { cn } from "@/lib/utils";

export function TarefaItem({
  tarefa,
  aoMarcar,
}: {
  tarefa: TarefaHoje;
  aoMarcar: (concluida: boolean) => void;
}) {
  const id = useId();
  return (
    <li className="border-b border-borda last:border-b-0">
      <label htmlFor={id} className="flex min-h-11 cursor-pointer items-start gap-3 py-3">
        <Checkbox
          id={id}
          checked={tarefa.concluida}
          onCheckedChange={(v) => aoMarcar(v === true)}
          className="mt-0.5"
        />
        <span className="min-w-0">
          <span
            className={cn(
              "block text-sm font-medium",
              tarefa.concluida ? "text-apoio line-through" : "text-tatame",
            )}
          >
            {tarefa.titulo}
          </span>
          <span className="num block text-xs text-apoio">
            {tarefa.produtoCor && (
              <span aria-hidden className="mr-1.5 inline-block size-2 align-[1px]" style={{ background: tarefa.produtoCor }} />
            )}
            {ROTULO_CANAL[tarefa.canal]} · {horario(tarefa.dataHora)}
          </span>
        </span>
      </label>
    </li>
  );
}
