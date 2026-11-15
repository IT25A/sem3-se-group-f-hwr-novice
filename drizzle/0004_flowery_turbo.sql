CREATE TABLE `module_pass` (
	`user_id` text NOT NULL,
	`module_id` text NOT NULL,
	`passed_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `module_id`),
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`module_id`) REFERENCES `module`(`id`) ON UPDATE no action ON DELETE cascade
);
