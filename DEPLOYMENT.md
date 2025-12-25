# Deployment Guide for Feature Port

This document describes the deployment steps for the 5 features ported from SuburbmatesMelb.

## Database Migration

The new `reviews` table has been added via migration `0003_fancy_marauders.sql`.

### To apply the migration:

```bash
# Make sure DATABASE_URL is set in your environment
export DATABASE_URL="mysql://user:password@host:port/database"

# Run the migration
npm run db:push
```

Or manually apply the SQL:

```sql
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

ALTER TABLE `reviews` ADD CONSTRAINT `reviews_productId_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE cascade ON UPDATE cascade;
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_customerId_users_id_fk` FOREIGN KEY (`customerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE cascade;

CREATE INDEX `productIdIdx` ON `reviews` (`productId`);
CREATE INDEX `customerIdIdx` ON `reviews` (`customerId`);
CREATE INDEX `statusIdx` ON `reviews` (`status`);
CREATE INDEX `ratingIdx` ON `reviews` (`rating`);
```

## Environment Variables

Ensure these Stripe environment variables are configured:

```bash
STRIPE_SECRET_KEY=sk_live_xxx       # Your Stripe secret key
STRIPE_WEBHOOK_SECRET=whsec_xxx     # For webhook signature verification
```

## Features Added

### 1. Reviews & Rating System

**API Endpoints (tRPC):**
- `review.create` - Create a product review (authenticated customers)
- `review.getByProduct` - Get approved reviews for a product (public)
- `review.getMine` - Get current user's reviews (authenticated)
- `review.getStats` - Get rating statistics for a product (public)
- `review.moderate` - Approve or reject reviews (admin only)
- `review.markHelpful` - Mark a review as helpful (authenticated)

**Enhanced Endpoints:**
- `business.getById` - Now includes `rating` and `reviewCount` fields

**Database Functions:**
- `createReview(data)` - Create a new review
- `getApprovedReviewsByProductId(productId)` - Get approved reviews
- `getBusinessRatingStats(vendorId)` - Calculate business average rating
- `getProductRatingStats(productId)` - Calculate product average rating
- `updateReviewStatus(reviewId, status)` - Moderate reviews
- `incrementReviewHelpfulCount(reviewId)` - Increment helpful counter

### 2. Business Update Endpoint

**API Endpoint (tRPC):**
- `business.update` - Update business profile (owner or admin only)

**Supported Fields:**
- businessName, about, address, suburb, phone, website
- openingHours, profileImage, services

**Authorization:**
- Requires authentication
- User must own the business OR be an admin

**Database Function:**
- `updateBusiness(businessId, data)` - Update business profile

### 3. Phone & Profile Image Fields

**Status:** ✅ Already present in schema
- `businesses.phone` - Phone number field
- `businesses.profileImage` - Profile image URL field

These fields are automatically included in all business queries.

### 4. Stripe Subscription Webhooks

**Enhanced Webhook Events:**
- `checkout.session.completed` - Handles subscription upgrades and order payments
- `customer.subscription.created` - Already implemented
- `customer.subscription.updated` - Already implemented
- `customer.subscription.deleted` - Already implemented
- `invoice.payment_succeeded` - Already implemented
- `invoice.payment_failed` - Already implemented

**Subscription Flow:**
1. Vendor initiates subscription checkout
2. Checkout session includes `metadata.vendorId` and `metadata.tier`
3. On completion, webhook updates vendor subscription status
4. Vendor tier updated to `basic_active` or `featured_active`
5. Renewal date tracked in `vendorsMeta.subscriptionRenewsAt`

**Database Functions:**
- `updateSubscriptionStatus(vendorId, status, renewsAt)` - Update subscription
- `getVendorSubscription(vendorId)` - Get current subscription state

## Testing

### Review System Test:

```typescript
// Create a review (as authenticated customer)
const result = await trpc.review.create.mutate({
  productId: 1,
  rating: 5,
  title: "Great product!",
  body: "Really loved this service.",
});

// Get reviews for a product
const reviews = await trpc.review.getByProduct.query({ productId: 1 });

// Get rating stats
const stats = await trpc.review.getStats.query({ productId: 1 });
// Returns: { averageRating: 4.5, reviewCount: 10 }

// Get business with rating
const business = await trpc.business.getById.query({ id: 1 });
// Returns business with rating and reviewCount fields
```

### Business Update Test:

```typescript
// Update business profile (as owner or admin)
const result = await trpc.business.update.mutate({
  businessId: 1,
  businessName: "Updated Business Name",
  phone: "+61 400 123 456",
  website: "https://example.com",
});
```

### Stripe Webhook Test:

Use Stripe CLI to test webhooks locally:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.created
```

## Rollback Plan

If issues arise, you can rollback the database migration:

```sql
DROP TABLE IF EXISTS `reviews`;
```

Then revert to the previous commit:

```bash
git revert HEAD
git push
```

## Monitoring

After deployment, monitor:

1. **Reviews Table Growth** - Check table size and query performance
2. **Webhook Processing** - Monitor Stripe webhook logs for errors
3. **Rating Calculation Performance** - Check response times on business.getById
4. **Subscription Updates** - Verify vendor tiers are updated correctly

## Support

For issues or questions, refer to:
- Stripe Webhook Documentation: https://stripe.com/docs/webhooks
- Drizzle ORM Docs: https://orm.drizzle.team/docs/overview
- tRPC Documentation: https://trpc.io/docs
