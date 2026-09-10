CREATE TABLE `roadmaps` (
	`id` char(36) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`owner_id` char(36) NOT NULL,
	`owner_type` enum('USER','TEAM','THIRD_PARTY') NOT NULL DEFAULT 'USER',
	`is_public` boolean NOT NULL DEFAULT false,
	`is_paid` boolean NOT NULL DEFAULT false,
	`metadata` json NOT NULL,
	`created_at` datetime(3) NOT NULL,
	`updated_at` datetime(3) NOT NULL,
	CONSTRAINT `roadmaps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subunits` (
	`id` char(36) NOT NULL,
	`unit_id` char(36) NOT NULL,
	`title` varchar(255) NOT NULL,
	`type` varchar(64) NOT NULL,
	`content_url` text,
	`duration` varchar(64),
	`sequence_order` int NOT NULL,
	`created_at` datetime(3) NOT NULL,
	CONSTRAINT `subunits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `units` (
	`id` char(36) NOT NULL,
	`roadmap_id` char(36) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`sequence_order` int NOT NULL,
	`created_at` datetime(3) NOT NULL,
	CONSTRAINT `units_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_entitlements` (
	`id` char(36) NOT NULL,
	`user_id` char(36) NOT NULL,
	`roadmap_id` char(36) NOT NULL,
	`access_type` varchar(64),
	`expires_at` datetime(3),
	CONSTRAINT `user_entitlements_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_entitlements_user_roadmap_uq` UNIQUE(`user_id`,`roadmap_id`)
);
--> statement-breakpoint
CREATE TABLE `activations` (
	`id` char(36) NOT NULL,
	`user_id` char(36) NOT NULL,
	`roadmap_id` char(36) NOT NULL,
	`team_id` char(36),
	`team_key` char(36) GENERATED ALWAYS AS (coalesce(`team_id`, '')) VIRTUAL NOT NULL,
	`is_active` boolean NOT NULL DEFAULT true,
	`started_at` datetime(3) NOT NULL,
	CONSTRAINT `activations_id` PRIMARY KEY(`id`),
	CONSTRAINT `activations_user_roadmap_team_uq` UNIQUE(`user_id`,`roadmap_id`,`team_key`)
);
--> statement-breakpoint
CREATE TABLE `progress_tracking` (
	`id` char(36) NOT NULL,
	`user_id` char(36) NOT NULL,
	`subunit_id` char(36) NOT NULL,
	`activation_id` char(36) NOT NULL,
	`completed_at` datetime(3) NOT NULL,
	CONSTRAINT `progress_tracking_id` PRIMARY KEY(`id`),
	CONSTRAINT `progress_user_subunit_activation_uq` UNIQUE(`user_id`,`subunit_id`,`activation_id`)
);
--> statement-breakpoint
ALTER TABLE `subunits` ADD CONSTRAINT `subunits_unit_id_units_id_fk` FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `units` ADD CONSTRAINT `units_roadmap_id_roadmaps_id_fk` FOREIGN KEY (`roadmap_id`) REFERENCES `roadmaps`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_entitlements` ADD CONSTRAINT `user_entitlements_user_id_profiles_id_fk` FOREIGN KEY (`user_id`) REFERENCES `profiles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_entitlements` ADD CONSTRAINT `user_entitlements_roadmap_id_roadmaps_id_fk` FOREIGN KEY (`roadmap_id`) REFERENCES `roadmaps`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `activations` ADD CONSTRAINT `activations_user_id_profiles_id_fk` FOREIGN KEY (`user_id`) REFERENCES `profiles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `activations` ADD CONSTRAINT `activations_roadmap_id_roadmaps_id_fk` FOREIGN KEY (`roadmap_id`) REFERENCES `roadmaps`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `activations` ADD CONSTRAINT `activations_team_id_teams_id_fk` FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `progress_tracking` ADD CONSTRAINT `progress_tracking_user_id_profiles_id_fk` FOREIGN KEY (`user_id`) REFERENCES `profiles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `progress_tracking` ADD CONSTRAINT `progress_tracking_subunit_id_subunits_id_fk` FOREIGN KEY (`subunit_id`) REFERENCES `subunits`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `progress_tracking` ADD CONSTRAINT `progress_tracking_activation_id_activations_id_fk` FOREIGN KEY (`activation_id`) REFERENCES `activations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `roadmaps_owner_idx` ON `roadmaps` (`owner_type`,`owner_id`);--> statement-breakpoint
CREATE INDEX `roadmaps_public_idx` ON `roadmaps` (`is_public`);--> statement-breakpoint
CREATE INDEX `subunits_unit_order_idx` ON `subunits` (`unit_id`,`sequence_order`);--> statement-breakpoint
CREATE INDEX `units_roadmap_order_idx` ON `units` (`roadmap_id`,`sequence_order`);--> statement-breakpoint
CREATE INDEX `progress_user_idx` ON `progress_tracking` (`user_id`);