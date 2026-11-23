import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import { ErroApi } from "./lib/api";
import { CHAVE_SESSAO } from "./hooks/useSessao";
import "./index.css";

/** Sessão expirou em qualquer chamada? Volta para o login. */
const aoErrar = (erro: Error) => {
  if (erro instanceof ErroApi && erro.status === 401) queryClient.setQueryData(CHAVE_SESSAO, null);
};

const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: aoErrar }),
  mutationCache: new MutationCache({ onError: aoErrar }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: true,
      retry: (falhas, erro) => !(erro instanceof ErroApi && erro.status === 401) && falhas < 2,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);
