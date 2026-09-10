CREATE TABLE `accounts` (
	`id` char(36) NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` char(36) NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` datetime(3),
	`refresh_token_expires_at` datetime(3),
	`scope` text,
	`password` text,
	`created_at` datetime(3) NOT NULL,
	`updated_at` datetime(3) NOT NULL,
	CONSTRAINT `accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` char(36) NOT NULL,
	`expires_at` datetime(3) NOT NULL,
	`token` varchar(255) NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` char(36) NOT NULL,
	`created_at` datetime(3) NOT NULL,
	`updated_at` datetime(3) NOT NULL,
	CONSTRAINT `sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `sessions_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` char(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`email_verified` boolean NOT NULL DEFAULT false,
	`image` text,
	`created_at` datetime(3) NOT NULL,
	`updated_at` datetime(3) NOT NULL,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `verifications` (
	`id` char(36) NOT NULL,
	`identifier` varchar(255) NOT NULL,
	`value` text NOT NULL,
	`expires_at` datetime(3) NOT NULL,
	`created_at` datetime(3) NOT NULL,
	`updated_at` datetime(3) NOT NULL,
	CONSTRAINT `verifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` char(36) NOT NULL,
	`bio` text,
	`active_course` varchar(255),
	`is_premium` boolean NOT NULL DEFAULT false,
	`profile_complete` boolean NOT NULL DEFAULT false,
	`has_active_team` boolean NOT NULL DEFAULT false,
	`birth_date` date,
	`location` varchar(255),
	`onboarding_data` json NOT NULL,
	`preferences` json NOT NULL,
	`schedule` json NOT NULL,
	`created_at` datetime(3) NOT NULL,
	`updated_at` datetime(3) NOT NULL,
	CONSTRAINT `profiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `team_goals` (
	`id` char(36) NOT NULL,
	`team_id` char(36) NOT NULL,
	`type` varchar(64),
	`amount` int,
	`weeks` int,
	`description` text,
	`start_date` datetime(3),
	`created_at` datetime(3) NOT NULL,
	CONSTRAINT `team_goals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `team_members` (
	`team_id` char(36) NOT NULL,
	`user_id` char(36) NOT NULL,
	`role` enum('admin','member') NOT NULL DEFAULT 'member',
	`joined_at` datetime(3) NOT NULL,
	CONSTRAINT `team_members_team_id_user_id_pk` PRIMARY KEY(`team_id`,`user_id`)
);
--> statement-breakpoint
CREATE TABLE `teams` (
	`id` char(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`bio` text,
	`avatar_url` text,
	`course_name` varchar(255),
	`current_roadmap_id` char(36),
	`settings` json NOT NULL,
	`resource_links` json NOT NULL,
	`activity_status` varchar(32) NOT NULL DEFAULT 'active',
	`last_active` datetime(3) NOT NULL,
	`created_at` datetime(3) NOT NULL,
	`updated_at` datetime(3) NOT NULL,
	CONSTRAINT `teams_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `accounts` ADD CONSTRAINT `accounts_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `profiles` ADD CONSTRAINT `profiles_id_users_id_fk` FOREIGN KEY (`id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `team_goals` ADD CONSTRAINT `team_goals_team_id_teams_id_fk` FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `team_members` ADD CONSTRAINT `team_members_team_id_teams_id_fk` FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `team_members` ADD CONSTRAINT `team_members_user_id_profiles_id_fk` FOREIGN KEY (`user_id`) REFERENCES `profiles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `accounts_user_idx` ON `accounts` (`user_id`);--> statement-breakpoint
CREATE INDEX `sessions_user_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `verifications_identifier_idx` ON `verifications` (`identifier`);--> statement-breakpoint
CREATE INDEX `team_members_user_idx` ON `team_members` (`user_id`);