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

const diaMes = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "America/Sao_Paulo" });
const diaSP = (d: Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(d); // YYYY-MM-DD

/** "Hoje 14:00", "Amanhã 09:30", "Atrasada · 20/11" ou "25/11 10:00" (fuso de São Paulo). */
export function quando(iso: string, agora = new Date()): string {
  const data = new Date(iso);
  const dia = diaSP(data);
  const hoje = diaSP(agora);
  const amanha = diaSP(new Date(agora.getTime() + 86_400_000));
  if (dia === hoje) return `Hoje ${horario(iso)}`;
  if (dia === amanha) return `Amanhã ${horario(iso)}`;
  if (dia < hoje) return `Atrasada · ${diaMes.format(data)}`;
  return `${diaMes.format(data)} ${horario(iso)}`;
}

/** Compara textos ignorando maiúsculas e acentos (busca). */
export const normalizar = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

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

/** "1.234,56" / "1234,5" / "R$ 80" → centavos. Vazio → 0. Inválido → NaN. */
export function lerMoeda(texto: string): number {
  const limpo = texto.replace(/[R$\s.]/g, "").replace(",", ".");
  if (!limpo) return 0;
  const n = Number(limpo);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : NaN;
}
