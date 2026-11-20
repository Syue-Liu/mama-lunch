CREATE TABLE `lunch_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`food` text NOT NULL,
	`address` text NOT NULL,
	`category` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `lunch_selection` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`food` text NOT NULL,
	`address` text NOT NULL,
	`updated_at` integer NOT NULL
);
