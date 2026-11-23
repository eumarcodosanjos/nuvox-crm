/**
 * Dono do CRM (uso pessoal, sem login por enquanto).
 * Troque o nome por VITE_NOME_USUARIO no .env / nas variáveis da Vercel, se quiser.
 */
export const USUARIO = {
  nome: (import.meta.env.VITE_NOME_USUARIO as string | undefined) || "Marco",
  cargo: "Fundador · Nuvox",
};
