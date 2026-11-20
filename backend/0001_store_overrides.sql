CREATE TABLE `lunch_store_overrides` (
	`id` text PRIMARY KEY NOT NULL,
	`details` text NOT NULL,
	`deleted` integer DEFAULT 0 NOT NULL
);
