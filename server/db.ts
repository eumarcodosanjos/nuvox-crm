/**
 * Acesso ao banco, na ordem:
 * 1. Produção (Cloudflare Worker): binding D1 direto, sem token.
 * 2. Desenvolvimento com DB_LOCAL: SQLite local (node:sqlite), veja `npm run db:local`.
 * 3. Desenvolvimento contra o D1 real: API HTTP da Cloudflare (CLOUDFLARE_*).
 */
import { bindingD1, variavel } from "./config.js";

export type Linha = Record<string, unknown>;
export type Parametro = string | number | null;

export class ErroBanco extends Error {}

export async function consultar<T = Linha>(sql: string, params: Parametro[] = []): Promise<T[]> {
  const d1 = bindingD1();
  if (d1) return (await d1.prepare(sql).bind(...params).all<T>()).results;
  if (variavel("DB_LOCAL")) return consultarLocal<T>(sql, params);
  return consultarD1Http<T>(sql, params);
}

async function consultarD1Http<T>(sql: string, params: Parametro[]): Promise<T[]> {
  const conta = variavel("CLOUDFLARE_ACCOUNT_ID");
  const banco = variavel("CLOUDFLARE_D1_DATABASE_ID");
  const token = variavel("CLOUDFLARE_API_TOKEN");
  if (!conta || !banco || !token) {
    throw new ErroBanco(
      "Banco não configurado: defina CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_D1_DATABASE_ID e CLOUDFLARE_API_TOKEN.",
    );
  }

  const resp = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${conta}/d1/database/${banco}/query`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      // A API HTTP do D1 documenta params como texto; a afinidade de tipo do
      // SQLite converte de volta para INTEGER nas colunas numéricas.
      body: JSON.stringify({ sql, params: params.map((p) => (p == null ? null : String(p))) }),
    },
  );
  const corpo = (await resp.json().catch(() => null)) as
    | { success: boolean; errors?: { message: string }[]; result?: { results: T[] }[] }
    | null;

  if (!resp.ok || !corpo?.success) {
    const msg = corpo?.errors?.map((e) => e.message).join("; ") || `HTTP ${resp.status}`;
    throw new ErroBanco(`Erro no D1: ${msg}`);
  }
  return corpo.result?.[0]?.results ?? [];
}

// ── SQLite local (apenas desenvolvimento) ─────────────────────────
type BancoLocal = {
  prepare(sql: string): { all(...p: Parametro[]): unknown[]; run(...p: Parametro[]): unknown };
};
let local: BancoLocal | null = null;

async function consultarLocal<T>(sql: string, params: Parametro[]): Promise<T[]> {
  if (!local) {
    // Caminho em variável para o bundler do Worker não tentar incluir node:sqlite.
    const modulo = "node:sqlite";
    const { DatabaseSync } = (await import(/* @vite-ignore */ modulo)) as typeof import("node:sqlite");
    local = new DatabaseSync(variavel("DB_LOCAL")!) as unknown as BancoLocal;
  }
  const stmt = local.prepare(sql);
  const retornaLinhas = /^\s*(select|with)\b/i.test(sql) || /\breturning\b/i.test(sql);
  const linhas = retornaLinhas ? stmt.all(...params) : (stmt.run(...params), []);
  // node:sqlite devolve objetos sem protótipo; normaliza para objetos comuns
  return (linhas as object[]).map((l) => ({ ...l })) as T[];
}
