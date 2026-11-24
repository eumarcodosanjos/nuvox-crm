import { useId } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import type { TarefaHoje } from "@/lib/tipos";
import { horario, ROTULO_CANAL } from "@/lib/formato";
import { cn } from "@/lib/utils";

/** Tarefa do dia: marca como feita ao tocar na linha. Mostra com quem é e o horário à direita. */
export function TarefaItem({
  tarefa,
  aoMarcar,
  agora = new Date(),
}: {
  tarefa: TarefaHoje;
  aoMarcar: (concluida: boolean) => void;
  agora?: Date;
}) {
  const id = useId();
  const atrasada = !tarefa.concluida && new Date(tarefa.dataHora) < agora;
  const quem = [tarefa.leadNome, tarefa.organizacao].filter(Boolean).join(" · ");
  return (
    <li className="border-b border-borda last:border-b-0">
      <label htmlFor={id} className="flex min-h-11 cursor-pointer items-center gap-3 py-2.5">
        <Checkbox id={id} checked={tarefa.concluida} onCheckedChange={(v) => aoMarcar(v === true)} />
        <span className="min-w-0 flex-1">
          <span
            className={cn(
              "block truncate text-sm font-medium",
              tarefa.concluida ? "text-apoio line-through" : "text-tatame",
            )}
          >
            {tarefa.titulo}
          </span>
          <span className="num block truncate text-xs text-apoio">
            {tarefa.produtoCor && (
              <span aria-hidden className="mr-1.5 inline-block size-2 align-[1px]" style={{ background: tarefa.produtoCor }} />
            )}
            {quem || ROTULO_CANAL[tarefa.canal]}
            {quem ? ` · ${ROTULO_CANAL[tarefa.canal]}` : ""}
          </span>
        </span>
        <span
          className={cn(
            "num shrink-0 text-xs font-semibold",
            tarefa.concluida ? "text-apoio" : atrasada ? "text-alerta" : "text-tatame",
          )}
        >
          {atrasada ? `Atrasada · ${horario(tarefa.dataHora)}` : horario(tarefa.dataHora)}
        </span>
      </label>
    </li>
  );
}
