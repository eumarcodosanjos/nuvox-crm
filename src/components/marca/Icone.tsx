import type { LucideIcon, LucideProps } from "lucide-react";

/** Ícone da marca: traço 2px, pontas retas e cantos vivos. */
export function Icone({ icone: I, ...props }: { icone: LucideIcon } & LucideProps) {
  return <I aria-hidden strokeWidth={2} strokeLinecap="square" strokeLinejoin="miter" {...props} />;
}
