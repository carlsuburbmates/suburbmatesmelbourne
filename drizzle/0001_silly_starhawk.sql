CREATE TABLE `agreements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`businessId` int NOT NULL,
	`agreementType` enum('terms_of_service','privacy_policy','vendor_agreement') NOT NULL,
	`version` varchar(20) NOT NULL,
	`acceptedAt` timestamp NOT NULL,
	`ipAddress` varchar(45),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agreements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `businesses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`businessName` varchar(255) NOT NULL,
	`abn` varchar(11),
	`abnVerifiedStatus` enum('pending','verified','rejected') NOT NULL DEFAULT 'pending',
	`services` text,
	`about` text,
	`address` varchar(500),
	`suburb` varchar(100),
	`phone` varchar(20),
	`website` varchar(500),
	`openingHours` text,
	`profileImage` varchar(500),
	`status` enum('active','inactive','suspended') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `businesses_id` PRIMARY KEY(`id`),
	CONSTRAINT `businesses_abn_unique` UNIQUE(`abn`)
);
--> statement-breakpoint
CREATE TABLE `consents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`consentType` enum('marketing_emails','sms_notifications','analytics','third_party_sharing') NOT NULL,
	`granted` boolean NOT NULL DEFAULT false,
	`version` varchar(20) NOT NULL,
	`ipAddress` varchar(45),
	`userAgent` text,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `consents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`token` varchar(255) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`usedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `email_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `email_tokens_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `melbourne_suburbs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`suburb` varchar(100) NOT NULL,
	`postcode` varchar(4) NOT NULL,
	`latitude` decimal(10,8),
	`longitude` decimal(11,8),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `melbourne_suburbs_id` PRIMARY KEY(`id`),
	CONSTRAINT `melbourne_suburbs_suburb_unique` UNIQUE(`suburb`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','buyer','business_owner','vendor') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `agreements` ADD CONSTRAINT `agreements_businessId_businesses_id_fk` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `businesses` ADD CONSTRAINT `businesses_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `consents` ADD CONSTRAINT `consents_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `businessIdIdx` ON `agreements` (`businessId`);--> statement-breakpoint
CREATE INDEX `ownerIdIdx` ON `businesses` (`ownerId`);--> statement-breakpoint
CREATE INDEX `abnIdx` ON `businesses` (`abn`);--> statement-breakpoint
CREATE INDEX `suburbIdx` ON `businesses` (`suburb`);--> statement-breakpoint
CREATE INDEX `userIdIdx` ON `consents` (`userId`);--> statement-breakpoint
CREATE INDEX `emailIdx` ON `email_tokens` (`email`);--> statement-breakpoint
CREATE INDEX `tokenIdx` ON `email_tokens` (`token`);