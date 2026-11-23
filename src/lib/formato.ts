import type { Canal, Etapa, Origem, Periodo } from "./tipos";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const pct = new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 0 });
const hora = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo",
});

/** Centavos → "R$ 1.234,56". */
export const moeda = (centavos: number) => brl.format(centavos / 100);

export const percentual = (fracao: number) => pct.format(fracao);

export const horario = (iso: string) => hora.format(new Date(iso));

export function saudacao(agora = new Date()): string {
  const h = Number(
    new Intl.DateTimeFormat("pt-BR", { hour: "numeric", hour12: false, timeZone: "America/Sao_Paulo" }).format(agora),
  );
  if (h >= 5 && h < 12) return "Bom dia";
  if (h >= 12 && h < 18) return "Boa tarde";
  return "Boa noite";
}

export const primeiroNome = (nome: string) => nome.trim().split(/\s+/)[0] ?? nome;

export const ROTULO_ETAPA: Record<Etapa, string> = {
  novo: "Novo",
  contato: "Contato",
  proposta: "Proposta",
  negociacao: "Negociação",
  fechado: "Fechado",
  perdido: "Perdido",
};

export const ROTULO_ORIGEM: Record<Origem, string> = {
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  indicacao: "Indicação",
  site: "Site",
  outro: "Outro",
};

export const ROTULO_CANAL: Record<Canal, string> = {
  whatsapp: "WhatsApp",
  email: "E-mail",
  video: "Vídeo",
  ligacao: "Ligação",
  financeiro: "Financeiro",
};

export const PERIODOS: { valor: Periodo; rotulo: string; titulo: string }[] = [
  { valor: "hoje", rotulo: "Hoje", titulo: "hoje" },
  { valor: "semana", rotulo: "Semana", titulo: "na semana" },
  { valor: "mes", rotulo: "Mês", titulo: "no mês" },
  { valor: "ano", rotulo: "Ano", titulo: "no ano" },
];

export const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;
