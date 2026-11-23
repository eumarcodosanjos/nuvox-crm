CREATE TABLE `leads` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nome` text NOT NULL,
	`organizacao` text,
	`tipo` text DEFAULT 'outro' NOT NULL,
	`origem` text DEFAULT 'outro' NOT NULL,
	`telefone` text,
	`email` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	CONSTRAINT "leads_tipo_check" CHECK("leads"."tipo" IN ('federacao', 'academia', 'organizador_evento', 'prefeitura', 'outro')),
	CONSTRAINT "leads_origem_check" CHECK("leads"."origem" IN ('whatsapp', 'instagram', 'indicacao', 'site', 'outro'))
);
--> statement-breakpoint
CREATE INDEX `leads_created_at_idx` ON `leads` (`created_at`);--> statement-breakpoint
CREATE TABLE `licencas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`lead_id` integer NOT NULL,
	`produto_id` integer NOT NULL,
	`valor_mensal` integer NOT NULL,
	`inicio` text NOT NULL,
	`ultimo_reajuste_ipca` text,
	`ativa` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`produto_id`) REFERENCES `produtos`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `licencas_ativa_idx` ON `licencas` (`ativa`);--> statement-breakpoint
CREATE TABLE `metas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`mes` text NOT NULL,
	`valor` integer NOT NULL,
	CONSTRAINT "metas_mes_check" CHECK("metas"."mes" = strftime('%Y-%m-01', "metas"."mes"))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `metas_mes_unico` ON `metas` (`mes`);--> statement-breakpoint
CREATE TABLE `negocios` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`lead_id` integer NOT NULL,
	`produto_id` integer NOT NULL,
	`etapa` text DEFAULT 'novo' NOT NULL,
	`valor_implantacao` integer DEFAULT 0 NOT NULL,
	`valor_mensal` integer DEFAULT 0 NOT NULL,
	`valor_avulso` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`fechado_em` text,
	FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`produto_id`) REFERENCES `produtos`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "negocios_etapa_check" CHECK("negocios"."etapa" IN ('novo', 'contato', 'proposta', 'negociacao', 'fechado', 'perdido')),
	CONSTRAINT "negocios_valores_check" CHECK("negocios"."valor_implantacao" >= 0 AND "negocios"."valor_mensal" >= 0 AND "negocios"."valor_avulso" >= 0)
);
--> statement-breakpoint
CREATE INDEX `negocios_etapa_idx` ON `negocios` (`etapa`);--> statement-breakpoint
CREATE INDEX `negocios_fechado_em_idx` ON `negocios` (`fechado_em`);--> statement-breakpoint
CREATE INDEX `negocios_lead_idx` ON `negocios` (`lead_id`);--> statement-breakpoint
CREATE TABLE `produtos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nome` text NOT NULL,
	`modelo_cobranca` text NOT NULL,
	CONSTRAINT "produtos_nome_check" CHECK("produtos"."nome" IN ('Nuvox Federações', 'Nuvox Combat', 'Nuvox Academia'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `produtos_nome_unique` ON `produtos` (`nome`);--> statement-breakpoint
CREATE TABLE `propostas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`negocio_id` integer NOT NULL,
	`enviada_em` text NOT NULL,
	`validade_dias` integer DEFAULT 30 NOT NULL,
	`vence_em` text GENERATED ALWAYS AS (date(enviada_em, '+' || validade_dias || ' days')) STORED,
	`status` text DEFAULT 'aberta' NOT NULL,
	FOREIGN KEY (`negocio_id`) REFERENCES `negocios`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "propostas_status_check" CHECK("propostas"."status" IN ('aberta', 'aceita', 'recusada', 'vencida'))
);
--> statement-breakpoint
CREATE INDEX `propostas_vence_em_idx` ON `propostas` (`status`,`vence_em`);--> statement-breakpoint
CREATE TABLE `tarefas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`negocio_id` integer,
	`titulo` text NOT NULL,
	`canal` text NOT NULL,
	`data_hora` text NOT NULL,
	`concluida` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`negocio_id`) REFERENCES `negocios`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "tarefas_canal_check" CHECK("tarefas"."canal" IN ('whatsapp', 'email', 'video', 'ligacao', 'financeiro'))
);
--> statement-breakpoint
CREATE INDEX `tarefas_data_hora_idx` ON `tarefas` (`data_hora`);--> statement-breakpoint
CREATE TABLE `usuarios` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nome` text NOT NULL,
	`email` text NOT NULL,
	`senha_hash` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `usuarios_email_unique` ON `usuarios` (`email`);