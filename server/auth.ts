/**
 * Autenticação simples para uso interno:
 * - senha com PBKDF2-SHA256 (100 mil iterações — limite do Workers —, sal aleatório);
 * - sessão em cookie HttpOnly assinado com HMAC-SHA256 (SESSION_SECRET).
 */
import { Buffer } from "node:buffer";
import type { Sessao } from "../src/lib/tipos.js";
import { variavel } from "./config.js";

// 100 mil é o máximo aceito pelo WebCrypto do Cloudflare Workers.
const ITERACOES = 100_000;
const COOKIE = "nuvox_sessao";
const DURACAO_S = 60 * 60 * 24 * 7; // 7 dias

const enc = new TextEncoder();
const b64 = (b: ArrayBuffer | Uint8Array) => Buffer.from(b as ArrayBuffer).toString("base64url");
const deB64 = (s: string) => new Uint8Array(Buffer.from(s, "base64url"));

async function pbkdf2(senha: string, sal: Uint8Array, iteracoes: number) {
  const chave = await crypto.subtle.importKey("raw", enc.encode(senha), "PBKDF2", false, ["deriveBits"]);
  return crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: sal as BufferSource, iterations: iteracoes },
    chave,
    256,
  );
}

export async function gerarHashSenha(senha: string): Promise<string> {
  const sal = crypto.getRandomValues(new Uint8Array(16));
  return `pbkdf2$${ITERACOES}$${b64(sal)}$${b64(await pbkdf2(senha, sal, ITERACOES))}`;
}

export async function conferirSenha(senha: string, armazenado: string): Promise<boolean> {
  const [alg, iter, sal, hash] = armazenado.split("$");
  if (alg !== "pbkdf2" || !iter || !sal || !hash) return false;
  const calculado = new Uint8Array(await pbkdf2(senha, deB64(sal), Number(iter)));
  return iguais(calculado, deB64(hash));
}

/** Comparação em tempo constante. */
function iguais(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  let dif = 0;
  for (let i = 0; i < a.length; i++) dif |= (a[i] ?? 0) ^ (b[i] ?? 0);
  return dif === 0;
}

async function chaveHmac() {
  const segredo = variavel("SESSION_SECRET");
  if (!segredo || segredo.length < 32) {
    throw new Error("SESSION_SECRET ausente ou curto (mínimo 32 caracteres).");
  }
  return crypto.subtle.importKey("raw", enc.encode(segredo), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
}

export async function criarCookieSessao(s: Sessao, https: boolean): Promise<string> {
  const corpo = b64(enc.encode(JSON.stringify({ ...s, exp: Math.floor(Date.now() / 1000) + DURACAO_S })));
  const assinatura = b64(await crypto.subtle.sign("HMAC", await chaveHmac(), enc.encode(corpo)));
  return `${COOKIE}=${corpo}.${assinatura}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${DURACAO_S}${https ? "; Secure" : ""}`;
}

export function cookieSaida(https: boolean): string {
  return `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${https ? "; Secure" : ""}`;
}

export async function lerSessao(req: Request): Promise<Sessao | null> {
  const bruto = req.headers
    .get("cookie")
    ?.split(/;\s*/)
    .find((c) => c.startsWith(`${COOKIE}=`))
    ?.slice(COOKIE.length + 1);
  if (!bruto) return null;
  const [corpo, assinatura] = bruto.split(".");
  if (!corpo || !assinatura) return null;
  const ok = await crypto.subtle.verify(
    "HMAC",
    await chaveHmac(),
    deB64(assinatura) as BufferSource,
    enc.encode(corpo),
  );
  if (!ok) return null;
  try {
    const dados = JSON.parse(Buffer.from(corpo, "base64url").toString()) as Sessao & { exp: number };
    if (dados.exp < Date.now() / 1000) return null;
    return { id: dados.id, nome: dados.nome, email: dados.email };
  } catch {
    return null;
  }
}
