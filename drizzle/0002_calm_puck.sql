ALTER TABLE `user` ADD `ical_token` text;--> statement-breakpoint
ALTER TABLE `user` ADD `ical_lessons` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `user` ADD `ical_private` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `user` ADD `ical_public` integer DEFAULT true NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `user_ical_token_unique` ON `user` (`ical_token`);