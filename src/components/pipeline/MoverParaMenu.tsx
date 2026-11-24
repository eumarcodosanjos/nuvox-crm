import { ArrowRight, Ellipsis, Pencil, X } from "lucide-react";
import { Icone } from "@/components/marca/Icone";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Etapa } from "@/lib/tipos";
import { COLUNAS, TITULO_COLUNA } from "./etapas";

/** Menu do card: "Editar lead" e a alternativa ao arrastar (melhor no celular e no teclado): "Mover para…". */
export function MoverParaMenu({
  etapaAtual,
  nome,
  aoMover,
  aoEditar,
}: {
  etapaAtual: Etapa;
  nome: string;
  aoMover: (etapa: Etapa) => void;
  aoEditar?: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Opções de ${nome}`}
        className="flex size-11 items-center justify-center text-apoio outline-none hover:text-tatame focus-visible:ring-2 focus-visible:ring-limao"
      >
        <Icone icone={Ellipsis} className="size-5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {aoEditar && (
          <>
            <DropdownMenuItem onSelect={aoEditar}>
              <Icone icone={Pencil} className="size-4 text-apoio" />
              Editar lead
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuLabel>Mover para</DropdownMenuLabel>
        {COLUNAS.map((etapa) => (
          <DropdownMenuItem key={etapa} disabled={etapa === etapaAtual} onSelect={() => aoMover(etapa)}>
            <Icone icone={ArrowRight} className="size-4 text-apoio" />
            {etapa === "fechado" ? "Fechado" : TITULO_COLUNA[etapa]}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-alerta focus:text-alerta" onSelect={() => aoMover("perdido")}>
          <Icone icone={X} className="size-4" />
          Marcar como perdido
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
