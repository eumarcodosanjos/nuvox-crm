import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { useSessao } from "@/hooks/useSessao";
import { SidebarNav } from "./SidebarNav";

/** Layout autenticado: menu lateral + área principal. Sem sessão, vai para /entrar. */
export function AppLayout() {
  const { data: sessao, isPending, isError } = useSessao();
  const local = useLocation();

  if (isPending) {
    return (
      <div className="p-6 lg:pl-[244px]" aria-busy="true" aria-label="Carregando">
        <Skeleton className="h-10 w-64" />
      </div>
    );
  }
  if (isError || !sessao) {
    return <Navigate to="/entrar" replace state={{ de: local.pathname }} />;
  }

  return (
    <div className="min-h-dvh bg-podio">
      <SidebarNav />
      <main className="lg:pl-[220px]">
        <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
