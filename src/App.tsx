import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Entrar from "@/pages/Entrar";

const EmBreve = lazy(() => import("@/pages/EmBreve"));

const EM_BREVE = ["pipeline", "leads", "propostas", "conversas", "tarefas", "clientes", "relatorios"];

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/entrar" element={<Entrar />} />
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          {EM_BREVE.map((rota) => (
            <Route
              key={rota}
              path={`/${rota}/*`}
              element={
                <Suspense fallback={null}>
                  <EmBreve />
                </Suspense>
              }
            />
          ))}
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
