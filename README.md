# Nuvox CRM

CRM comercial da Nuvox: software para federações esportivas e academias de artes marciais.
Identidade visual **"Ascensão"**: toda venda é uma subida.

```
Navegador ──► Vercel (site React) ──/api/*──► Cloudflare Worker (API) ──binding──► D1
```

> **Branch `api-worker`:** a API roda num Cloudflare Worker com acesso direto ao D1 (sem token
> em tempo de execução). A Vercel só serve o site e repassa `/api/*` para o Worker; nenhum segredo
> fica na Vercel. Para publicar:
>
> 1. `npx wrangler deploy` (pede login na Cloudflare)
> 2. `openssl rand -hex 32 | npx wrangler secret put SESSION_SECRET`
> 3. Troque `SUBDOMINIO` no `vercel.json` pela URL que o deploy mostrar e publique na Vercel.

- **Front:** React 19, Vite, TypeScript, Tailwind CSS 3, shadcn/ui (radius 0), TanStack Query, lucide-react
- **API:** Cloudflare Worker (`worker/index.ts`) com o roteador em `server/rotas.ts`; no `npm run dev` o mesmo roteador roda dentro do Vite
- **Banco:** Cloudflare D1 (SQLite). Schema em Drizzle (`db/schema.ts`), migrations em `drizzle/`
- **Login:** tabela `usuarios` (senha PBKDF2) + cookie HttpOnly assinado. Toda rota `/api` exige sessão.

## Rodar localmente (sem Cloudflare)

```bash
npm install
```

```bash
cp .env.example .env
```

No `.env`, preencha `SESSION_SECRET` (gere com `openssl rand -hex 32`) e descomente `DB_LOCAL=.dev-db/nuvox.sqlite`. Depois:

```bash
npm run db:local
```

```bash
npm run usuario:criar
```

```bash
npm run dev
```

Abra http://localhost:5173. O `db:local` cria um SQLite com as migrations e o **seed de teste**.

## Rodar localmente contra o D1 real

No `.env`, deixe `DB_LOCAL` comentado e preencha as variáveis `CLOUDFLARE_*` (veja abaixo).

## Deploy na Vercel

1. Em [vercel.com/new](https://vercel.com/new), importe o repositório `nuvox-crm`. O framework (Vite) é detectado sozinho.
2. Em **Settings → Environment Variables**, cadastre:

| Variável | Valor |
|---|---|
| `CLOUDFLARE_ACCOUNT_ID` | ID da sua conta Cloudflare (painel → Workers & Pages, na lateral direita) |
| `CLOUDFLARE_D1_DATABASE_ID` | `471c6694-d9d6-44a6-9bce-ec488bc355f6` (banco `nuvox-crm`) |
| `CLOUDFLARE_API_TOKEN` | Token com permissão **Account → D1 → Edit** (veja abaixo) |
| `SESSION_SECRET` | 64 caracteres aleatórios: `openssl rand -hex 32` |

3. Faça o deploy. Cada push na `main` publica de novo.

A função roda em `iad1` (Washington), perto do D1 (leste dos EUA), para as consultas serem rápidas.

### Criar o token da Cloudflare

Painel da Cloudflare → **My Profile → API Tokens → Create Token → Create Custom Token**:
- Permissions: **Account · D1 · Edit**
- Account Resources: só a sua conta

Esse token fica **só na Vercel** (e no seu `.env` local). Nunca vai para o navegador nem para o git.

### Criar seu usuário no banco de produção

Com o `.env` apontando para o D1 (`CLOUDFLARE_*` preenchidas e `DB_LOCAL` comentado):

```bash
npm run usuario:criar
```

Rodar de novo com o mesmo e-mail troca a senha.

## Banco de dados

| Tabela | Para quê |
|---|---|
| `produtos` | Nuvox Federações, Combat e Academia, com o modelo de cobrança |
| `leads` | Contatos (`tipo` e `origem` validados por CHECK) |
| `negocios` | Oportunidades por etapa: novo → contato → proposta → negociacao → fechado / perdido |
| `propostas` | `vence_em` é **coluna gerada** (`enviada_em + validade_dias`) |
| `tarefas` | Agenda do comercial; `negocio_id` é opcional |
| `licencas` | Clientes com mensalidade (receita recorrente) |
| `metas` | Meta de fechamento por mês (`mes` = primeiro dia do mês) |
| `usuarios` | Acesso ao CRM |

- **Dinheiro em centavos** (INTEGER). O front formata com `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`.
- **Datas com hora** em ISO-8601 UTC. Os períodos (Hoje, Semana, Mês, Ano) são calculados no fuso de São Paulo, com a semana começando na segunda.
- **Tipos TypeScript** derivados do schema em `src/lib/tipos.ts`.

### Mudar o schema

```bash
npm run db:gerar
```

```bash
npx wrangler d1 migrations apply nuvox-crm --remote
```

(O `wrangler` pede login na Cloudflare na primeira vez. As migrations `0000` e `0001` já estão aplicadas e registradas.)

### Dados de teste

`db/seed.sql` cria leads, negócios, propostas, tarefas, licenças e a meta do mês. **Todo lead e toda tarefa de teste começam com `[TESTE]`.** As datas são relativas ao dia em que o seed roda. O bloco **LIMPEZA**, no topo do arquivo, apaga tudo que o seed criou.

## Regras de negócio

- **Valor de um negócio:** `valorNegocio()` em `src/lib/negocio.ts` = implantação + mensal × 12 + avulso. É o **único** lugar com essa regra; a API inteira usa essa função.
- **Receita recorrente:** soma de `licencas.valor_mensal` com `ativa = 1`.
- **Pipeline aberto:** negócios em novo, contato, proposta ou negociação.
- **Fechado no período / Implantações:** negócios com `fechado_em` dentro do período escolhido.
- **Barra de meta:** sempre a meta do **mês corrente** contra o fechado no mês, em 5 degraus de 20%.
- **Funil:** as etapas abertas mostram a foto atual; "Fechado" mostra os fechados no período. Conversão, ciclo médio e ticket médio usam o histórico completo.

## Estrutura

```
api/index.ts            função da Vercel (entrada única da API)
server/                 roteador, consultas, sessão, acesso ao D1
db/schema.ts            schema Drizzle (fonte da verdade)
db/seed.sql             dados de TESTE
drizzle/                migrations SQL
scripts/                db-local, criar-usuario
src/components/         marca, layout, ui (shadcn) e dashboard
src/hooks/              useDashboardKpis, useFunil, usePropostasVencendo, useTarefasHoje, useOrigemLeads, useSessao
src/lib/                negocio (valorNegocio), formato, tipos, api
src/pages/              Dashboard, Entrar, EmBreve
```
