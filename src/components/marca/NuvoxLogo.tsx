import { cn } from "@/lib/utils";

/** Símbolo "N" da Nuvox: corpo em tatame, seta em limão (sempre limão no fundo escuro). */
export function NuvoxSimbolo({ className, titulo }: { className?: string; titulo?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      role={titulo ? "img" : undefined}
      aria-label={titulo}
      aria-hidden={titulo ? undefined : true}
    >
      <path d="M0 0H30V120H0Z M30 0H60L90 120H60Z M90 40H120V120H90Z" fill="#F2F2F0" />
      <path d="M80 0H120V40Z" fill="#D4FF3D" />
    </svg>
  );
}

/** Logo horizontal: símbolo + NUVOX (Archivo Expanded Black) + etiqueta CRM em limão. */
export function NuvoxLogo({ className, compacto = false }: { className?: string; compacto?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)} aria-label="Nuvox CRM" role="img">
      <NuvoxSimbolo className={compacto ? "size-6" : "size-7"} />
      <span
        aria-hidden
        className={cn("font-titulo font-black leading-none text-tatame", compacto ? "text-lg" : "text-xl")}
        style={{ fontWeight: 900 }}
      >
        NUVOX
      </span>
      <span
        aria-hidden
        className="bg-limao px-1.5 py-[3px] font-titulo text-[10px] font-black leading-none text-podio"
        style={{ fontWeight: 900 }}
      >
        CRM
      </span>
    </span>
  );
}
