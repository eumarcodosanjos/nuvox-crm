/**
 * Cria (ou troca a senha de) um usuário do Nuvox CRM.
 *
 *   npm run usuario:criar
 *
 * Usa o banco configurado no .env: o D1 (CLOUDFLARE_*) ou o SQLite local (DB_LOCAL).
 * A senha é digitada no terminal e nunca é exibida nem salva em arquivo.
 */
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { gerarHashSenha } from "../server/auth.js";
import { consultar } from "../server/db.js";

try {
  process.loadEnvFile(".env");
} catch {
  // sem .env: usa as variáveis do ambiente
}

const rl = createInterface({ input: stdin, output: stdout, terminal: stdin.isTTY });
const linhas = rl[Symbol.asyncIterator]();
const escrita = rl as unknown as { _writeToOutput: (s: string) => void };
const escreverOriginal = escrita._writeToOutput;

async function perguntar(texto: string, oculto = false): Promise<string> {
  stdout.write(texto);
  if (oculto && stdin.isTTY) escrita._writeToOutput = () => {}; // não mostra a senha
  const { value } = await linhas.next();
  escrita._writeToOutput = escreverOriginal;
  if (oculto) stdout.write("\n");
  return String(value ?? "");
}

const nome = (await perguntar("Nome (aparece na saudação): ")).trim();
const email = (await perguntar("E-mail: ")).trim().toLowerCase();
const senha = await perguntar("Senha (mín. 10 caracteres): ", true);
rl.close();

if (!nome || !email.includes("@")) {
  console.error("Nome e e-mail válidos são obrigatórios.");
  process.exit(1);
}
if (senha.length < 10) {
  console.error("A senha precisa ter pelo menos 10 caracteres.");
  process.exit(1);
}

await consultar(
  `INSERT INTO usuarios (nome, email, senha_hash) VALUES (?, ?, ?)
   ON CONFLICT(email) DO UPDATE SET nome = excluded.nome, senha_hash = excluded.senha_hash`,
  [nome, email, await gerarHashSenha(senha)],
);
console.log(`Usuário ${email} pronto em ${process.env.DB_LOCAL ? `SQLite local (${process.env.DB_LOCAL})` : "Cloudflare D1"}.`);
