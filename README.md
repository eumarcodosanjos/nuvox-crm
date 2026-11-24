# Nuvox CRM

CRM comercial da Nuvox: software para federações esportivas e academias de artes marciais.
Identidade visual **"Ascensão"**: toda venda é uma subida.

```
Navegador ──► Vercel (site React) ──/api/*──► Cloudflare Worker (API) ──binding──► D1
```

A API roda num **Cloudflare Worker** com acesso direto ao D1 (binding, sem token). A **Vercel** só
serve o site e repassa `/api/*` para o Worker: nenhum segredo fica na Vercel.

> **Sem login:** o CRM é de uso pessoal. Quem tiver a URL vê os dados e pode marcar tarefas.
> A tabela `usuarios` já existe no banco, vazia, para quando quiser ligar um login.

- **Front:** React 19, Vite, TypeScript, Tailwind CSS 3, shadcn/ui (radius 0), TanStack Query, lucide-react
- **API:** Cloudflare Worker (`worker/index.ts`) com o roteador em `server/rotas.ts`; no `npm run dev` o mesmo roteador roda dentro do Vite
- **Banco:** Cloudflare D1 (SQLite). Schema em Drizzle (`db/schema.ts`), migrations em `drizzle/`

## Rodar localmente (sem Cloudflare)

```bash
npm install
```

```bash
cp .env.example .env
```

No `.env`, descomente `DB_LOCAL=.dev-db/nuvox.sqlite`. Depois:

```bash
npm run db:local
```

```bash
npm run dev
```

Abra http://localhost:5173. O `db:local` cria um SQLite com as migrations e o **seed de teste**.

## Rodar localmente contra o D1 real

No `.env`, deixe `DB_LOCAL` comentado e preencha as variáveis `CLOUDFLARE_*` (veja abaixo).

## Publicar

**1. API (Cloudflare Worker)** — pede login na Cloudflare na primeira vez:

```bash
npx wrangler deploy
```

A API está em `https://nuvox-crm.kime-marco.workers.dev`. A Cloudflare está ligada ao GitHub
(Workers Builds): cada push na `main` publica o Worker de novo, sozinho.
O Worker usa *Smart Placement* para rodar perto do D1 (leste dos EUA), então várias consultas por tela continuam rápidas.

**2. Site (Vercel)** — o `vercel.json` repassa `/api/*` para a URL do Worker. O projeto `nuvox-crm`
na Vercel está ligado ao GitHub e **não precisa de variável de ambiente nenhuma**. Cada push na
`main` publica o site de novo.

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
| `usuarios` | Reservada para um login futuro (vazia) |

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
worker/index.ts         Cloudflare Worker (entrada da API)
server/                 roteador, consultas, períodos, acesso ao D1
db/schema.ts            schema Drizzle (fonte da verdade)
db/seed.sql             dados de TESTE
drizzle/                migrations SQL
scripts/                db-local (SQLite de teste)
src/components/         marca, layout, ui (shadcn) e dashboard
src/hooks/              useDashboardKpis, useFunil, usePropostasVencendo, useTarefasHoje, useOrigemLeads
src/lib/                negocio (valorNegocio), formato, tipos, api, usuario
src/pages/              Dashboard, EmBreve
```
