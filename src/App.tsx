import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "@/pages/Dashboard";

const EmBreve = lazy(() => import("@/pages/EmBreve"));
const ReunioesKime = lazy(() => import("@/pages/ReunioesKime"));
const Pipeline = lazy(() => import("@/pages/Pipeline"));
const Leads = lazy(() => import("@/pages/Leads"));

const EM_BREVE = ["propostas", "conversas", "tarefas", "clientes", "relatorios"];

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route
            path="/leads"
            element={
              <Suspense fallback={null}>
                <Leads />
              </Suspense>
            }
          />
          <Route
            path="/pipeline"
            element={
              <Suspense fallback={null}>
                <Pipeline />
              </Suspense>
            }
          />
          <Route path="/reunioes/:id" element={<Suspense fallback={null}><ReunioesKime /></Suspense>} />
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
