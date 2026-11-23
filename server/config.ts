/**
 * Configuração do servidor, igual para os dois ambientes:
 * - Cloudflare Worker (produção): vem do `env` do Worker (binding DB + secrets);
 * - Node (npm run dev): vem do process.env (.env).
 */

/** Subconjunto da API do binding D1 que usamos. */
export interface D1Like {
  prepare(sql: string): {
    bind(...valores: unknown[]): { all<T>(): Promise<{ results: T[] }> };
  };
}

let ambiente: Record<string, unknown> = {};

export function definirAmbiente(env: Record<string, unknown>) {
  ambiente = env;
}

export function variavel(nome: string): string | undefined {
  const doWorker = ambiente[nome];
  if (typeof doWorker === "string") return doWorker;
  return (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env[nome];
}

export function bindingD1(): D1Like | undefined {
  return ambiente.DB as D1Like | undefined;
}
