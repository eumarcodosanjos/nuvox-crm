import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { NavLink, useLocation } from "react-router-dom";
import {
  FileText,
  LayoutDashboard,
  Menu,
  MessageSquare,
  SquareCheck,
  SquareKanban,
  TrendingUp,
  UserRound,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { InstalarApp } from "@/components/app/InstalarApp";
import { Icone } from "@/components/marca/Icone";
import { NuvoxLogo } from "@/components/marca/NuvoxLogo";
import { USUARIO } from "@/lib/usuario";
import { cn } from "@/lib/utils";

export const ITENS_MENU: { rota: string; rotulo: string; icone: LucideIcon }[] = [
  { rota: "/dashboard", rotulo: "Dashboard", icone: LayoutDashboard },
  { rota: "/pipeline", rotulo: "Pipeline", icone: SquareKanban },
  { rota: "/leads", rotulo: "Leads", icone: UserRound },
  { rota: "/propostas", rotulo: "Propostas", icone: FileText },
  { rota: "/conversas", rotulo: "Conversas", icone: MessageSquare },
  { rota: "/tarefas", rotulo: "Tarefas", icone: SquareCheck },
  { rota: "/clientes", rotulo: "Clientes", icone: Users },
  { rota: "/relatorios", rotulo: "Relatórios", icone: TrendingUp },
];

function Itens({ aoNavegar }: { aoNavegar?: () => void }) {
  return (
    <ul className="flex flex-col gap-1">
      {ITENS_MENU.map(({ rota, rotulo, icone }) => (
        <li key={rota}>
          <NavLink
            to={rota}
            onClick={aoNavegar}
            className={({ isActive }) =>
              cn(
                "flex min-h-11 items-center gap-3 px-3 text-[15px] font-medium transition-colors",
                isActive ? "bg-tatame text-podio" : "text-tatame hover:bg-superficie",
              )
            }
          >
            <Icone icone={icone} className="size-[18px]" />
            {rotulo}
          </NavLink>
        </li>
      ))}
    </ul>
  );
}

/** Dono do CRM no rodapé do menu (uso pessoal, sem login por enquanto). */
function Usuario() {
  return (
    <div className="flex min-h-11 items-center gap-3 border-t border-borda pt-4">
      <span
        aria-hidden
        className="flex size-9 shrink-0 items-center justify-center bg-roxo font-titulo text-sm text-tatame"
      >
        {USUARIO.nome.trim().charAt(0)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-tatame">{USUARIO.nome}</p>
        <p className="truncate text-xs text-apoio">{USUARIO.cargo}</p>
      </div>
    </div>
  );
}

/** Conteúdo do menu, igual no computador (barra fixa) e no celular (gaveta). */
function ConteudoMenu({ aoNavegar }: { aoNavegar?: () => void }) {
  return (
    <>
      <nav aria-label="Principal" className="flex-1 overflow-y-auto">
        <Itens aoNavegar={aoNavegar} />
      </nav>
      <InstalarApp className="mb-4 w-full" />
      <Usuario />
    </>
  );
}

export function SidebarNav() {
  const [aberto, setAberto] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => setAberto(false), [pathname]);

  // Arrastar a gaveta para a esquerda fecha o menu.
  const inicioToque = useRef<number | null>(null);
  const aoTocar = (e: React.TouchEvent) => (inicioToque.current = e.touches[0]?.clientX ?? null);
  const aoSoltarToque = (e: React.TouchEvent) => {
    const fim = e.changedTouches[0]?.clientX;
    if (inicioToque.current != null && fim != null && inicioToque.current - fim > 60) setAberto(false);
    inicioToque.current = null;
  };

  return (
    <>
      {/* Computador: barra lateral fixa de 220px */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[220px] flex-col border-r border-borda bg-podio px-4 py-6 lg:flex">
        <NavLink to="/dashboard" className="mb-8 flex min-h-11 items-center px-1" aria-label="Nuvox CRM — Dashboard">
          <NuvoxLogo compacto />
        </NavLink>
        <ConteudoMenu />
      </aside>

      {/* Celular/tablet: barra do topo + menu lateral (gaveta) que desliza da esquerda */}
      <header className="sticky top-0 z-20 flex items-center gap-1 border-b border-borda bg-podio px-2 py-2 lg:hidden">
        <Dialog.Root open={aberto} onOpenChange={setAberto}>
          <Dialog.Trigger
            aria-label="Abrir menu"
            className="flex size-11 items-center justify-center text-tatame focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-limao"
          >
            <Icone icone={Menu} className="size-6" />
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-podio/80 data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
            <Dialog.Content
              aria-describedby={undefined}
              onTouchStart={aoTocar}
              onTouchEnd={aoSoltarToque}
              className={cn(
                "fixed inset-y-0 left-0 z-50 flex w-[280px] max-w-[85vw] flex-col border-r border-borda bg-podio px-4",
                "pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]",
                "duration-200 data-[state=closed]:animate-out data-[state=open]:animate-in",
                "data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left",
                "focus:outline-none",
              )}
            >
              <Dialog.Title className="sr-only">Menu</Dialog.Title>
              <div className="mb-6 flex items-center justify-between">
                <NavLink
                  to="/dashboard"
                  onClick={() => setAberto(false)}
                  className="flex min-h-11 items-center px-1"
                  aria-label="Nuvox CRM — Dashboard"
                >
                  <NuvoxLogo compacto />
                </NavLink>
                <Dialog.Close
                  aria-label="Fechar menu"
                  className="-mr-2 flex size-11 items-center justify-center text-apoio hover:text-tatame focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-limao"
                >
                  <Icone icone={X} className="size-5" />
                </Dialog.Close>
              </div>
              <ConteudoMenu aoNavegar={() => setAberto(false)} />
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

        <NavLink to="/dashboard" className="flex min-h-11 items-center px-1" aria-label="Nuvox CRM — Dashboard">
          <NuvoxLogo compacto />
        </NavLink>
      </header>
    </>
  );
}
