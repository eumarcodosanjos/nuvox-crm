/**
 * Listas de opções dos formulários (fonte única: usadas pela API para validar e pela tela).
 */
import type { Cargo, Origem, RedeEnsino, TipoLead } from "./tipos";

export const TIPOS: { valor: TipoLead; rotulo: string }[] = [
  { valor: "federacao", rotulo: "Federação / Liga" },
  { valor: "academia", rotulo: "Academia / Dojô" },
  { valor: "organizador_evento", rotulo: "Organizador de evento" },
  { valor: "prefeitura", rotulo: "Prefeitura" },
  { valor: "secretaria_educacao", rotulo: "Secretaria de Educação" },
  { valor: "escola", rotulo: "Escola" },
  { valor: "outro", rotulo: "Outro" },
];

export const ORIGENS_OPCOES: { valor: Origem; rotulo: string }[] = [
  { valor: "whatsapp", rotulo: "WhatsApp" },
  { valor: "instagram", rotulo: "Instagram" },
  { valor: "indicacao", rotulo: "Indicação" },
  { valor: "site", rotulo: "Site" },
  { valor: "outro", rotulo: "Outro" },
];

export const CARGOS_OPCOES: { valor: Cargo; rotulo: string }[] = [
  { valor: "secretario_educacao", rotulo: "Secretário(a) de Educação" },
  { valor: "diretor", rotulo: "Diretor(a)" },
  { valor: "coordenador", rotulo: "Coordenador(a)" },
  { valor: "gestor_ti", rotulo: "Gestor(a) de TI" },
  { valor: "outro", rotulo: "Outro" },
];

export const REDES_OPCOES: { valor: RedeEnsino; rotulo: string }[] = [
  { valor: "municipal", rotulo: "Municipal" },
  { valor: "estadual", rotulo: "Estadual" },
  { valor: "particular", rotulo: "Particular" },
];

export const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA",
  "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;

/** Produto que mostra os campos de secretaria/escola. */
export const NOME_GOVESCOLAR = "GovEscolar";
