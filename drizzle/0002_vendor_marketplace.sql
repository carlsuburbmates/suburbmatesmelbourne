-- Migration: Add Vendor Marketplace Support
-- Rename melbourne_suburbs to melbourne_postcodes and add region column
-- Create vendors_meta table for Stripe integration

-- Step 1: Rename table (preserve existing data)
RENAME TABLE melbourne_suburbs TO melbourne_postcodes;

-- Step 2: Add region column to geofencing table
ALTER TABLE melbourne_postcodes ADD COLUMN region VARCHAR(100);

-- Step 3: Create vendors_meta table for Stripe integration
CREATE TABLE `vendors_meta` (
	`id` int AUTO_INCREMENT NOT NULL PRIMARY KEY,
	`businessId` int NOT NULL UNIQUE,
	`stripeAccountId` varchar(255) NOT NULL UNIQUE,
	`fulfilmentTerms` text,
	`refundPolicyUrl` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	INDEX `businessIdIdx` (`businessId`),
	INDEX `stripeAccountIdIdx` (`stripeAccountId`),
	CONSTRAINT `vendors_meta_businessId_fk` FOREIGN KEY (`businessId`) REFERENCES `businesses`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
