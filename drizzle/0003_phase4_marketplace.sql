-- Migration: Phase 4 Marketplace Tables
-- Creates 5 new tables for vendor marketplace, checkout, orders, refunds, and disputes

-- Step 1: Create business_claims table
CREATE TABLE `business_claims` (
	`id` int AUTO_INCREMENT NOT NULL PRIMARY KEY,
	`businessId` int NOT NULL UNIQUE,
	`userId` int NOT NULL,
	`status` ENUM('pending', 'approved', 'claimed', 'rejected') NOT NULL DEFAULT 'pending',
	`verificationCode` varchar(255),
	`verificationCodeExpiresAt` timestamp,
	`verifiedAt` timestamp,
	`approvedAt` timestamp,
	`claimedAt` timestamp,
	`adminNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	INDEX `businessIdIdx` (`businessId`),
	INDEX `userIdIdx` (`userId`),
	INDEX `statusIdx` (`status`),
	CONSTRAINT `business_claims_businessId_fk` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`),
	CONSTRAINT `business_claims_userId_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 2: Create products table
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL PRIMARY KEY,
	`vendorId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`price` decimal(10,2) NOT NULL,
	`category` varchar(100),
	`kind` ENUM('service', 'product', 'package') NOT NULL DEFAULT 'service',
	`fulfillmentMethod` ENUM('pickup', 'delivery', 'both') NOT NULL DEFAULT 'both',
	`stockQuantity` int DEFAULT 999,
	`isActive` boolean NOT NULL DEFAULT true,
	`stripeProductId` varchar(255),
	`stripePriceId` varchar(255),
	`imageUrl` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	INDEX `vendorIdIdx` (`vendorId`),
	INDEX `categoryIdx` (`category`),
	INDEX `kindIdx` (`kind`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 3: Create orders table
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL PRIMARY KEY,
	`buyerId` int NOT NULL,
	`vendorId` int NOT NULL,
	`productId` int NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`unitPrice` decimal(10,2) NOT NULL,
	`subtotalCents` int NOT NULL,
	`platformFeeCents` int NOT NULL,
	`stripeFeesCents` int DEFAULT 0,
	`totalCents` int NOT NULL,
	`status` ENUM('pending', 'completed', 'failed', 'refunded', 'disputed') NOT NULL DEFAULT 'pending',
	`stripePaymentIntentId` varchar(255),
	`stripePaymentMethodId` varchar(255),
	`fulfillmentStatus` ENUM('pending', 'ready', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
	`shippingAddress` text,
	`notes` text,
	`failureReason` text,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	INDEX `buyerIdIdx` (`buyerId`),
	INDEX `vendorIdIdx` (`vendorId`),
	INDEX `productIdIdx` (`productId`),
	INDEX `statusIdx` (`status`),
	INDEX `stripePaymentIntentIdIdx` (`stripePaymentIntentId`),
	CONSTRAINT `orders_buyerId_fk` FOREIGN KEY (`buyerId`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 4: Create refund_requests table
CREATE TABLE `refund_requests` (
	`id` int AUTO_INCREMENT NOT NULL PRIMARY KEY,
	`orderId` int NOT NULL,
	`buyerId` int NOT NULL,
	`reason` varchar(255) NOT NULL,
	`description` text,
	`status` ENUM('pending', 'approved', 'rejected', 'processing', 'completed') NOT NULL DEFAULT 'pending',
	`refundAmountCents` int,
	`stripeRefundId` varchar(255),
	`vendorResponse` text,
	`respondedAt` timestamp,
	`processedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	INDEX `orderIdIdx` (`orderId`),
	INDEX `buyerIdIdx` (`buyerId`),
	INDEX `statusIdx` (`status`),
	CONSTRAINT `refund_requests_buyerId_fk` FOREIGN KEY (`buyerId`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 5: Create dispute_logs table
CREATE TABLE `dispute_logs` (
	`id` int AUTO_INCREMENT NOT NULL PRIMARY KEY,
	`orderId` int NOT NULL,
	`buyerId` int NOT NULL,
	`vendorId` int NOT NULL,
	`refundRequestId` int,
	`status` ENUM('open', 'under_review', 'resolved', 'escalated') NOT NULL DEFAULT 'open',
	`reason` text,
	`buyerEvidence` text,
	`vendorResponse` text,
	`adminDecision` text,
	`resolutionStatus` ENUM('buyer_refund', 'vendor_keeps', 'split'),
	`decidedAt` timestamp,
	`decidedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	INDEX `orderIdIdx` (`orderId`),
	INDEX `buyerIdIdx` (`buyerId`),
	INDEX `vendorIdIdx` (`vendorId`),
	INDEX `statusIdx` (`status`),
	CONSTRAINT `dispute_logs_buyerId_fk` FOREIGN KEY (`buyerId`) REFERENCES `users`(`id`),
	CONSTRAINT `dispute_logs_vendorId_fk` FOREIGN KEY (`vendorId`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 6: Add Phase 4 columns to businesses table
ALTER TABLE `businesses` 
ADD COLUMN `vendorTier` ENUM('none', 'basic', 'featured') DEFAULT 'none' AFTER `status`,
ADD COLUMN `vendorTierExpiresAt` timestamp,
ADD COLUMN `isFeatured` boolean DEFAULT false,
ADD COLUMN `featuredUntil` timestamp;

-- Step 7: Add Phase 4 columns to vendors_meta table
ALTER TABLE `vendors_meta`
ADD COLUMN `stripeConnectAccountId` varchar(255),
ADD COLUMN `bankAccountStatus` ENUM('not_connected', 'verified', 'failed') DEFAULT 'not_connected',
ADD COLUMN `subscriptionStatus` ENUM('free', 'basic_active', 'featured_active', 'cancelled') DEFAULT 'free',
ADD COLUMN `subscriptionRenewsAt` timestamp,
ADD COLUMN `totalEarningsCents` int DEFAULT 0;
