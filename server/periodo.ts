/**
 * Intervalos de tempo no fuso de São Paulo.
 * O Brasil não tem horário de verão desde 2019, então o deslocamento é fixo (UTC−3).
 * Todos os intervalos são [inicio, fim) em ISO-8601 UTC, comparáveis como texto.
 */
import type { Periodo } from "../src/lib/tipos.js";

const OFFSET_H = 3;
const DIA = 86_400_000;

/** Data de hoje em São Paulo, em partes. */
function hojeSP(agora = new Date()) {
  const sp = new Date(agora.getTime() - OFFSET_H * 3_600_000);
  return { ano: sp.getUTCFullYear(), mes: sp.getUTCMonth(), dia: sp.getUTCDate(), semana: sp.getUTCDay() };
}

/** Meia-noite de São Paulo, em UTC. */
function meiaNoiteSP(ano: number, mes: number, dia: number) {
  return new Date(Date.UTC(ano, mes, dia, OFFSET_H));
}

export function intervalo(periodo: Periodo, agora = new Date()): { inicio: string; fim: string } {
  const { ano, mes, dia, semana } = hojeSP(agora);
  let inicio: Date;
  let fim: Date;
  switch (periodo) {
    case "hoje":
      inicio = meiaNoiteSP(ano, mes, dia);
      fim = new Date(inicio.getTime() + DIA);
      break;
    case "semana": {
      const desdeSegunda = (semana + 6) % 7; // a semana começa na segunda
      inicio = meiaNoiteSP(ano, mes, dia - desdeSegunda);
      fim = new Date(inicio.getTime() + 7 * DIA);
      break;
    }
    case "ano":
      inicio = meiaNoiteSP(ano, 0, 1);
      fim = meiaNoiteSP(ano + 1, 0, 1);
      break;
    case "mes":
    default:
      inicio = meiaNoiteSP(ano, mes, 1);
      fim = meiaNoiteSP(ano, mes + 1, 1);
  }
  return { inicio: inicio.toISOString(), fim: fim.toISOString() };
}

/** 'YYYY-MM-DD' de hoje em São Paulo. */
export function dataHojeSP(agora = new Date()): string {
  const { ano, mes, dia } = hojeSP(agora);
  return new Date(Date.UTC(ano, mes, dia)).toISOString().slice(0, 10);
}

/** 'YYYY-MM-01' do mês corrente em São Paulo (chave da tabela metas). */
export function primeiroDiaDoMesSP(agora = new Date()): string {
  return dataHojeSP(agora).slice(0, 8) + "01";
}

export function periodoValido(p: string | null): Periodo {
  return p === "hoje" || p === "semana" || p === "ano" ? p : "mes";
}
