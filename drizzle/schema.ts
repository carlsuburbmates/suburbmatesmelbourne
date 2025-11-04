import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
  decimal,
  index,
  foreignKey,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", [
    "user",
    "admin",
    "buyer",
    "business_owner",
    "vendor",
  ])
    .default("user")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Melbourne suburbs/postcodes reference table for geofencing
 * Renamed to melbourne_postcodes to match MVP schema
 */
export const melbournSuburbs = mysqlTable("melbourne_postcodes", {
  id: int("id").autoincrement().primaryKey(),
  suburb: varchar("suburb", { length: 100 }).notNull().unique(),
  postcode: varchar("postcode", { length: 4 }).notNull(),
  region: varchar("region", { length: 255 }), // Regional grouping (e.g., Inner Melbourne, Eastern Suburbs)
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MelbournSuburb = typeof melbournSuburbs.$inferSelect;
export type InsertMelbournSuburb = typeof melbournSuburbs.$inferInsert;

/**
 * Businesses table - core directory entity
 */
export const businesses = mysqlTable(
  "businesses",
  {
    id: int("id").autoincrement().primaryKey(),
    ownerId: int("ownerId").notNull(),
    businessName: varchar("businessName", { length: 255 }).notNull(),
    abn: varchar("abn", { length: 11 }).unique(),
    abnVerifiedStatus: mysqlEnum("abnVerifiedStatus", [
      "pending",
      "verified",
      "rejected",
    ])
      .default("pending")
      .notNull(),
    abnDetails: text("abnDetails"), // JSON string with ABN lookup details
    services: text("services"), // JSON array of service categories
    about: text("about"),
    address: varchar("address", { length: 500 }),
    suburb: varchar("suburb", { length: 100 }),
    phone: varchar("phone", { length: 20 }),
    website: varchar("website", { length: 500 }),
    openingHours: text("openingHours"), // JSON object with hours
    profileImage: varchar("profileImage", { length: 500 }),
    status: mysqlEnum("status", ["active", "inactive", "suspended"])
      .default("active")
      .notNull(),
    // Phase 4: Vendor tier and featured status
    vendorTier: mysqlEnum("vendorTier", ["none", "basic", "featured"])
      .default("none")
      .notNull(),
    vendorTierExpiresAt: timestamp("vendorTierExpiresAt"),
    isFeatured: boolean("isFeatured").default(false).notNull(),
    featuredUntil: timestamp("featuredUntil"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    ownerIdIdx: index("ownerIdIdx").on(table.ownerId),
    abnIdx: index("abnIdx").on(table.abn),
    suburbIdx: index("suburbIdx").on(table.suburb),
    ownerFk: foreignKey({
      columns: [table.ownerId],
      foreignColumns: [users.id],
    }),
  })
);

export type Business = typeof businesses.$inferSelect;
export type InsertBusiness = typeof businesses.$inferInsert;

/**
 * Vendor metadata table - created when Business Owner upgrades to Vendor
 * Stores Stripe integration and vendor-specific configuration
 */
export const vendorsMeta = mysqlTable(
  "vendors_meta",
  {
    id: int("id").autoincrement().primaryKey(),
    businessId: int("businessId").notNull().unique(),
    stripeAccountId: varchar("stripeAccountId", { length: 255 })
      .notNull()
      .unique(),
    fulfilmentTerms: text("fulfilmentTerms"), // JSON object with pickup/delivery options
    refundPolicyUrl: varchar("refundPolicyUrl", { length: 255 }),
    // Phase 4: Stripe Connect and subscription management
    stripeConnectAccountId: varchar("stripeConnectAccountId", { length: 255 }),
    bankAccountStatus: mysqlEnum("bankAccountStatus", [
      "not_connected",
      "verified",
      "failed",
    ])
      .default("not_connected")
      .notNull(),
    subscriptionStatus: mysqlEnum("subscriptionStatus", [
      "free",
      "basic_active",
      "featured_active",
      "cancelled",
    ])
      .default("free")
      .notNull(),
    subscriptionRenewsAt: timestamp("subscriptionRenewsAt"),
    totalEarningsCents: int("totalEarningsCents").default(0).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    businessIdIdx: index("businessIdIdx").on(table.businessId),
    stripeAccountIdIdx: index("stripeAccountIdIdx").on(table.stripeAccountId),
    businessFk: foreignKey({
      columns: [table.businessId],
      foreignColumns: [businesses.id],
    }),
  })
);

export type VendorMeta = typeof vendorsMeta.$inferSelect;
export type InsertVendorMeta = typeof vendorsMeta.$inferInsert;

/**
 * Business agreements table - terms and conditions acceptance
 */
export const agreements = mysqlTable(
  "agreements",
  {
    id: int("id").autoincrement().primaryKey(),
    businessId: int("businessId").notNull(),
    agreementType: mysqlEnum("agreementType", [
      "terms_of_service",
      "privacy_policy",
      "vendor_agreement",
    ]).notNull(),
    version: varchar("version", { length: 20 }).notNull(), // e.g., "1.0", "2.1"
    acceptedAt: timestamp("acceptedAt").notNull(),
    ipAddress: varchar("ipAddress", { length: 45 }),
    userAgent: text("userAgent"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    businessIdIdx: index("businessIdIdx").on(table.businessId),
    businessFk: foreignKey({
      columns: [table.businessId],
      foreignColumns: [businesses.id],
    }),
  })
);

export type Agreement = typeof agreements.$inferSelect;
export type InsertAgreement = typeof agreements.$inferInsert;

/**
 * Consents table - audit-ready consent logs with immutable hashes
 * Specification: (id, userId, action, timestamp, immutableHash)
 */
export const consents = mysqlTable(
  "consents",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    action: varchar("action", { length: 255 }).notNull(), // consent action taken
    timestamp: timestamp("timestamp").defaultNow().notNull(),
    immutableHash: varchar("immutableHash", { length: 64 }).notNull(), // SHA-256 hash for integrity
  },
  table => ({
    userIdIdx: index("userIdIdx").on(table.userId),
    timestampIdx: index("timestampIdx").on(table.timestamp),
    userFk: foreignKey({ columns: [table.userId], foreignColumns: [users.id] }),
  })
);

