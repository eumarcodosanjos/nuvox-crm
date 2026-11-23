import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { NuvoxLogo } from "@/components/marca/NuvoxLogo";
import { Button } from "@/components/ui/button";
import { useEntrar, useSessao } from "@/hooks/useSessao";

const campo =
  "min-h-11 w-full border border-borda bg-podio px-3 text-[15px] text-tatame placeholder:text-apoio/70 focus:border-tatame focus:outline-none";

export default function Entrar() {
  const { data: sessao } = useSessao();
  const entrar = useEntrar();
  const navegar = useNavigate();
  const destino = (useLocation().state as { de?: string } | null)?.de ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  if (sessao) return <Navigate to={destino} replace />;

  function enviar(e: FormEvent) {
    e.preventDefault();
    entrar.mutate({ email, senha }, { onSuccess: () => navegar(destino, { replace: true }) });
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-podio px-4 py-10">
      <div className="w-full max-w-[400px]">
        <NuvoxLogo className="mb-10" />
        <h1 className="font-titulo text-[32px] text-tatame">
          Toda venda
          <br />é uma <span className="text-limao">subida.</span>
        </h1>
        <p className="mt-3 text-sm text-apoio">Entre para ver seu pipeline.</p>

        <form onSubmit={enviar} className="mt-8 flex flex-col gap-4 border border-borda bg-superficie p-5" noValidate>
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="rotulo">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={campo}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="senha" className="rotulo">
              Senha
            </label>
            <input
              id="senha"
              type="password"
              autoComplete="current-password"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className={campo}
            />
          </div>
          {entrar.isError && (
            <p role="alert" className="border-l-2 border-alerta pl-3 text-sm text-alerta">
              {entrar.error.message}
            </p>
          )}
          <Button type="submit" disabled={entrar.isPending} className="mt-2 w-full">
            {entrar.isPending ? "Entrando…" : "Entrar"}
          </Button>
        </form>
      </div>
    </main>
  );
}
