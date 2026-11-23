import { RefreshCw, TriangleAlert } from "lucide-react";
import { Icone } from "@/components/marca/Icone";
import { Skeleton } from "@/components/ui/skeleton";

/** Estado vazio: texto curto e direto. */
export function Vazio({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex min-h-24 items-center border border-dashed border-borda px-4 py-6 text-sm text-apoio">
      {children}
    </p>
  );
}

/** Estado de erro com botão de tentar de novo. */
export function Erro({ mensagem, aoTentar }: { mensagem?: string; aoTentar?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-2 border-l-2 border-alerta bg-podio px-4 py-3">
      <p className="flex items-center gap-2 text-sm font-semibold text-alerta">
        <Icone icone={TriangleAlert} className="size-4" />
        Não deu para carregar.
      </p>
      {mensagem && <p className="text-sm text-apoio">{mensagem}</p>}
      {aoTentar && (
        <button
          type="button"
          onClick={aoTentar}
          className="-ml-2 flex min-h-11 items-center gap-2 px-2 text-[11px] font-semibold uppercase tracking-rotulo text-tatame hover:text-limao"
        >
          <Icone icone={RefreshCw} className="size-4" />
          Tentar de novo
        </button>
      )}
    </div>
  );
}

/** Linhas de skeleton para listas e barras. */
export function SkeletonLinhas({ linhas = 4, altura = "h-9" }: { linhas?: number; altura?: string }) {
  return (
    <div className="flex flex-col gap-3" aria-hidden>
      {Array.from({ length: linhas }, (_, i) => (
        <Skeleton key={i} className={altura} style={{ width: `${100 - i * 12}%` }} />
      ))}
    </div>
  );
}