export type Consent = typeof consents.$inferSelect;
export type InsertConsent = typeof consents.$inferInsert;

/**
 * Email verification tokens for passwordless authentication
 */
export const emailTokens = mysqlTable(
  "email_tokens",
  {
    id: int("id").autoincrement().primaryKey(),
    email: varchar("email", { length: 320 }).notNull(),
    token: varchar("token", { length: 255 }).notNull().unique(),
    expiresAt: timestamp("expiresAt").notNull(),
    usedAt: timestamp("usedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    emailIdx: index("emailIdx").on(table.email),
    tokenIdx: index("tokenIdx").on(table.token),
  })
);

export type EmailToken = typeof emailTokens.$inferSelect;
export type InsertEmailToken = typeof emailTokens.$inferInsert;

/**
 * Relations for type-safe queries
 */
export const usersRelations = relations(users, ({ many }) => ({
  businesses: many(businesses),
  consents: many(consents),
}));

export const businessesRelations = relations(businesses, ({ one, many }) => ({
  owner: one(users, { fields: [businesses.ownerId], references: [users.id] }),
  agreements: many(agreements),
  vendorMeta: one(vendorsMeta, {
    fields: [businesses.id],
    references: [vendorsMeta.businessId],
  }),
}));

export const agreementsRelations = relations(agreements, ({ one }) => ({
  business: one(businesses, {
    fields: [agreements.businessId],
    references: [businesses.id],
  }),
}));

export const consentsRelations = relations(consents, ({ one }) => ({
  user: one(users, { fields: [consents.userId], references: [users.id] }),
}));

/**
 * PHASE 4 MARKETPLACE TABLES
 * ===========================
 */

/**
 * Business claims table - Track vendor upgrade claims with approval workflow
 * Workflow: PENDING → APPROVED → CLAIMED (or REJECTED at any step)
 */
