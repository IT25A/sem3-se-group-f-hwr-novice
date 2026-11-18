CREATE TABLE `lesson_assignment` (
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`module_id` text NOT NULL,
	PRIMARY KEY(`user_id`, `title`),
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`module_id`) REFERENCES `module`(`id`) ON UPDATE no action ON DELETE cascade
);
