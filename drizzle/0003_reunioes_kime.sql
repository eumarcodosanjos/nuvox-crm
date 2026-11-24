CREATE TABLE IF NOT EXISTS `reunioes_kime` (
	`origem_id` text PRIMARY KEY NOT NULL,
	`negocio_id` integer NOT NULL,
	`titulo` text NOT NULL,
	`dia` text NOT NULL,
	`hora` text,
	`link_meet` text,
	`versao` integer NOT NULL,
	FOREIGN KEY (`negocio_id`) REFERENCES `negocios`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `reunioes_kime_negocio_idx` ON `reunioes_kime` (`negocio_id`,`dia`,`hora`);