// Cria (ou recria) um banco SQLite local com as migrations + seed de TESTE.
// Uso: npm run db:local   →   depois coloque DB_LOCAL=.dev-db/nuvox.sqlite no .env
import { DatabaseSync } from "node:sqlite";
import { mkdirSync, readFileSync, readdirSync, rmSync } from "node:fs";

const caminho = process.argv[2] ?? ".dev-db/nuvox.sqlite";
mkdirSync(".dev-db", { recursive: true });
rmSync(caminho, { force: true });

const db = new DatabaseSync(caminho);
db.exec("PRAGMA foreign_keys = ON;");
for (const f of readdirSync("drizzle").filter((f) => f.endsWith(".sql")).sort()) {
  db.exec(readFileSync(`drizzle/${f}`, "utf8").replaceAll("--> statement-breakpoint", ""));
  console.log("migration:", f);
}
db.exec(readFileSync("db/seed.sql", "utf8"));
for (const t of ["leads", "negocios", "propostas", "tarefas", "licencas", "metas"]) {
  console.log(t.padEnd(10), db.prepare(`select count(*) as n from ${t}`).get().n);
}
console.log(`\nBanco local pronto em ${caminho} (dados de TESTE).`);
