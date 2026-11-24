/** Cliente HTTP da API do Nuvox CRM (mesma origem, cookie de sessão). */

export class ErroApi extends Error {
  constructor(
    message: string,
    public status: number,
    /** Erros por campo (validação do servidor, status 422). */
    public campos: Record<string, string> = {},
  ) {
    super(message);
  }
}

/** Avisa a tela (aviso "Sem internet") quando a conexão com o servidor cai ou volta. */
export const EVENTO_CONEXAO = "nuvox:conexao";
const avisarConexao = (online: boolean) =>
  window.dispatchEvent(new CustomEvent<boolean>(EVENTO_CONEXAO, { detail: online }));

export async function api<T>(caminho: string, init?: RequestInit): Promise<T> {
  let resp: Response;
  try {
    resp = await fetch(`/api/${caminho}`, {
      credentials: "same-origin",
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    avisarConexao(false);
    throw new ErroApi("Sem conexão com o servidor.", 0);
  }
  avisarConexao(true);
  const corpo = (await resp.json().catch(() => null)) as (T & { erro?: string; campos?: Record<string, string> }) | null;
  if (!resp.ok) throw new ErroApi(corpo?.erro ?? `Erro ${resp.status}`, resp.status, corpo?.campos);
  return corpo as T;
}