export const businessClaims = mysqlTable(
  "business_claims",
  {
    id: int("id").autoincrement().primaryKey(),
    businessId: int("businessId").notNull().unique(), // One active claim per business
    userId: int("userId").notNull(), // Who submitted the claim
    status: mysqlEnum("claimStatus", [
      "pending",
      "approved",
      "claimed",
      "rejected",
    ])
      .default("pending")
      .notNull(),
    verificationCode: varchar("verificationCode", { length: 255 }), // Email verification code
    verificationCodeExpiresAt: timestamp("verificationCodeExpiresAt"),
    verifiedAt: timestamp("verifiedAt"), // When email verification completed
    approvedAt: timestamp("approvedAt"), // When admin approved claim
    claimedAt: timestamp("claimedAt"), // When business owner confirmed claim
    adminNotes: text("adminNotes"), // Admin review notes
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    businessIdIdx: index("businessIdIdx").on(table.businessId),
    userIdIdx: index("userIdIdx").on(table.userId),
    statusIdx: index("statusIdx").on(table.status),
    businessFk: foreignKey({
      columns: [table.businessId],
      foreignColumns: [businesses.id],
    }),
    userFk: foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
    }),
  })
);

export type BusinessClaim = typeof businessClaims.$inferSelect;
export type InsertBusinessClaim = typeof businessClaims.$inferInsert;

/**
 * Products table - Vendor marketplace products/services
 * Links to vendors_meta, tracks fulfillment and pricing
 */
export const products = mysqlTable(
  "products",
  {
    id: int("id").autoincrement().primaryKey(),
    vendorId: int("vendorId").notNull(), // References vendors_meta.businessId
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(), // in cents/dollars
    category: varchar("category", { length: 100 }), // e.g., "services", "products", "packages"
    kind: mysqlEnum("kind", ["service", "product", "package"])
      .default("service")
      .notNull(),
    fulfillmentMethod: mysqlEnum("fulfillmentMethod", [
      "pickup",
      "delivery",
      "both",
    ])
      .default("both")
      .notNull(),
    stockQuantity: int("stockQuantity").default(999), // 999 = unlimited
    isActive: boolean("isActive").default(true).notNull(),
    stripeProductId: varchar("stripeProductId", { length: 255 }), // Stripe product ID
    stripePriceId: varchar("stripePriceId", { length: 255 }), // Stripe price ID
    imageUrl: varchar("imageUrl", { length: 500 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    vendorIdIdx: index("vendorIdIdx").on(table.vendorId),
    categoryIdx: index("categoryIdx").on(table.category),
    kindIdx: index("kindIdx").on(table.kind),
  })
);

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

/**
 * Orders table - Track marketplace transactions
 * Webhook-driven status transitions from Stripe
 */
export const orders = mysqlTable(
  "orders",
  {
    id: int("id").autoincrement().primaryKey(),
    buyerId: int("buyerId").notNull(), // Customer
    vendorId: int("vendorId").notNull(), // Vendor/business
    productId: int("productId").notNull(), // Product purchased
    quantity: int("quantity").default(1).notNull(),
    unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(), // Price at purchase time
    subtotalCents: int("subtotalCents").notNull(), // quantity * unitPrice
    platformFeeCents: int("platformFeeCents").notNull(), // 8% or 6% depending on tier
    stripeFeesCents: int("stripeFeesCents").default(0), // Stripe processing fees
    totalCents: int("totalCents").notNull(), // subtotal + platformFee + stripeFeeCents
    status: mysqlEnum("orderStatus", [
      "pending",
      "completed",
      "failed",
      "refunded",
      "disputed",
    ])
      .default("pending")
      .notNull(),
    stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }), // Idempotency reference
    stripePaymentMethodId: varchar("stripePaymentMethodId", { length: 255 }), // How they paid
    fulfillmentStatus: mysqlEnum("fulfillmentStatus", [
      "pending",
      "ready",
      "completed",
      "cancelled",
    ])
      .default("pending")
      .notNull(),
    shippingAddress: text("shippingAddress"), // JSON object {street, suburb, postcode}
    notes: text("notes"), // Buyer notes
    failureReason: text("failureReason"), // Stripe error message if failed
    completedAt: timestamp("completedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    buyerIdIdx: index("buyerIdIdx").on(table.buyerId),
    vendorIdIdx: index("vendorIdIdx").on(table.vendorId),
    productIdIdx: index("productIdIdx").on(table.productId),
    statusIdx: index("statusIdx").on(table.status),
    stripePaymentIntentIdIdx: index("stripePaymentIntentIdIdx").on(
      table.stripePaymentIntentId
    ),
    buyerFk: foreignKey({
      columns: [table.buyerId],
      foreignColumns: [users.id],
    }),
  })
);

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

