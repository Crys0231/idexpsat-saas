CREATE TABLE `analytics_cache` (
	`id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`metrica` varchar(100) NOT NULL,
	`valor` decimal(10,2) NOT NULL,
	`data_inicio` date NOT NULL,
	`data_fim` date NOT NULL,
	`filtros` text,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `analytics_cache_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clientes` (
	`id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`nome` varchar(255) NOT NULL,
	`telefone` varchar(20) NOT NULL,
	`cidade` varchar(100),
	`email` varchar(255),
	`telegram_chat_id` text,
	`whatsapp_id` varchar(50),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clientes_id` PRIMARY KEY(`id`),
	CONSTRAINT `clientes_telefone_idx` UNIQUE(`tenant_id`,`telefone`)
);
--> statement-breakpoint
CREATE TABLE `compras` (
	`id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`cliente_id` varchar(36) NOT NULL,
	`veiculo_id` varchar(36) NOT NULL,
	`tipo_pesquisa_id` varchar(36) NOT NULL,
	`data_compra` date NOT NULL,
	`hash_compra` varchar(64) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `compras_id` PRIMARY KEY(`id`),
	CONSTRAINT `compras_hash_compra_idx` UNIQUE(`tenant_id`,`hash_compra`)
);
--> statement-breakpoint
CREATE TABLE `marcas` (
	`id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`nome` varchar(100) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `marcas_id` PRIMARY KEY(`id`),
	CONSTRAINT `marcas_nome_idx` UNIQUE(`tenant_id`,`nome`)
);
--> statement-breakpoint
CREATE TABLE `notificacoes` (
	`id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`user_id` int NOT NULL,
	`pesquisa_id` varchar(36) NOT NULL,
	`titulo` varchar(255) NOT NULL,
	`conteudo` text NOT NULL,
	`lida` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notificacoes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `perguntas` (
	`id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`tipo_pesquisa_id` varchar(36) NOT NULL,
	`pergunta` text NOT NULL,
	`tipo` enum('escala','multipla_escolha','aberta') NOT NULL DEFAULT 'escala',
	`ordem` int NOT NULL,
	`ativa` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `perguntas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pesquisas` (
	`id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`compra_id` varchar(36) NOT NULL,
	`tipo_pesquisa_id` varchar(36) NOT NULL,
	`token` varchar(36) NOT NULL,
	`respondida` boolean NOT NULL DEFAULT false,
	`enviada` boolean NOT NULL DEFAULT false,
	`data_envio` timestamp,
	`data_resposta` timestamp,
	`expira_em` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pesquisas_id` PRIMARY KEY(`id`),
	CONSTRAINT `pesquisas_token_unique` UNIQUE(`token`),
	CONSTRAINT `pesquisas_token_idx` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `respostas` (
	`id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`pesquisa_id` varchar(36) NOT NULL,
	`pergunta_id` varchar(36) NOT NULL,
	`resposta` text,
	`score` int,
	`sentimento` enum('positivo','negativo','neutro'),
	`temas` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `respostas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tenants` (
	`id` varchar(36) NOT NULL,
	`nome` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tenants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tipos_pesquisa` (
	`id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`nome` varchar(100) NOT NULL,
	`descricao` text,
	`ativa` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tipos_pesquisa_id` PRIMARY KEY(`id`),
	CONSTRAINT `tipos_pesquisa_nome_idx` UNIQUE(`tenant_id`,`nome`)
);
--> statement-breakpoint
CREATE TABLE `veiculos` (
	`id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`placa` varchar(20) NOT NULL,
	`modelo` varchar(100),
	`marca_id` varchar(36) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `veiculos_id` PRIMARY KEY(`id`),
	CONSTRAINT `veiculos_placa_idx` UNIQUE(`tenant_id`,`placa`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `email` varchar(320) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('admin','user','analyst') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `tenant_id` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `created_at` timestamp DEFAULT (now()) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `updated_at` timestamp DEFAULT (now()) NOT NULL ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `users` ADD `last_signed_in` timestamp DEFAULT (now()) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_email_unique` UNIQUE(`email`);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_openid_idx` UNIQUE(`openId`);--> statement-breakpoint
CREATE INDEX `analytics_cache_tenant_id_idx` ON `analytics_cache` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `analytics_cache_metrica_idx` ON `analytics_cache` (`metrica`);--> statement-breakpoint
CREATE INDEX `clientes_tenant_id_idx` ON `clientes` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `compras_tenant_id_idx` ON `compras` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `compras_cliente_id_idx` ON `compras` (`cliente_id`);--> statement-breakpoint
CREATE INDEX `compras_veiculo_id_idx` ON `compras` (`veiculo_id`);--> statement-breakpoint
CREATE INDEX `marcas_tenant_id_idx` ON `marcas` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `notificacoes_tenant_id_idx` ON `notificacoes` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `notificacoes_user_id_idx` ON `notificacoes` (`user_id`);--> statement-breakpoint
CREATE INDEX `notificacoes_pesquisa_id_idx` ON `notificacoes` (`pesquisa_id`);--> statement-breakpoint
CREATE INDEX `perguntas_tenant_id_idx` ON `perguntas` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `perguntas_tipo_pesquisa_id_idx` ON `perguntas` (`tipo_pesquisa_id`);--> statement-breakpoint
CREATE INDEX `pesquisas_tenant_id_idx` ON `pesquisas` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `pesquisas_compra_id_idx` ON `pesquisas` (`compra_id`);--> statement-breakpoint
CREATE INDEX `pesquisas_respondida_idx` ON `pesquisas` (`respondida`);--> statement-breakpoint
CREATE INDEX `respostas_tenant_id_idx` ON `respostas` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `respostas_pesquisa_id_idx` ON `respostas` (`pesquisa_id`);--> statement-breakpoint
CREATE INDEX `respostas_pergunta_id_idx` ON `respostas` (`pergunta_id`);--> statement-breakpoint
CREATE INDEX `tipos_pesquisa_tenant_id_idx` ON `tipos_pesquisa` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `veiculos_tenant_id_idx` ON `veiculos` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `veiculos_marca_id_idx` ON `veiculos` (`marca_id`);--> statement-breakpoint
CREATE INDEX `users_tenant_id_idx` ON `users` (`tenant_id`);--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `loginMethod`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `createdAt`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `updatedAt`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `lastSignedIn`;