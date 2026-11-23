import { useEffect, useId, useState } from "react";
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

export function SidebarNav() {
  const [aberto, setAberto] = useState(false);
  const idMenu = useId();
  const { pathname } = useLocation();
  useEffect(() => setAberto(false), [pathname]);

  return (
    <>
      {/* Desktop: barra lateral fixa de 220px */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[220px] flex-col border-r border-borda bg-podio px-4 py-6 lg:flex">
        <NavLink to="/dashboard" className="mb-8 flex min-h-11 items-center px-1" aria-label="Nuvox CRM — Dashboard">
          <NuvoxLogo compacto />
        </NavLink>
        <nav aria-label="Principal" className="flex-1 overflow-y-auto">
          <Itens />
        </nav>
        <Usuario />
      </aside>

      {/* Celular/tablet: topo com menu empilhado */}
      <header className="sticky top-0 z-20 border-b border-borda bg-podio lg:hidden">
        <div className="flex items-center justify-between px-4 py-2">
          <NavLink to="/dashboard" className="flex min-h-11 items-center" aria-label="Nuvox CRM — Dashboard">
            <NuvoxLogo compacto />
          </NavLink>
          <button
            type="button"
            onClick={() => setAberto((v) => !v)}
            aria-expanded={aberto}
            aria-controls={idMenu}
            className="flex min-h-11 items-center gap-2 px-2 text-[11px] font-semibold uppercase tracking-rotulo text-tatame"
          >
            {aberto ? "Fechar" : "Menu"}
            <Icone icone={aberto ? X : Menu} className="size-5" />
          </button>
        </div>
        <div id={idMenu} hidden={!aberto} className="border-t border-borda px-4 pb-4 pt-3">
          <nav aria-label="Principal">
            <Itens aoNavegar={() => setAberto(false)} />
          </nav>
          <div className="mt-4">
            <Usuario />
          </div>
        </div>
      </header>
    </>
  );
}
