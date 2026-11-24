import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { Icone } from "@/components/marca/Icone";
import { cn } from "@/lib/utils";

/** Peças de formulário da marca: cantos retos, rótulo em caixa-alta, erro em alerta. */

const base =
  "min-h-11 w-full rounded-none border bg-podio px-3 text-[15px] text-tatame placeholder:text-apoio/70 focus:border-tatame focus:outline-none";

interface CampoBase {
  rotulo: string;
  erro?: string;
  dica?: string;
  obrigatorio?: boolean;
  className?: string;
}

function Moldura({
  id,
  rotulo,
  erro,
  dica,
  obrigatorio,
  className,
  children,
}: CampoBase & { id: string; children: ReactNode }) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <label htmlFor={id} className="rotulo">
        {rotulo}
        {obrigatorio && <span className="text-limao"> *</span>}
      </label>
      {children}
      {erro ? (
        <p id={`${id}-erro`} className="text-xs text-alerta">
          {erro}
        </p>
      ) : dica ? (
        <p id={`${id}-dica`} className="text-xs text-apoio">
          {dica}
        </p>
      ) : null}
    </div>
  );
}

const descritoPor = (id: string, erro?: string, dica?: string) =>
  erro ? `${id}-erro` : dica ? `${id}-dica` : undefined;

export function Entrada({
  rotulo,
  erro,
  dica,
  obrigatorio,
  className,
  prefixo,
  ...props
}: CampoBase & { prefixo?: string } & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <Moldura id={id} rotulo={rotulo} erro={erro} dica={dica} obrigatorio={obrigatorio} className={className}>
      <div className="relative">
        {prefixo && (
          <span aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-apoio">
            {prefixo}
          </span>
        )}
        <input
          id={id}
          aria-invalid={!!erro || undefined}
          aria-describedby={descritoPor(id, erro, dica)}
          required={obrigatorio}
          className={cn(base, erro ? "border-alerta" : "border-borda", prefixo && "pl-10")}
          {...props}
        />
      </div>
    </Moldura>
  );
}

export function Selecao({
  rotulo,
  erro,
  dica,
  obrigatorio,
  className,
  opcoes,
  vazio,
  ...props
}: CampoBase & {
  opcoes: readonly { valor: string; rotulo: string }[];
  /** Texto da opção vazia (ex.: "Selecione"); sem ele, não há opção vazia. */
  vazio?: string;
} & SelectHTMLAttributes<HTMLSelectElement>) {
  const id = useId();
  return (
    <Moldura id={id} rotulo={rotulo} erro={erro} dica={dica} obrigatorio={obrigatorio} className={className}>
      <div className="relative">
        <select
          id={id}
          aria-invalid={!!erro || undefined}
          aria-describedby={descritoPor(id, erro, dica)}
          className={cn(base, "appearance-none pr-9", erro ? "border-alerta" : "border-borda")}
          {...props}
        >
          {vazio !== undefined && <option value="">{vazio}</option>}
          {opcoes.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.rotulo}
            </option>
          ))}
        </select>
        <Icone icone={ChevronDown} className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-apoio" />
      </div>
    </Moldura>
  );
}

export function AreaTexto({
  rotulo,
  erro,
  dica,
  className,
  ...props
}: CampoBase & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  return (
    <Moldura id={id} rotulo={rotulo} erro={erro} dica={dica} className={className}>
      <textarea
        id={id}
        aria-invalid={!!erro || undefined}
        aria-describedby={descritoPor(id, erro, dica)}
        className={cn(base, "min-h-24 py-2.5", erro ? "border-alerta" : "border-borda")}
        {...props}
      />
    </Moldura>
  );
}

/** Grupo de opções exclusivas como botões (rádio nativo por baixo, acessível no teclado). */
export function Opcoes<T extends string | number>({
  rotulo,
  nome,
  valor,
  aoMudar,
  opcoes,
  erro,
  obrigatorio,
  className,
}: {
  rotulo: string;
  nome: string;
  valor: T | null;
  aoMudar: (v: T) => void;
  opcoes: readonly { valor: T; rotulo: string; cor?: string }[];
  erro?: string;
  obrigatorio?: boolean;
  className?: string;
}) {
  const id = useId();
  return (
    <fieldset className={cn("flex min-w-0 flex-col gap-1.5", className)} aria-describedby={erro ? `${id}-erro` : undefined}>
      <legend className="rotulo mb-1.5">
        {rotulo}
        {obrigatorio && <span className="text-limao"> *</span>}
      </legend>
      <div className="flex flex-wrap gap-2">
        {opcoes.map((o) => {
          const marcado = o.valor === valor;
          return (
            <label
              key={String(o.valor)}
              className={cn(
                "flex min-h-11 cursor-pointer items-center gap-2 border px-3.5 text-sm transition-colors",
                "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-limao",
                marcado ? "border-tatame bg-tatame font-semibold text-podio" : "border-borda text-tatame hover:border-degrau-2",
                erro && !marcado && "border-alerta/60",
              )}
            >
              <input
                type="radio"
                name={nome}
                className="sr-only appearance-none"
                checked={marcado}
                onChange={() => aoMudar(o.valor)}
              />
              {o.cor && <span aria-hidden className="size-2.5 shrink-0" style={{ background: o.cor }} />}
              {o.rotulo}
            </label>
          );
        })}
      </div>
      {erro && (
        <p id={`${id}-erro`} className="text-xs text-alerta">
          {erro}
        </p>
      )}
    </fieldset>
  );
}
