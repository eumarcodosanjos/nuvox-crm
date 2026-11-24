-- GovEscolar: novos tipos de lead, campos do GovEscolar e produtos como dados (sem lista fixa de nomes).
-- ATENÇÃO: recria as tabelas leads e produtos. As chaves estrangeiras ficam desligadas durante a
-- recriação; com elas ligadas, apagar a tabela antiga removeria negócios em cascata.
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_leads` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nome` text NOT NULL,
	`organizacao` text,
	`tipo` text DEFAULT 'outro' NOT NULL,
	`origem` text DEFAULT 'outro' NOT NULL,
	`telefone` text,
	`email` text,
	`observacoes` text,
	`municipio` text,
	`uf` text,
	`cargo_contato` text,
	`rede_ensino` text,
	`qtd_escolas` integer,
	`qtd_alunos` integer,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	CONSTRAINT "leads_tipo_check" CHECK("__new_leads"."tipo" IN ('federacao', 'academia', 'organizador_evento', 'prefeitura', 'secretaria_educacao', 'escola', 'outro')),
	CONSTRAINT "leads_origem_check" CHECK("__new_leads"."origem" IN ('whatsapp', 'instagram', 'indicacao', 'site', 'outro')),
	CONSTRAINT "leads_uf_check" CHECK("__new_leads"."uf" IS NULL OR (length("__new_leads"."uf") = 2 AND "__new_leads"."uf" = upper("__new_leads"."uf"))),
	CONSTRAINT "leads_cargo_check" CHECK("__new_leads"."cargo_contato" IS NULL OR "__new_leads"."cargo_contato" IN ('secretario_educacao', 'diretor', 'coordenador', 'gestor_ti', 'outro')),
	CONSTRAINT "leads_rede_check" CHECK("__new_leads"."rede_ensino" IS NULL OR "__new_leads"."rede_ensino" IN ('municipal', 'estadual', 'particular')),
	CONSTRAINT "leads_qtd_check" CHECK(("__new_leads"."qtd_escolas" IS NULL OR "__new_leads"."qtd_escolas" >= 0) AND ("__new_leads"."qtd_alunos" IS NULL OR "__new_leads"."qtd_alunos" >= 0))
);
--> statement-breakpoint
-- Copia só as colunas que já existiam (as novas começam vazias)
INSERT INTO `__new_leads`("id", "nome", "organizacao", "tipo", "origem", "telefone", "email", "created_at") SELECT "id", "nome", "organizacao", "tipo", "origem", "telefone", "email", "created_at" FROM `leads`;--> statement-breakpoint
DROP TABLE `leads`;--> statement-breakpoint
ALTER TABLE `__new_leads` RENAME TO `leads`;--> statement-breakpoint
CREATE INDEX `leads_created_at_idx` ON `leads` (`created_at`);--> statement-breakpoint
CREATE TABLE `__new_produtos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nome` text NOT NULL,
	`modelo_cobranca` text NOT NULL,
	`cor` text DEFAULT '#B5B5B0' NOT NULL,
	CONSTRAINT "produtos_cor_check" CHECK(length("__new_produtos"."cor") = 7 AND substr("__new_produtos"."cor", 1, 1) = '#' AND lower(substr("__new_produtos"."cor", 2)) NOT GLOB '*[^0-9a-f]*')
);
--> statement-breakpoint
INSERT INTO `__new_produtos`("id", "nome", "modelo_cobranca", "cor") SELECT "id", "nome", "modelo_cobranca", "cor" FROM `produtos`;--> statement-breakpoint
DROP TABLE `produtos`;--> statement-breakpoint
ALTER TABLE `__new_produtos` RENAME TO `produtos`;--> statement-breakpoint
CREATE UNIQUE INDEX `produtos_nome_unique` ON `produtos` (`nome`);--> statement-breakpoint
INSERT INTO `produtos` (`nome`, `modelo_cobranca`, `cor`) VALUES ('GovEscolar', 'Implantação + licença por rede de ensino', '#FFB020');--> statement-breakpoint
PRAGMA foreign_keys=ON;