/**
 * Refund requests table - Track refund workflow
 * Initiated by buyer, approved/rejected by vendor or admin
 */
export const refundRequests = mysqlTable(
  "refund_requests",
  {
    id: int("id").autoincrement().primaryKey(),
    orderId: int("orderId").notNull(),
    buyerId: int("buyerId").notNull(),
    reason: varchar("reason", { length: 255 }).notNull(), // e.g., "not_as_described", "changed_mind", "defective"
    description: text("description"), // Detailed explanation
    status: mysqlEnum("refundStatus", [
      "pending",
      "approved",
      "rejected",
      "processing",
      "completed",
    ])
      .default("pending")
      .notNull(),
    refundAmountCents: int("refundAmountCents"), // Refund amount (may be partial)
    stripeRefundId: varchar("stripeRefundId", { length: 255 }), // Stripe refund ID
    vendorResponse: text("vendorResponse"), // Vendor's reply to refund request
    respondedAt: timestamp("respondedAt"),
    processedAt: timestamp("processedAt"), // When refund was issued
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    orderIdIdx: index("orderIdIdx").on(table.orderId),
    buyerIdIdx: index("buyerIdIdx").on(table.buyerId),
    statusIdx: index("statusIdx").on(table.status),
    buyerFk: foreignKey({
      columns: [table.buyerId],
      foreignColumns: [users.id],
    }),
  })
);

export type RefundRequest = typeof refundRequests.$inferSelect;
export type InsertRefundRequest = typeof refundRequests.$inferInsert;

/**
 * Dispute log table - Track disputes between buyer and vendor
 * Escalation channel when refund request resolution fails
 */
export const disputeLogs = mysqlTable(
  "dispute_logs",
  {
    id: int("id").autoincrement().primaryKey(),
    orderId: int("orderId").notNull(),
    buyerId: int("buyerId").notNull(),
    vendorId: int("vendorId").notNull(),
    refundRequestId: int("refundRequestId"), // Link to originating refund request
    status: mysqlEnum("disputeStatus", [
      "open",
      "under_review",
      "resolved",
      "escalated",
    ])
      .default("open")
      .notNull(),
    reason: text("reason"), // Dispute summary
    buyerEvidence: text("buyerEvidence"), // JSON array of evidence URLs
    vendorResponse: text("vendorResponse"),
    adminDecision: text("adminDecision"), // Admin's ruling
    resolutionStatus: mysqlEnum("resolutionStatus", [
      "buyer_refund",
      "vendor_keeps",
      "split",
    ]),
    decidedAt: timestamp("decidedAt"),
    decidedBy: int("decidedBy"), // Admin user ID
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    orderIdIdx: index("orderIdIdx").on(table.orderId),
    buyerIdIdx: index("buyerIdIdx").on(table.buyerId),
    vendorIdIdx: index("vendorIdIdx").on(table.vendorId),
    statusIdx: index("statusIdx").on(table.status),
    buyerFk: foreignKey({
      columns: [table.buyerId],
      foreignColumns: [users.id],
    }),
    vendorFk: foreignKey({
      columns: [table.vendorId],
      foreignColumns: [users.id],
    }),
  })
);

export type DisputeLog = typeof disputeLogs.$inferSelect;
export type InsertDisputeLog = typeof disputeLogs.$inferInsert;

/**
 * PHASE 4 SCHEMA EXTENSIONS
 * =========================
 * These columns are added to existing tables via ALTER statements
 */

/**
 * Businesses table extensions (added via migration):
 * - vendorTier: "none" | "basic" | "featured" (tracks subscription status)
 * - vendorTierExpiresAt: subscription renewal date
 * - isFeatured: boolean (currently featured in marketplace)
 * - featuredUntil: when featured status expires
 */

/**
 * VendorsMeta table extensions (added via migration):
 * - stripeConnectAccountId: for Connect onboarding
 * - bankAccountStatus: "not_connected" | "verified" | "failed"
 * - subscriptionStatus: "free" | "basic_active" | "featured_active" | "cancelled"
 * - subscriptionRenewsAt: next billing date
 * - totalEarningsCents: cumulative earnings
 */

/**
 * Relations for Phase 4 tables
 */
export const businessClaimsRelations = relations(businessClaims, ({ one }) => ({
  business: one(businesses, {
    fields: [businessClaims.businessId],
    references: [businesses.id],
  }),
  user: one(users, {
    fields: [businessClaims.userId],
    references: [users.id],
  }),
}));

