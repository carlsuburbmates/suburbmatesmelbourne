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
