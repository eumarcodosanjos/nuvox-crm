import { variavel } from "./config.js";
import { consultar } from "./db.js";

const json = (dados: unknown, status = 200) => Response.json(dados, { status, headers: { "Cache-Control": "no-store" } });
const erro = (mensagem: string, status: number) => json({ erro: mensagem }, status);
const encoder = new TextEncoder();
const origemValida = /^(?:kime-[a-f0-9-]{36}|google-[a-zA-Z0-9_-]{1,1024})$/;
const meetValido = /^https:\/\/meet\.google\.com\/[a-z0-9-]+$/i;

async function chave(segredo: string) {
  return crypto.subtle.importKey("raw", encoder.encode(segredo), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

function hex(valores: Uint8Array) {
  return Array.from(valores, byte => byte.toString(16).padStart(2, "0")).join("");
}

async function tokenDeLeitura(segredo: string, id: number) {
  const dados = `crm-reunioes:${id}:${Date.now() + 5 * 60_000}`;
  const assinatura = await crypto.subtle.sign("HMAC", await chave(segredo), encoder.encode(dados));
  return dados.slice("crm-reunioes:".length) + ":" + hex(new Uint8Array(assinatura));
}

async function leituraAutorizada(segredo: string, token: string, id: number) {
  const partes = /^(\d{1,15}):(\d{13}):([0-9a-f]{64})$/.exec(token);
  if (!partes || Number(partes[1]) !== id || Number(partes[2]) <= Date.now()) return false;
  const assinatura = Uint8Array.from(partes[3].match(/../g)!, byte => parseInt(byte, 16));
  return crypto.subtle.verify("HMAC", await chave(segredo), assinatura, encoder.encode(`crm-reunioes:${partes[1]}:${partes[2]}`));
}

async function autorizacaoServidor(segredo: string, token: string) {
  if (token.length !== segredo.length) return false;
  const key = await chave(segredo);
  const dados = encoder.encode("kime-crm-servico");
  const assinatura = await crypto.subtle.sign("HMAC", key, dados);
  return crypto.subtle.verify("HMAC", await chave(token), assinatura, dados);
}

export async function tratarKime(req: Request, rota: string): Promise<Response> {
  const segredo = variavel("KIME_CRM_SECRET");
  if (!segredo) return erro("Integração com o Kime indisponível.", 503);
  const token = req.headers.get("Authorization")?.match(/^Bearer (\S{1,256})$/)?.[1] ?? "";
  const ficha = /^integracoes\/kime\/negocios\/(\d{1,15})\/reunioes$/.exec(rota);
  if (ficha && req.method === "GET") {
    const id = Number(ficha[1]);
    if (!await leituraAutorizada(segredo, token, id)) return erro("Abra as reuniões pelo Kime para renovar o acesso.", 401);
    const [negocio] = await consultar("SELECT l.nome, p.nome AS produto FROM negocios n JOIN leads l ON l.id=n.lead_id JOIN produtos p ON p.id=n.produto_id WHERE n.id=?", [id]);
    if (!negocio) return erro("Negócio não encontrado.", 404);
    const reunioes = await consultar("SELECT origem_id AS id, titulo, dia, hora, link_meet AS meet FROM reunioes_kime WHERE negocio_id=? ORDER BY dia DESC, hora DESC LIMIT 50", [id]);
    return json({ negocio, reunioes });
  }

  if (!await autorizacaoServidor(segredo, token)) return erro("Acesso à integração não autorizado.", 401);
  if (rota === "integracoes/kime/negocios" && req.method === "GET") {
    const opcoes = await consultar("SELECT n.id, l.nome, l.organizacao, p.nome AS produto FROM negocios n JOIN leads l ON l.id=n.lead_id JOIN produtos p ON p.id=n.produto_id ORDER BY l.nome COLLATE NOCASE, n.id");
    return json({ opcoes });
  }
  if (ficha && req.method === "POST") return json({ token: await tokenDeLeitura(segredo, Number(ficha[1])) });

  const prefixo = "integracoes/kime/reunioes/";
  const origem = rota.startsWith(prefixo) ? rota.slice(prefixo.length) : "";
  if (!origemValida.test(origem)) return erro("Reunião não encontrada.", 404);
  if (req.method === "GET") {
    const [reuniao] = await consultar("SELECT negocio_id AS negocioId FROM reunioes_kime WHERE origem_id=?", [origem]);
    return json({ reuniao: reuniao ?? null });
  }
  if (req.method !== "PUT") return erro("Rota não encontrada.", 404);

  const dados = await req.json().catch(() => null) as Record<string, unknown> | null;
  if (!dados) return erro("Informe os dados da reunião.", 400);
  const { negocioId, titulo, dia, hora, meet, versao, atualizar } = dados;
  if (typeof negocioId !== "number" || !Number.isSafeInteger(negocioId) || negocioId < 1 ||
      typeof titulo !== "string" || !titulo.trim() || titulo.length > 250 ||
      typeof dia !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dia) ||
      typeof versao !== "number" || !Number.isSafeInteger(versao) || versao < 0 ||
      (hora !== null && (typeof hora !== "string" || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(hora))) ||
      (meet !== null && (typeof meet !== "string" || !meetValido.test(meet)))) {
    return erro("Dados da reunião inválidos.", 400);
  }
  const parametros = [titulo.trim(), dia, hora, meet, versao, origem, negocioId];
  if (atualizar === true) {
    const [alterada] = await consultar("UPDATE reunioes_kime SET titulo=?,dia=?,hora=?,link_meet=?,versao=? WHERE origem_id=? AND negocio_id=? AND versao<=? RETURNING origem_id",
      [...parametros, versao]);
    if (!alterada) return erro("Vínculo alterado ou desatualizado.", 409);
  } else {
    const [negocio] = await consultar("SELECT id FROM negocios WHERE id=?", [negocioId]);
    if (!negocio) return erro("Negócio não encontrado.", 404);
    const [alterada] = await consultar(`INSERT INTO reunioes_kime (titulo,dia,hora,link_meet,versao,origem_id,negocio_id) VALUES (?,?,?,?,?,?,?)
      ON CONFLICT(origem_id) DO UPDATE SET negocio_id=excluded.negocio_id,titulo=excluded.titulo,dia=excluded.dia,
      hora=excluded.hora,link_meet=excluded.link_meet,versao=excluded.versao
      WHERE reunioes_kime.versao<=excluded.versao RETURNING origem_id`, parametros);
    if (!alterada) return erro("Vínculo desatualizado.", 409);
  }
  return json({ negocioId });
}
