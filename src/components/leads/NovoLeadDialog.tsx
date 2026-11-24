import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Erro, SkeletonLinhas } from "@/components/dashboard/Estados";
import { useAtualizarLead, useCriarLead, useLead } from "@/hooks/useLeads";
import { useProdutos } from "@/hooks/useProdutos";
import { ErroApi } from "@/lib/api";
import { lerMoeda, moeda } from "@/lib/formato";
import { valorNegocio } from "@/lib/negocio";
import { CARGOS_OPCOES, NOME_GOVESCOLAR, ORIGENS_OPCOES, REDES_OPCOES, TIPOS, UFS } from "@/lib/opcoes";
import type { Cargo, Etapa, LeadDetalhe, LeadEdicao, Origem, RedeEnsino, TipoLead } from "@/lib/tipos";
import { AreaTexto, Entrada, Opcoes, Selecao } from "./Campos";

const ETAPAS: { valor: Etapa; rotulo: string }[] = [
  { valor: "novo", rotulo: "Novo" },
  { valor: "contato", rotulo: "Contato" },
  { valor: "proposta", rotulo: "Proposta" },
  { valor: "negociacao", rotulo: "Negociação" },
  { valor: "fechado", rotulo: "Fechado" },
];
/** Na edição dá para marcar como perdido (no cadastro, não faz sentido). */
const ETAPAS_EDICAO: { valor: Etapa; rotulo: string }[] = [...ETAPAS, { valor: "perdido", rotulo: "Perdido" }];

const vazio = {
  nome: "",
  organizacao: "",
  telefone: "",
  email: "",
  tipo: "" as TipoLead | "",
  origem: "" as Origem | "",
  produtoId: null as number | null,
  etapa: "novo" as Etapa,
  implantacao: "",
  mensal: "",
  avulso: "",
  municipio: "",
  uf: "",
  cargo: "" as Cargo | "",
  rede: null as RedeEnsino | null,
  qtdEscolas: "",
  qtdAlunos: "",
  observacoes: "",
};

const curto = (nome: string) => nome.replace(/^Nuvox\s+/i, "");

