import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { Icone } from "@/components/marca/Icone";
import { Button } from "@/components/ui/button";

type NovoLead = { para: string } | { aoClicar: () => void };

/**
 * Cabeçalho padrão das telas (Dashboard, Pipeline, Leads).
 * Celular: título compacto com o botão "+" (novo lead) ao lado; os controles vêm embaixo, na largura toda.
 * Do tablet para cima: título grande à esquerda, controles e "Novo lead" à direita.
 */
export function CabecalhoPagina({
  sobretitulo,
  titulo,
  tituloCurto,
  novoLead,
  children,
}: {
  /** Linha pequena acima do título ("Comercial", saudação…). */
  sobretitulo: ReactNode;
  titulo: string;
  /** Versão curta para o celular (ex.: "Pipeline" no lugar de "Pipeline de vendas"). */
  tituloCurto?: string;
  novoLead: NovoLead;
  /** Controles da tela: busca, período… */
  children?: ReactNode;
}) {
  const botao = (conteudo: ReactNode, props: { className: string; size?: "icone" }, rotulo?: string) =>
    "para" in novoLead ? (
      <Button asChild {...props}>
        <Link to={novoLead.para} aria-label={rotulo}>
          {conteudo}
        </Link>
      </Button>
    ) : (
      <Button type="button" onClick={novoLead.aoClicar} aria-label={rotulo} {...props}>
        {conteudo}
      </Button>
    );

  return (
    <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 sm:gap-y-4">
      <div className="flex w-full items-end justify-between gap-3 sm:block sm:w-auto">
        <div className="min-w-0">
          <div className="text-sm text-apoio">{sobretitulo}</div>
          <h1 className="mt-1 font-titulo text-[26px] text-tatame sm:text-[40px]">
            {tituloCurto ? (
              <>
                <span className="sm:hidden">{tituloCurto}</span>
                <span className="hidden sm:inline">{titulo}</span>
              </>
            ) : (
              titulo
            )}
          </h1>
        </div>
        {botao(<Icone icone={Plus} className="!size-5" strokeWidth={3} />, { className: "sm:hidden", size: "icone" }, "Novo lead")}
      </div>
      <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
        {children}
        {botao(
          <>
            <Icone icone={Plus} className="size-4" strokeWidth={3} />
            Novo lead
          </>,
          { className: "hidden sm:inline-flex" },
        )}
      </div>
    </header>
  );
}
