CREATE TABLE `messages` (
	`id` char(36) NOT NULL,
	`team_id` char(36),
	`receiver_id` char(36),
	`user_id` char(36) NOT NULL,
	`text` text NOT NULL,
	`handle` varchar(255),
	`thread_id` char(36),
	`best_response_id` char(36),
	`is_deleted` boolean NOT NULL DEFAULT false,
	`created_at` datetime(3) NOT NULL,
	`updated_at` datetime(3) NOT NULL,
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` char(36) NOT NULL,
	`user_id` char(36) NOT NULL,
	`type` enum('TEAM_INVITE','NEW_MESSAGE','GOAL_COMPLETED','BADGE_EARNED','POINTS_EARNED','HANDLER_TRIGGERED','BEST_RESPONSE') NOT NULL,
	`level` enum('info','success','warning','error') NOT NULL DEFAULT 'info',
	`read` boolean NOT NULL DEFAULT false,
	`title` varchar(255),
	`message` text,
	`link` text,
	`metadata` json NOT NULL,
	`created_at` datetime(3) NOT NULL,
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `requests` (
	`id` char(36) NOT NULL,
	`type` enum('CREATE_TEAM','INVITE_TO_TEAM','REQUEST_TO_JOIN') NOT NULL,
	`sender_id` char(36) NOT NULL,
	`recipient_id` char(36),
	`team_id` char(36),
	`roadmap_id` char(36),
	`status` enum('pending','accepted','rejected','expired') NOT NULL DEFAULT 'pending',
	`message` text,
	`new_team_name` varchar(255),
	`make_admin` boolean NOT NULL DEFAULT false,
	`created_at` datetime(3) NOT NULL,
	`updated_at` datetime(3) NOT NULL,
	CONSTRAINT `requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `badge_events` (
	`id` char(36) NOT NULL,
	`user_id` char(36) NOT NULL,
	`team_id` char(36),
	`reason` varchar(255),
	`unique_trigger_id` varchar(255),
	`created_at` datetime(3) NOT NULL,
	CONSTRAINT `badge_events_id` PRIMARY KEY(`id`),
	CONSTRAINT `badge_events_user_trigger_uq` UNIQUE(`user_id`,`unique_trigger_id`)
);
--> statement-breakpoint
CREATE TABLE `point_events` (
	`id` char(36) NOT NULL,
	`user_id` char(36) NOT NULL,
	`team_id` char(36),
	`points` int NOT NULL,
	`reason` varchar(255),
	`unique_trigger_id` varchar(255),
	`created_at` datetime(3) NOT NULL,
	CONSTRAINT `point_events_id` PRIMARY KEY(`id`),
	CONSTRAINT `point_events_user_trigger_uq` UNIQUE(`user_id`,`unique_trigger_id`)
);
--> statement-breakpoint
CREATE TABLE `analytics_events` (
	`id` char(36) NOT NULL,
	`user_id` char(36),
	`team_id` char(36),
	`event_type` varchar(128) NOT NULL,
	`entity_type` varchar(64),
	`entity_id` char(36),
	`metadata` json NOT NULL,
	`created_at` datetime(3) NOT NULL,
	CONSTRAINT `analytics_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `partners` (
	`id` char(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	CONSTRAINT `partners_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `system_events` (
	`id` char(36) NOT NULL,
	`user_id` char(36),
	`event_type` varchar(128) NOT NULL,
	`payload` json NOT NULL,
	`created_at` datetime(3) NOT NULL,
	CONSTRAINT `system_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_team_id_teams_id_fk` FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_receiver_id_profiles_id_fk` FOREIGN KEY (`receiver_id`) REFERENCES `profiles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_user_id_profiles_id_fk` FOREIGN KEY (`user_id`) REFERENCES `profiles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_thread_id_messages_id_fk` FOREIGN KEY (`thread_id`) REFERENCES `messages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_best_response_id_messages_id_fk` FOREIGN KEY (`best_response_id`) REFERENCES `messages`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_user_id_profiles_id_fk` FOREIGN KEY (`user_id`) REFERENCES `profiles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `requests` ADD CONSTRAINT `requests_sender_id_profiles_id_fk` FOREIGN KEY (`sender_id`) REFERENCES `profiles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `requests` ADD CONSTRAINT `requests_recipient_id_profiles_id_fk` FOREIGN KEY (`recipient_id`) REFERENCES `profiles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `requests` ADD CONSTRAINT `requests_team_id_teams_id_fk` FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `requests` ADD CONSTRAINT `requests_roadmap_id_roadmaps_id_fk` FOREIGN KEY (`roadmap_id`) REFERENCES `roadmaps`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `badge_events` ADD CONSTRAINT `badge_events_user_id_profiles_id_fk` FOREIGN KEY (`user_id`) REFERENCES `profiles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `badge_events` ADD CONSTRAINT `badge_events_team_id_teams_id_fk` FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `point_events` ADD CONSTRAINT `point_events_user_id_profiles_id_fk` FOREIGN KEY (`user_id`) REFERENCES `profiles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `point_events` ADD CONSTRAINT `point_events_team_id_teams_id_fk` FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `analytics_events` ADD CONSTRAINT `analytics_events_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `analytics_events` ADD CONSTRAINT `analytics_events_team_id_teams_id_fk` FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `system_events` ADD CONSTRAINT `system_events_user_id_profiles_id_fk` FOREIGN KEY (`user_id`) REFERENCES `profiles`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `messages_team_created_idx` ON `messages` (`team_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `messages_dm_idx` ON `messages` (`user_id`,`receiver_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `messages_thread_idx` ON `messages` (`thread_id`);--> statement-breakpoint
CREATE INDEX `notifications_user_read_created_idx` ON `notifications` (`user_id`,`read`,`created_at`);--> statement-breakpoint
CREATE INDEX `requests_recipient_status_idx` ON `requests` (`recipient_id`,`status`);--> statement-breakpoint
CREATE INDEX `requests_sender_idx` ON `requests` (`sender_id`);--> statement-breakpoint
CREATE INDEX `requests_team_status_idx` ON `requests` (`team_id`,`status`);--> statement-breakpoint
CREATE INDEX `badge_events_team_created_idx` ON `badge_events` (`team_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `point_events_team_created_idx` ON `point_events` (`team_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `analytics_events_type_created_idx` ON `analytics_events` (`event_type`,`created_at`);--> statement-breakpoint
CREATE INDEX `analytics_events_entity_idx` ON `analytics_events` (`entity_id`);