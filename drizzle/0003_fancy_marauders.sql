CREATE TABLE `reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`customerId` int NOT NULL,
	`rating` int NOT NULL,
	`title` varchar(200),
	`body` text,
	`verifiedPurchase` boolean NOT NULL DEFAULT true,
	`helpfulCount` int NOT NULL DEFAULT 0,
	`status` enum('pending_moderation','approved','rejected') NOT NULL DEFAULT 'pending_moderation',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_productId_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_customerId_users_id_fk` FOREIGN KEY (`customerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX `productIdIdx` ON `reviews` (`productId`);--> statement-breakpoint
CREATE INDEX `customerIdIdx` ON `reviews` (`customerId`);--> statement-breakpoint
CREATE INDEX `statusIdx` ON `reviews` (`status`);--> statement-breakpoint
CREATE INDEX `ratingIdx` ON `reviews` (`rating`);