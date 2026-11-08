CREATE TABLE `asta_event` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`date` text NOT NULL,
	`time` text NOT NULL,
	`location` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `module` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `module_user_id_name_unique` ON `module` (`user_id`,`name`);--> statement-breakpoint
CREATE TABLE `pomodoro` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`module_id` text,
	`type` text NOT NULL,
	`planned_duration` integer NOT NULL,
	`started_at` integer NOT NULL,
	`ended_at` integer,
	`status` text DEFAULT 'running' NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`module_id`) REFERENCES `module`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`token_hash` text NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`password_hash` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_name_unique` ON `user` (`name`);