/** Centavos → texto do campo ("1.500,00"); zero vira campo vazio. */
const paraCampo = (centavos: number) =>
  centavos ? (centavos / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "";

/** Lead salvo → valores do formulário. */
function deDetalhe(d: LeadDetalhe): typeof vazio {
  return {
    nome: d.nome,
    organizacao: d.organizacao ?? "",
    telefone: d.telefone ?? "",
    email: d.email ?? "",
    tipo: d.tipo,
    origem: d.origem,
    produtoId: d.negocio?.produto_id ?? null,
    etapa: d.negocio?.etapa ?? "novo",
    implantacao: paraCampo(d.negocio?.valor_implantacao ?? 0),
    mensal: paraCampo(d.negocio?.valor_mensal ?? 0),
    avulso: paraCampo(d.negocio?.valor_avulso ?? 0),
    municipio: d.municipio ?? "",
    uf: d.uf ?? "",
    cargo: d.cargo_contato ?? "",
    rede: d.rede_ensino ?? null,
    qtdEscolas: d.qtd_escolas != null ? String(d.qtd_escolas) : "",
    qtdAlunos: d.qtd_alunos != null ? String(d.qtd_alunos) : "",
    observacoes: d.observacoes ?? "",
  };
}

/** Campo do formulário → nome do campo nos erros do servidor (quando diferem). */
const CHAVE_ERRO: Partial<Record<keyof typeof vazio, string>> = {
  produtoId: "produto_id",
  implantacao: "valor_implantacao",
  mensal: "valor_mensal",
  avulso: "valor_avulso",
  cargo: "cargo_contato",
  rede: "rede_ensino",
  qtdEscolas: "qtd_escolas",
  qtdAlunos: "qtd_alunos",
};

/**
 * Formulário do lead.
 * - Sem `leadId`: "Novo lead", cria o lead e o negócio no Pipeline de uma vez.
 * - Com `leadId`: "Editar lead", carrega o lead e salva lead + negócio (produto, etapa e valores).
 */
export function NovoLeadDialog({
  aberto,
  aoMudar,
  aoCriar,
  produtoInicial,
  leadId = null,
}: {
  aberto: boolean;
  aoMudar: (aberto: boolean) => void;
  /** Chamado com o nome do lead depois de criar ou salvar. */
  aoCriar: (nome: string) => void;
  produtoInicial?: number | null;
  leadId?: number | null;
}) {
  const edicao = leadId != null;
  const { data: produtos } = useProdutos();
  const criar = useCriarLead();
  const atualizar = useAtualizarLead();
  const salvar = edicao ? atualizar : criar;
  const detalhe = useLead(aberto ? leadId : null);
  const [f, setF] = useState(vazio);
  const [erros, setErros] = useState<Record<string, string>>({});
  const muda = <K extends keyof typeof vazio>(k: K, v: (typeof vazio)[K]) => {
    setF((atual) => ({ ...atual, [k]: v }));
    const chave = CHAVE_ERRO[k] ?? k;
    setErros(({ [chave]: _remover, ...resto }) => resto);
  };

  // Ao abrir: formulário limpo (já com o produto do filtro) ou, na edição, os dados do lead.
  useEffect(() => {
    if (!aberto) return;
    setErros({});
    criar.reset();
    atualizar.reset();
    if (!edicao) setF({ ...vazio, produtoId: produtoInicial ?? null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto, leadId]);

  const carregado = detalhe.data && detalhe.data.id === leadId ? detalhe.data : null;
  useEffect(() => {
    if (aberto && carregado) setF(deDetalhe(carregado));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto, carregado?.id]);

  const govEscolar = produtos?.find((p) => p.nome === NOME_GOVESCOLAR);
  const ehGov = govEscolar != null && f.produtoId === govEscolar.id;

  // GovEscolar: no cadastro, sugere o tipo "Secretaria de Educação" se ainda não foi escolhido.
  useEffect(() => {
    if (!edicao && ehGov && (f.tipo === "" || f.tipo === "outro")) muda("tipo", "secretaria_educacao");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ehGov, f.tipo, edicao]);

  const valores = useMemo(
    () => ({ implantacao: lerMoeda(f.implantacao), mensal: lerMoeda(f.mensal), avulso: lerMoeda(f.avulso) }),
    [f.implantacao, f.mensal, f.avulso],
  );
  const valorValido = Object.values(valores).every((v) => !Number.isNaN(v));
  const total = valorValido
    ? valorNegocio({ valor_implantacao: valores.implantacao, valor_mensal: valores.mensal, valor_avulso: valores.avulso })
    : null;

  function enviar(e: FormEvent) {
    e.preventDefault();
    const locais: Record<string, string> = {};
    if (f.nome.trim().length < 2) locais.nome = "Informe o nome do contato.";
    if (!f.produtoId) locais.produto_id = "Escolha o produto.";
    if (!f.tipo) locais.tipo = "Escolha o tipo.";
    if (!f.origem) locais.origem = "Escolha a origem.";
    if (Number.isNaN(valores.implantacao)) locais.valor_implantacao = "Use só números, ex.: 1.500,00";
    if (Number.isNaN(valores.mensal)) locais.valor_mensal = "Use só números, ex.: 249,90";
    if (Number.isNaN(valores.avulso)) locais.valor_avulso = "Use só números, ex.: 800,00";
    if (Object.keys(locais).length) {
      setErros(locais);
      return;
    }

    const lead: LeadEdicao = {
      nome: f.nome,
      organizacao: f.organizacao || null,
      tipo: f.tipo as TipoLead,
      origem: f.origem as Origem,
      telefone: f.telefone || null,
      email: f.email || null,
      observacoes: f.observacoes || null,
      municipio: f.municipio || null,
      uf: f.uf || null,
      cargo_contato: ehGov && f.cargo ? f.cargo : null,
      rede_ensino: ehGov ? f.rede : null,
      qtd_escolas: ehGov && f.qtdEscolas ? Number(f.qtdEscolas) : null,
      qtd_alunos: ehGov && f.qtdAlunos ? Number(f.qtdAlunos) : null,
      negocio: {
        produto_id: f.produtoId!,
        etapa: f.etapa,
        valor_implantacao: valores.implantacao,
        valor_mensal: valores.mensal,
        valor_avulso: valores.avulso,
      },
    };
    const aoTerminar = {
      onSuccess: () => {
        aoCriar(f.nome.trim());
        aoMudar(false);
      },
      onError: (erro: Error) => {
        if (erro instanceof ErroApi && Object.keys(erro.campos).length) setErros(erro.campos);
      },
    };
    if (edicao) atualizar.mutate({ id: leadId, lead }, aoTerminar);
    else criar.mutate({ ...lead, negocio: { ...lead.negocio, etapa: lead.negocio.etapa === "perdido" ? "novo" : lead.negocio.etapa } }, aoTerminar);
  }

  const erroGeral = salvar.isError && !(salvar.error instanceof ErroApi && Object.keys(salvar.error.campos).length);

  return (
    <Dialog open={aberto} onOpenChange={aoMudar}>
      <DialogContent className="max-w-2xl p-5 sm:p-7">
        <DialogTitle>{edicao ? "Editar lead" : "Novo lead"}</DialogTitle>
        <DialogDescription>
          {edicao
            ? "As mudanças já aparecem no Pipeline e no Dashboard."
            : "O lead já entra no Pipeline, na etapa que você escolher."}
        </DialogDescription>

        {edicao && !carregado ? (
          <div className="mt-6">
            {detalhe.isError ? (
              <Erro mensagem={detalhe.error.message} aoTentar={() => detalhe.refetch()} />
            ) : (
              <SkeletonLinhas linhas={6} altura="h-11" />
            )}
          </div>
        ) : (
        <form onSubmit={enviar} noValidate className="mt-6 flex flex-col gap-7">
          {/* Contato */}
          <section className="grid gap-4 sm:grid-cols-2">
            <h3 className="font-titulo text-xs text-apoio sm:col-span-2">Contato</h3>
            <Entrada
              rotulo="Nome do contato"
              obrigatorio
              autoComplete="off"
              value={f.nome}
              onChange={(e) => muda("nome", e.target.value)}
              erro={erros.nome}
              className="sm:col-span-2"
              autoFocus={!edicao}
            />
            <Entrada
              rotulo="Organização"
              placeholder={ehGov ? "Ex.: Secretaria Municipal de Educação" : "Federação, academia, evento…"}
              value={f.organizacao}
              onChange={(e) => muda("organizacao", e.target.value)}
              className="sm:col-span-2"
            />
            <Entrada
              rotulo="Telefone / WhatsApp"
              type="tel"
              inputMode="tel"
              placeholder="(48) 99999-9999"
              value={f.telefone}
              onChange={(e) => muda("telefone", e.target.value)}
              erro={erros.telefone}
            />
            <Entrada
              rotulo="E-mail"
              type="email"
              inputMode="email"
              value={f.email}
              onChange={(e) => muda("email", e.target.value)}
              erro={erros.email}
            />
            <Selecao
              rotulo="Tipo"
              obrigatorio
              vazio="Selecione"
              opcoes={TIPOS}
              value={f.tipo}
              onChange={(e) => muda("tipo", e.target.value as TipoLead)}
              erro={erros.tipo}
            />
            <Selecao
              rotulo="Origem"
              obrigatorio
              vazio="Selecione"
              opcoes={ORIGENS_OPCOES}
              value={f.origem}
              onChange={(e) => muda("origem", e.target.value as Origem)}
              erro={erros.origem}
            />
            <Entrada
              rotulo="Município"
              autoComplete="address-level2"
              value={f.municipio}
              onChange={(e) => muda("municipio", e.target.value)}
            />
            <Selecao
              rotulo="UF"
              vazio="Selecione"
              opcoes={UFS.map((u) => ({ valor: u, rotulo: u }))}
              value={f.uf}
              onChange={(e) => muda("uf", e.target.value)}
              erro={erros.uf}
            />
          </section>

          {/* Negócio */}
          <section className="flex flex-col gap-4 border-t border-borda pt-6">
            <h3 className="font-titulo text-xs text-apoio">Negócio</h3>
            <Opcoes
              rotulo="Produto"
              nome="produto"
              obrigatorio
              valor={f.produtoId}
              aoMudar={(v) => muda("produtoId", v)}
              opcoes={(produtos ?? []).map((p) => ({ valor: p.id, rotulo: curto(p.nome), cor: p.cor }))}
              erro={erros.produto_id}
            />
            <Opcoes
              rotulo="Etapa"
              nome="etapa"
              valor={f.etapa}
              aoMudar={(v) => muda("etapa", v)}
              opcoes={edicao ? ETAPAS_EDICAO : ETAPAS}
              erro={erros.etapa}
            />
            <div className="grid gap-4 sm:grid-cols-3">
              <Entrada
                rotulo="Implantação"
                prefixo="R$"
                inputMode="decimal"
                placeholder="0,00"
                value={f.implantacao}
                onChange={(e) => muda("implantacao", e.target.value)}
                erro={erros.valor_implantacao}
              />
              <Entrada
                rotulo="Mensalidade"
                prefixo="R$"
                inputMode="decimal"
                placeholder="0,00"
                value={f.mensal}
                onChange={(e) => muda("mensal", e.target.value)}
                erro={erros.valor_mensal}
              />
              <Entrada
                rotulo="Avulso"
                prefixo="R$"
                inputMode="decimal"
                placeholder="0,00"
                value={f.avulso}
                onChange={(e) => muda("avulso", e.target.value)}
                erro={erros.valor_avulso}
              />
            </div>
            <p className="text-sm text-apoio" aria-live="polite">
              Valor do negócio:{" "}
              <strong className="num font-titulo text-base text-tatame">{total != null ? moeda(total) : "—"}</strong>
              <span className="block text-xs">implantação + 12 × mensalidade + avulso</span>
            </p>
          </section>

          {/* GovEscolar */}
          {ehGov && (
            <section className="grid gap-4 border-t border-borda pt-6 sm:grid-cols-2">
              <h3 className="flex items-center gap-2 font-titulo text-xs text-apoio sm:col-span-2">
                <span aria-hidden className="size-2.5" style={{ background: govEscolar.cor }} />
                GovEscolar
              </h3>
              <Selecao
                rotulo="Cargo do contato"
                vazio="Selecione"
                opcoes={CARGOS_OPCOES}
                value={f.cargo}
                onChange={(e) => muda("cargo", e.target.value as Cargo)}
                erro={erros.cargo_contato}
                className="sm:col-span-2"
              />
              <Opcoes
                rotulo="Rede de ensino"
                nome="rede"
                valor={f.rede}
                aoMudar={(v) => muda("rede", v)}
                opcoes={REDES_OPCOES}
                erro={erros.rede_ensino}
                className="sm:col-span-2"
              />
              <Entrada
                rotulo="Nº de escolas"
                type="number"
                inputMode="numeric"
                min={0}
                value={f.qtdEscolas}
                onChange={(e) => muda("qtdEscolas", e.target.value)}
                erro={erros.qtd_escolas}
              />
              <Entrada
                rotulo="Nº de alunos"
                type="number"
                inputMode="numeric"
                min={0}
                value={f.qtdAlunos}
                onChange={(e) => muda("qtdAlunos", e.target.value)}
                erro={erros.qtd_alunos}
              />
            </section>
          )}

          <AreaTexto
            rotulo="Observações"
            value={f.observacoes}
            onChange={(e) => muda("observacoes", e.target.value)}
            className="border-t border-borda pt-6"
          />

          {(erroGeral || Object.values(erros).some(Boolean)) && (
            <p role="alert" className="border-l-2 border-alerta pl-3 text-sm text-alerta">
              {erroGeral ? salvar.error?.message : "Confira os campos destacados."}
            </p>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-borda pt-6 sm:flex-row sm:justify-end">
            <Button type="button" variant="fantasma" onClick={() => aoMudar(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={salvar.isPending}>
              {salvar.isPending ? "Salvando…" : edicao ? "Salvar alterações" : "Salvar lead"}
            </Button>
          </div>
        </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