export const productsRelations = relations(products, ({ many }) => ({
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  buyer: one(users, { fields: [orders.buyerId], references: [users.id] }),
  product: one(products, {
    fields: [orders.productId],
    references: [products.id],
  }),
  refunds: many(refundRequests),
  disputes: many(disputeLogs),
}));

export const refundRequestsRelations = relations(refundRequests, ({ one }) => ({
  order: one(orders, {
    fields: [refundRequests.orderId],
    references: [orders.id],
  }),
  buyer: one(users, {
    fields: [refundRequests.buyerId],
    references: [users.id],
  }),
}));

export const disputeLogsRelations = relations(disputeLogs, ({ one }) => ({
  order: one(orders, {
    fields: [disputeLogs.orderId],
    references: [orders.id],
  }),
  buyer: one(users, {
    fields: [disputeLogs.buyerId],
    references: [users.id],
  }),
  vendor: one(users, {
    fields: [disputeLogs.vendorId],
    references: [users.id],
  }),
}));

/**
 * PHASE 5 SHOPPING CART & NOTIFICATIONS
 * =====================================
 */

/**
 * Shopping cart table - Persistent multi-item cart storage
 * Items are grouped by user and synced from localStorage
 */
export const carts = mysqlTable(
  "carts",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    items: text("items").notNull(), // JSON array: [{productId, vendorId, quantity, price, title, imageUrl}]
    totalCents: int("totalCents").default(0).notNull(), // Total price in cents
    itemCount: int("itemCount").default(0).notNull(), // Number of unique items
    expiresAt: timestamp("expiresAt"), // Cart expiry (7 days for abandoned carts)
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    userIdIdx: index("userIdIdx").on(table.userId),
    userFk: foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
    }),
  })
);

export type Cart = typeof carts.$inferSelect;
export type InsertCart = typeof carts.$inferInsert;

/**
 * Notifications table - In-app notifications for users
 * Supports order updates, refunds, claims, and system messages
 */
export const notifications = mysqlTable(
  "notifications",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    type: mysqlEnum("notificationType", [
      "order_created",
      "order_confirmed",
      "order_completed",
      "refund_requested",
      "refund_processed",
      "claim_submitted",
      "claim_approved",
      "dispute_opened",
      "system",
    ]).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    message: text("message").notNull(),
    relatedOrderId: int("relatedOrderId"), // FK to related order (optional)
    relatedRefundId: int("relatedRefundId"), // FK to related refund (optional)
    read: boolean("read").default(false).notNull(),
    actionUrl: varchar("actionUrl", { length: 500 }), // Link to related page
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    readAt: timestamp("readAt"), // When user marked as read
  },
  table => ({
    userIdIdx: index("userIdIdx").on(table.userId),
    typeIdx: index("typeIdx").on(table.type),
    readIdx: index("readIdx").on(table.read),
    userFk: foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
    }),
  })
);

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Notification preferences table - User settings for notifications
 */
export const notificationPreferences = mysqlTable(
  "notification_preferences",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().unique(),
    emailOrderUpdates: boolean("emailOrderUpdates").default(true).notNull(),
    emailRefundUpdates: boolean("emailRefundUpdates").default(true).notNull(),
    emailSystemNotifications: boolean("emailSystemNotifications")
      .default(true)
      .notNull(),
    inAppOrderUpdates: boolean("inAppOrderUpdates").default(true).notNull(),
    inAppRefundUpdates: boolean("inAppRefundUpdates").default(true).notNull(),
    inAppSystemNotifications: boolean("inAppSystemNotifications")
      .default(true)
      .notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    userIdIdx: index("userIdIdx").on(table.userId),
    userFk: foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
    }),
  })
);

export type NotificationPreference =
  typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreference =
  typeof notificationPreferences.$inferInsert;

/**
 * Relations for Phase 5 tables
 */
export const cartsRelations = relations(carts, ({ one }) => ({
  user: one(users, { fields: [carts.userId], references: [users.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const notificationPreferencesRelations = relations(
  notificationPreferences,
  ({ one }) => ({
    user: one(users, {
      fields: [notificationPreferences.userId],
      references: [users.id],
    }),
  })
);
