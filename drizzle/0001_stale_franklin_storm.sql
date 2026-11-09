CREATE TABLE `lesson` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`module_id` text,
	`kind` text NOT NULL,
	`location` text DEFAULT '' NOT NULL,
	`starts_at` integer NOT NULL,
	`ends_at` integer NOT NULL,
	FOREIGN KEY (`module_id`) REFERENCES `module`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `lesson_key_unique` ON `lesson` (`key`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_module` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`lp` integer NOT NULL,
	`exam_le` integer DEFAULT 0 NOT NULL,
	`self_study_le` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_module`("id", "code", "name", "lp", "exam_le", "self_study_le") SELECT "id", "code", "name", "lp", "exam_le", "self_study_le" FROM `module`;--> statement-breakpoint
DROP TABLE `module`;--> statement-breakpoint
ALTER TABLE `__new_module` RENAME TO `module`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `module_code_unique` ON `module` (`code`);