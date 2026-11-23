import { Link, useLocation } from "react-router-dom";
import { ITENS_MENU } from "@/components/layout/SidebarNav";
import { Button } from "@/components/ui/button";

/** Placeholder para as telas que ainda serão construídas. Grafismo "degraus" do manual. */
export default function EmBreve() {
  const { pathname } = useLocation();
  const titulo = ITENS_MENU.find((i) => pathname.startsWith(i.rota))?.rotulo ?? "Página";

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="rotulo">Em construção</p>
        <h1 className="mt-2 font-titulo text-[34px] text-tatame sm:text-[44px]">{titulo}</h1>
      </header>
      <section className="flex flex-col gap-8 border border-borda bg-superficie p-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-md">
          <p className="font-titulo text-xl text-tatame">
            Próximo <span className="text-limao">degrau.</span>
          </p>
          <p className="mt-3 text-sm text-apoio">Esta tela ainda vai ser construída. Por enquanto, o Dashboard já está no ar.</p>
          <Button asChild variant="secundario" className="mt-6">
            <Link to="/dashboard">Voltar ao Dashboard</Link>
          </Button>
        </div>
        <div aria-hidden className="flex h-32 items-end gap-2">
          <span className="h-[20%] w-8 bg-borda" />
          <span className="h-[40%] w-8 bg-degrau-1" />
          <span className="h-[60%] w-8 bg-roxo" />
          <span className="h-[80%] w-8 bg-tatame" />
          <span className="h-full w-8 bg-limao" style={{ clipPath: "polygon(0 15%, 100% 0, 100% 100%, 0 100%)" }} />
        </div>
      </section>
    </div>
  );
}
