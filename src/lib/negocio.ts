/**
 * Regra de valor de um negócio — ÚNICO lugar onde ela existe.
 * Usada pela API (KPIs, funil, pipeline por produto, propostas) e pode ser
 * usada pelo front. Ajuste aqui e tudo acompanha.
 *
 * Valores em centavos.
 */
export interface ValoresNegocio {
  valor_implantacao: number;
  valor_mensal: number;
  valor_avulso: number;
}

/** Meses de mensalidade considerados no valor do negócio. */
export const MESES_CONTRATO = 12;

export function valorNegocio(n: ValoresNegocio): number {
  return n.valor_implantacao + n.valor_mensal * MESES_CONTRATO + n.valor_avulso;
}
