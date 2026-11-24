ALTER TABLE `produtos` ADD `cor` text DEFAULT '#B5B5B0' NOT NULL;--> statement-breakpoint
-- Cores de identidade (validadas para daltonismo e distintas de limão, roxo e alerta)
UPDATE `produtos` SET `cor` = '#3AA0FF' WHERE `nome` = 'Nuvox Federações';--> statement-breakpoint
UPDATE `produtos` SET `cor` = '#FF5CC8' WHERE `nome` = 'Nuvox Combat';--> statement-breakpoint
UPDATE `produtos` SET `cor` = '#20D6A4' WHERE `nome` = 'Nuvox Academia';
