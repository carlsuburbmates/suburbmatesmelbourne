CREATE TABLE `business_claims` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`userId` int NOT NULL,
	`claimStatus` enum('pending','approved','claimed','rejected') NOT NULL DEFAULT 'pending',
	`verificationCode` varchar(255),
	`verificationCodeExpiresAt` timestamp,
	`verifiedAt` timestamp,
	`approvedAt` timestamp,
	`claimedAt` timestamp,
	`adminNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `business_claims_id` PRIMARY KEY(`id`),
	CONSTRAINT `business_claims_businessId_unique` UNIQUE(`businessId`)
);
--> statement-breakpoint
CREATE TABLE `carts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`items` text NOT NULL,
	`totalCents` int NOT NULL DEFAULT 0,
	`itemCount` int NOT NULL DEFAULT 0,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `carts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`description` text,
	`icon` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `categories_name_unique` UNIQUE(`name`),
	CONSTRAINT `categories_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `dispute_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`buyerId` int NOT NULL,
	`vendorId` int NOT NULL,
	`refundRequestId` int,
	`disputeStatus` enum('open','under_review','resolved','escalated') NOT NULL DEFAULT 'open',
	`reason` text,
	`buyerEvidence` text,
	`vendorResponse` text,
	`adminDecision` text,
	`resolutionStatus` enum('buyer_refund','vendor_keeps','split'),
	`decidedAt` timestamp,
	`decidedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dispute_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `melbourne_postcodes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`suburb` varchar(100) NOT NULL,
	`postcode` varchar(4) NOT NULL,
	`region` varchar(255),
	`latitude` decimal(10,8),
	`longitude` decimal(11,8),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `melbourne_postcodes_id` PRIMARY KEY(`id`),
	CONSTRAINT `melbourne_postcodes_suburb_unique` UNIQUE(`suburb`)
);
--> statement-breakpoint
CREATE TABLE `notification_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`emailOrderUpdates` boolean NOT NULL DEFAULT true,
	`emailRefundUpdates` boolean NOT NULL DEFAULT true,
	`emailSystemNotifications` boolean NOT NULL DEFAULT true,
	`inAppOrderUpdates` boolean NOT NULL DEFAULT true,
	`inAppRefundUpdates` boolean NOT NULL DEFAULT true,
	`inAppSystemNotifications` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notification_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `notification_preferences_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`notificationType` enum('order_created','order_confirmed','order_completed','refund_requested','refund_processed','claim_submitted','claim_approved','dispute_opened','system') NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`relatedOrderId` int,
	`relatedRefundId` int,
	`read` boolean NOT NULL DEFAULT false,
	`actionUrl` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`readAt` timestamp,
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`buyerId` int NOT NULL,
	`vendorId` int NOT NULL,
	`productId` int NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`unitPrice` decimal(10,2) NOT NULL,
	`subtotalCents` int NOT NULL,
	`platformFeeCents` int NOT NULL,
	`stripeFeesCents` int DEFAULT 0,
	`totalCents` int NOT NULL,
	`orderStatus` enum('pending','completed','failed','refunded','disputed') NOT NULL DEFAULT 'pending',
	`stripePaymentIntentId` varchar(255),
	`stripePaymentMethodId` varchar(255),
	`fulfillmentStatus` enum('pending','ready','completed','cancelled') NOT NULL DEFAULT 'pending',
	`shippingAddress` text,
	`notes` text,
	`failureReason` text,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `productCategories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`categoryId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `productCategories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vendorId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`price` decimal(10,2) NOT NULL,
	`category` varchar(100),
	`kind` enum('service','product','package') NOT NULL DEFAULT 'service',
	`fulfillmentMethod` enum('pickup','delivery','both') NOT NULL DEFAULT 'both',
	`stockQuantity` int DEFAULT 999,
	`isActive` boolean NOT NULL DEFAULT true,
	`stripeProductId` varchar(255),
	`stripePriceId` varchar(255),
	`imageUrl` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `refund_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`buyerId` int NOT NULL,
	`reason` varchar(255) NOT NULL,
	`description` text,
	`refundStatus` enum('pending','approved','rejected','processing','completed') NOT NULL DEFAULT 'pending',
	`refundAmountCents` int,
	`stripeRefundId` varchar(255),
	`vendorResponse` text,
	`respondedAt` timestamp,
	`processedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `refund_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vendors_meta` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`stripeAccountId` varchar(255) NOT NULL,
	`fulfilmentTerms` text,
	`refundPolicyUrl` varchar(255),
	`stripeConnectAccountId` varchar(255),
	`bankAccountStatus` enum('not_connected','verified','failed') NOT NULL DEFAULT 'not_connected',
	`subscriptionStatus` enum('free','basic_active','featured_active','cancelled') NOT NULL DEFAULT 'free',
	`subscriptionRenewsAt` timestamp,
	`totalEarningsCents` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vendors_meta_id` PRIMARY KEY(`id`),
	CONSTRAINT `vendors_meta_businessId_unique` UNIQUE(`businessId`),
	CONSTRAINT `vendors_meta_stripeAccountId_unique` UNIQUE(`stripeAccountId`)
);
--> statement-breakpoint
DROP TABLE `melbourne_suburbs`;--> statement-breakpoint
ALTER TABLE `businesses` ADD `abnDetails` text;--> statement-breakpoint
ALTER TABLE `businesses` ADD `vendorTier` enum('none','basic','featured') DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE `businesses` ADD `vendorTierExpiresAt` timestamp;--> statement-breakpoint
ALTER TABLE `businesses` ADD `isFeatured` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `businesses` ADD `featuredUntil` timestamp;--> statement-breakpoint
ALTER TABLE `consents` ADD `action` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `consents` ADD `timestamp` timestamp DEFAULT (now()) NOT NULL;--> statement-breakpoint
ALTER TABLE `consents` ADD `immutableHash` varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE `business_claims` ADD CONSTRAINT `business_claims_businessId_businesses_id_fk` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `business_claims` ADD CONSTRAINT `business_claims_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `carts` ADD CONSTRAINT `carts_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dispute_logs` ADD CONSTRAINT `dispute_logs_buyerId_users_id_fk` FOREIGN KEY (`buyerId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dispute_logs` ADD CONSTRAINT `dispute_logs_vendorId_users_id_fk` FOREIGN KEY (`vendorId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notification_preferences` ADD CONSTRAINT `notification_preferences_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_buyerId_users_id_fk` FOREIGN KEY (`buyerId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `productCategories` ADD CONSTRAINT `productCategories_productId_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `productCategories` ADD CONSTRAINT `productCategories_categoryId_categories_id_fk` FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `refund_requests` ADD CONSTRAINT `refund_requests_buyerId_users_id_fk` FOREIGN KEY (`buyerId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vendors_meta` ADD CONSTRAINT `vendors_meta_businessId_businesses_id_fk` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `businessIdIdx` ON `business_claims` (`businessId`);--> statement-breakpoint
CREATE INDEX `userIdIdx` ON `business_claims` (`userId`);--> statement-breakpoint
CREATE INDEX `statusIdx` ON `business_claims` (`claimStatus`);--> statement-breakpoint
CREATE INDEX `userIdIdx` ON `carts` (`userId`);--> statement-breakpoint
CREATE INDEX `slugIdx` ON `categories` (`slug`);--> statement-breakpoint
CREATE INDEX `orderIdIdx` ON `dispute_logs` (`orderId`);--> statement-breakpoint
CREATE INDEX `buyerIdIdx` ON `dispute_logs` (`buyerId`);--> statement-breakpoint
CREATE INDEX `vendorIdIdx` ON `dispute_logs` (`vendorId`);--> statement-breakpoint
CREATE INDEX `statusIdx` ON `dispute_logs` (`disputeStatus`);--> statement-breakpoint
CREATE INDEX `userIdIdx` ON `notification_preferences` (`userId`);--> statement-breakpoint
CREATE INDEX `userIdIdx` ON `notifications` (`userId`);--> statement-breakpoint
CREATE INDEX `typeIdx` ON `notifications` (`notificationType`);--> statement-breakpoint
CREATE INDEX `readIdx` ON `notifications` (`read`);--> statement-breakpoint
CREATE INDEX `buyerIdIdx` ON `orders` (`buyerId`);--> statement-breakpoint
CREATE INDEX `vendorIdIdx` ON `orders` (`vendorId`);--> statement-breakpoint
CREATE INDEX `productIdIdx` ON `orders` (`productId`);--> statement-breakpoint
CREATE INDEX `statusIdx` ON `orders` (`orderStatus`);--> statement-breakpoint
CREATE INDEX `stripePaymentIntentIdIdx` ON `orders` (`stripePaymentIntentId`);--> statement-breakpoint
CREATE INDEX `productIdIdx` ON `productCategories` (`productId`);--> statement-breakpoint
CREATE INDEX `categoryIdIdx` ON `productCategories` (`categoryId`);--> statement-breakpoint
CREATE INDEX `uniqueProductCategory` ON `productCategories` (`productId`,`categoryId`);--> statement-breakpoint
CREATE INDEX `vendorIdIdx` ON `products` (`vendorId`);--> statement-breakpoint
CREATE INDEX `categoryIdx` ON `products` (`category`);--> statement-breakpoint
CREATE INDEX `kindIdx` ON `products` (`kind`);--> statement-breakpoint
CREATE INDEX `orderIdIdx` ON `refund_requests` (`orderId`);--> statement-breakpoint
CREATE INDEX `buyerIdIdx` ON `refund_requests` (`buyerId`);--> statement-breakpoint
CREATE INDEX `statusIdx` ON `refund_requests` (`refundStatus`);--> statement-breakpoint
CREATE INDEX `businessIdIdx` ON `vendors_meta` (`businessId`);--> statement-breakpoint
CREATE INDEX `stripeAccountIdIdx` ON `vendors_meta` (`stripeAccountId`);--> statement-breakpoint
CREATE INDEX `timestampIdx` ON `consents` (`timestamp`);--> statement-breakpoint
ALTER TABLE `consents` DROP COLUMN `consentType`;--> statement-breakpoint
ALTER TABLE `consents` DROP COLUMN `granted`;--> statement-breakpoint
ALTER TABLE `consents` DROP COLUMN `version`;--> statement-breakpoint
ALTER TABLE `consents` DROP COLUMN `ipAddress`;--> statement-breakpoint
ALTER TABLE `consents` DROP COLUMN `userAgent`;--> statement-breakpoint
ALTER TABLE `consents` DROP COLUMN `expiresAt`;--> statement-breakpoint
ALTER TABLE `consents` DROP COLUMN `createdAt`;--> statement-breakpoint
ALTER TABLE `consents` DROP COLUMN `updatedAt`;