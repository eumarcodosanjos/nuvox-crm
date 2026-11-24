import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, Check, ChevronRight, Plus, Search } from "lucide-react";
import { FiltroProduto } from "@/components/app/FiltroProduto";
import { Erro, SkeletonLinhas, Vazio } from "@/components/dashboard/Estados";
import { EtapaTag } from "@/components/leads/EtapaTag";
import { NovoLeadDialog } from "@/components/leads/NovoLeadDialog";
import { Icone } from "@/components/marca/Icone";
import { Button } from "@/components/ui/button";
import { useLeads } from "@/hooks/useLeads";
import { useProdutoSelecionado } from "@/hooks/useProdutos";
import { moeda, normalizar, plural } from "@/lib/formato";
import type { LeadLista } from "@/lib/tipos";

const curto = (nome: string) => nome.replace(/^Nuvox\s+/i, "");
const local = (l: LeadLista) => (l.municipio ? `${l.municipio}${l.uf ? `/${l.uf}` : ""}` : l.uf ?? "");

export default function Leads() {
  const { data: leads, isPending, isError, error, refetch } = useLeads();
  const [params, setParams] = useSearchParams();
  const [produto] = useProdutoSelecionado();
  const [busca, setBusca] = useState("");
  const [criado, setCriado] = useState<{ nome: string; editado: boolean } | null>(null);

  // ?novo=1 (botões "+ Novo lead" do Dashboard e do Pipeline) abre o formulário.
  const formularioAberto = params.get("novo") === "1";
  const abrirFormulario = (aberto: boolean) =>
    setParams(
      (atual) => {
        const novo = new URLSearchParams(atual);
        if (aberto) novo.set("novo", "1");
        else novo.delete("novo");
        return novo;
      },
      { replace: !aberto },
    );

  // ?editar=<id> abre o lead para edição (também vem do Pipeline).
  const editarParam = Number(params.get("editar"));
  const editando = Number.isInteger(editarParam) && editarParam > 0 ? editarParam : null;
  const editar = (id: number | null) =>
    setParams(
      (atual) => {
        const novo = new URLSearchParams(atual);
        if (id != null) novo.set("editar", String(id));
        else novo.delete("editar");
        return novo;
      },
      { replace: id == null },
    );

  useEffect(() => {
    if (!criado) return;
    const t = setTimeout(() => setCriado(null), 6000);
    return () => clearTimeout(t);
  }, [criado]);

  const filtrados = useMemo(() => {
    const termo = normalizar(busca.trim());
    return (leads ?? []).filter(
      (l) =>
        (produto == null || l.negocio?.produtoId === produto) &&
        (!termo ||
          normalizar(`${l.nome} ${l.organizacao ?? ""} ${l.email ?? ""} ${l.municipio ?? ""}`).includes(termo) ||
          (!!l.telefone && termo.replace(/\D/g, "").length >= 4 && l.telefone.replace(/\D/g, "").includes(termo.replace(/\D/g, "")))),
    );
  }, [leads, busca, produto]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div>
          <p className="rotulo">Comercial</p>
          <h1 className="mt-2 font-titulo text-[30px] text-tatame sm:text-[40px]">Leads</h1>
        </div>
        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
          <label className="relative flex-1 sm:w-72 sm:flex-none">
            <span className="sr-only">Buscar lead</span>
            <Icone icone={Search} className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-apoio" />
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Nome, organização, cidade ou telefone"
              className="min-h-11 w-full border border-borda bg-superficie pl-9 pr-3 text-sm text-tatame placeholder:text-apoio focus:border-tatame focus:outline-none"
            />
          </label>
          <Button className="w-full sm:w-auto" onClick={() => abrirFormulario(true)}>
            <Icone icone={Plus} className="size-4" strokeWidth={3} />
            Novo lead
          </Button>
        </div>
      </header>

      <FiltroProduto className="-mt-2" />

      {criado && (
        <p role="status" className="flex flex-wrap items-center gap-x-3 gap-y-1 border-l-2 border-limao bg-superficie px-4 py-3 text-sm text-tatame">
          <Icone icone={Check} className="size-4 text-limao" />
          <span>
            <strong>{criado.nome}</strong> {criado.editado ? "salvo." : "cadastrado e já está no Pipeline."}
          </span>
          <Link to="/pipeline" className="flex min-h-11 items-center gap-1.5 text-[11px] font-semibold uppercase tracking-rotulo hover:text-limao">
            Ver no pipeline <Icone icone={ArrowRight} className="size-4" />
          </Link>
        </p>
      )}

      {isPending ? (
        <div className="border border-borda bg-superficie p-5">
          <SkeletonLinhas linhas={6} altura="h-12" />
        </div>
      ) : isError ? (
        <div className="border border-borda bg-superficie p-5">
          <Erro mensagem={error.message} aoTentar={() => refetch()} />
        </div>
      ) : leads.length === 0 ? (
        <div className="flex flex-col items-start gap-4 border border-borda bg-superficie p-6">
          <Vazio>Nenhum lead ainda. Cadastre o primeiro e comece a subida.</Vazio>
          <Button onClick={() => abrirFormulario(true)}>
            <Icone icone={Plus} className="size-4" strokeWidth={3} />
            Cadastrar primeiro lead
          </Button>
        </div>
      ) : (
        <>
          <p className="-mb-3 text-xs text-apoio" aria-live="polite">
            {plural(filtrados.length, "lead", "leads")}
            {busca || produto ? " encontrados" : ""}
          </p>
          {filtrados.length === 0 ? (
            <Vazio>Nenhum lead com esse filtro.</Vazio>
          ) : (
            <>
              {/* Computador: tabela */}
              <div className="hidden overflow-x-auto border border-borda bg-superficie md:block">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-borda">
                      {["Lead", "Produto", "Etapa", "Valor", "Local", "Contato"].map((c) => (
                        <th key={c} scope="col" className="rotulo px-4 py-3 font-semibold">
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtrados.map((l) => (
                      <tr
                        key={l.id}
                        onClick={() => editar(l.id)}
                        className="cursor-pointer border-b border-borda transition-colors last:border-b-0 hover:bg-podio/60"
                      >
                        <td className="px-4 py-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              editar(l.id);
                            }}
                            className="flex min-h-11 flex-col justify-center text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-limao"
                            aria-label={`Editar ${l.nome}`}
                          >
                            <span className="font-semibold text-tatame underline-offset-4 hover:underline">{l.nome}</span>
                            {l.organizacao && <span className="text-xs text-apoio">{l.organizacao}</span>}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          {l.negocio ? (
                            <span className="flex items-center gap-2 whitespace-nowrap text-tatame">
                              <span aria-hidden className="size-2.5 shrink-0" style={{ background: l.negocio.produtoCor }} />
                              {curto(l.negocio.produto)}
                            </span>
                          ) : (
                            <span className="text-apoio">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">{l.negocio ? <EtapaTag etapa={l.negocio.etapa} /> : <span className="text-apoio">—</span>}</td>
                        <td className="num whitespace-nowrap px-4 py-3 text-tatame">{l.negocio ? moeda(l.negocio.valor) : "—"}</td>
                        <td className="px-4 py-3 text-apoio">{local(l) || "—"}</td>
                        <td className="px-4 py-3 text-xs text-apoio">
                          {l.telefone && <p className="num whitespace-nowrap">{l.telefone}</p>}
                          {l.email && <p className="max-w-[220px] truncate">{l.email}</p>}
                          {!l.telefone && !l.email && "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Celular: cartões */}
              <ul className="flex flex-col gap-2 md:hidden">
                {filtrados.map((l) => (
                  <li key={l.id}>
                    <button
                      type="button"
                      onClick={() => editar(l.id)}
                      aria-label={`Editar ${l.nome}`}
                      className="relative flex w-full items-center gap-3 border border-borda bg-superficie py-3 pl-4 pr-2 text-left transition-colors active:border-degrau-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-limao"
                    >
                      {l.negocio && (
                        <span aria-hidden className="absolute -left-px -top-px bottom-[-1px] w-1" style={{ background: l.negocio.produtoCor }} />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          {l.negocio && <span className="rotulo truncate !text-[10px]">{curto(l.negocio.produto)}</span>}
                          {l.negocio && <EtapaTag etapa={l.negocio.etapa} className="ml-auto shrink-0" />}
                        </span>
                        <span className="mt-1 block truncate text-[15px] font-semibold text-tatame">{l.nome}</span>
                        {l.organizacao && <span className="block truncate text-[13px] text-apoio">{l.organizacao}</span>}
                        {(() => {
                          const extra = [
                            l.negocio && l.negocio.valor > 0 ? moeda(l.negocio.valor) : null,
                            local(l) || null,
                            l.telefone,
                          ].filter(Boolean);
                          return extra.length ? (
                            <span className="num mt-1 block truncate text-xs text-apoio">{extra.join(" · ")}</span>
                          ) : null;
                        })()}
                      </span>
                      <Icone icone={ChevronRight} className="size-5 shrink-0 text-apoio" />
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}

      <NovoLeadDialog
        aberto={formularioAberto}
        aoMudar={abrirFormulario}
        aoCriar={(nome) => setCriado({ nome, editado: false })}
        produtoInicial={produto}
      />
      <NovoLeadDialog
        aberto={editando != null}
        leadId={editando}
        aoMudar={(aberto) => !aberto && editar(null)}
        aoCriar={(nome) => setCriado({ nome, editado: true })}
      />
    </div>
  );
}
