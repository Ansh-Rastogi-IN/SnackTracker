CREATE TABLE `canteens` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`location` text NOT NULL,
	`description` text,
	`image_url` text,
	`is_active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`description` text NOT NULL,
	`amount` integer NOT NULL,
	`canteen_id` integer NOT NULL,
	`date` integer DEFAULT (strftime('%s', 'now')),
	`category` text NOT NULL,
	`recorded_by` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `inventory_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`quantity` integer DEFAULT 0 NOT NULL,
	`unit` text NOT NULL,
	`cost_per_unit` integer NOT NULL,
	`canteen_id` integer NOT NULL,
	`reorder_level` integer DEFAULT 10 NOT NULL,
	`last_updated` integer DEFAULT (strftime('%s', 'now')),
	`updated_by` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `menu_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`price` integer NOT NULL,
	`image_url` text,
	`category` text NOT NULL,
	`is_available` integer DEFAULT true NOT NULL,
	`canteen_id` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer NOT NULL,
	`menu_item_id` integer NOT NULL,
	`quantity` integer NOT NULL,
	`price` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `order_ratings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`rating` integer NOT NULL,
	`comment` text,
	`created_at` integer DEFAULT (strftime('%s', 'now'))
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`status` text DEFAULT 'received' NOT NULL,
	`total_amount` integer NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now'))
);
--> statement-breakpoint
CREATE TABLE `sales_reports` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`canteen_id` integer NOT NULL,
	`date` integer DEFAULT (strftime('%s', 'now')),
	`total_sales` integer NOT NULL,
	`total_orders` integer NOT NULL,
	`cash_sales` integer DEFAULT 0 NOT NULL,
	`online_sales` integer DEFAULT 0 NOT NULL,
	`generated_by` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`password` text NOT NULL,
	`first_name` text,
	`last_name` text,
	`role` text DEFAULT 'customer' NOT NULL,
	`is_admin` integer DEFAULT false NOT NULL,
	`canteen_id` integer,
	`profile_image` text,
	`contact_number` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);