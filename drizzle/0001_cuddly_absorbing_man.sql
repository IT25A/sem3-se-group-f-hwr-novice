CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`type` text,
	`title` text NOT NULL,
	`start` integer NOT NULL,
	`end` integer,
	`time` text NOT NULL,
	`location` text NOT NULL,
	`description` text,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
DROP TABLE `asta_event`;--> statement-breakpoint
ALTER TABLE `user` ADD `asta_member` integer DEFAULT false;