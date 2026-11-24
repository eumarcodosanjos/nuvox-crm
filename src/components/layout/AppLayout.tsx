import { Outlet } from "react-router-dom";
import { AvisosApp } from "@/components/app/AvisosApp";
import { SidebarNav } from "./SidebarNav";

/** Layout: menu lateral + área principal. */
export function AppLayout() {
  return (
    <div className="min-h-dvh bg-podio">
      <SidebarNav />
      <main className="lg:pl-[220px]">
        <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
          <Outlet />
        </div>
      </main>
      <AvisosApp />
    </div>
  );
}
