import { eq, and, desc, like, isNull, isNotNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  businesses,
  agreements,
  consents,
  emailTokens,
  melbournSuburbs,
  vendorsMeta,
  InsertVendorMeta,
  VendorMeta,
  businessClaims,
  InsertBusinessClaim,
  BusinessClaim,
  products,
  InsertProduct,
  Product,
  orders,
  InsertOrder,
  Order,
  refundRequests,
  InsertRefundRequest,
  RefundRequest,
  disputeLogs,
  InsertDisputeLog,
  DisputeLog,
  carts,
  InsertCart,
  Cart,
  notifications,
  InsertNotification,
  Notification,
  categories,
  InsertCategory,
  Category,
  productCategories,
  InsertProductCategory,
  ProductCategory,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ USER QUERIES ============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============ BUSINESS QUERIES ============

export async function createBusiness(data: {
  ownerId: number;
  businessName: string;
  abn?: string;
  services?: string;
  about?: string;
  address?: string;
  suburb?: string;
  phone?: string;
  website?: string;
  openingHours?: string;
  profileImage?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(businesses).values(data);
  return result;
}

export async function getBusinessById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(businesses)
    .where(eq(businesses.id, id))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getBusinessesByOwnerId(ownerId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(businesses)
    .where(eq(businesses.ownerId, ownerId));
}

export async function searchBusinesses(params: {
  suburb?: string;
  businessName?: string;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(businesses.status, "active")];

  if (params.suburb) {
    conditions.push(eq(businesses.suburb, params.suburb));
  }

  if (params.businessName) {
    conditions.push(like(businesses.businessName, `%${params.businessName}%`));
  }

  const limit = params.limit || 20;
  const offset = params.offset || 0;

  return await db
    .select()
    .from(businesses)
    .where(and(...conditions))
    .limit(limit)
    .offset(offset);
}

export async function updateBusinessAbnStatus(
  businessId: number,
  status: "pending" | "verified" | "rejected"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .update(businesses)
    .set({ abnVerifiedStatus: status })
    .where(eq(businesses.id, businessId));
}

export async function updateBusinessABN(
  businessId: number,
  data: {
    abn: string;
    abnVerifiedStatus: "pending" | "verified" | "rejected";
    abnDetails?: string;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = {
    abn: data.abn,
    abnVerifiedStatus: data.abnVerifiedStatus,
  };

  // Only include abnDetails if provided
  if (data.abnDetails) {
    updateData.abnDetails = data.abnDetails;
  }

  return await db
    .update(businesses)
    .set(updateData)
    .where(eq(businesses.id, businessId));
}

// ============ AGREEMENT QUERIES ============

export async function createAgreement(data: {
  businessId: number;
  agreementType: "terms_of_service" | "privacy_policy" | "vendor_agreement";
  version: string;
  acceptedAt: Date;
  ipAddress?: string;
  userAgent?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(agreements).values(data);
}

export async function getAgreementsByBusinessId(businessId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(agreements)
    .where(eq(agreements.businessId, businessId));
}

export async function getLatestAgreement(
  businessId: number,
  agreementType: "terms_of_service" | "privacy_policy" | "vendor_agreement"
) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(agreements)
    .where(
      and(
        eq(agreements.businessId, businessId),
        eq(agreements.agreementType, agreementType)
      )
    )
    .orderBy(desc(agreements.acceptedAt))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============ CONSENT QUERIES ============

export async function getConsentsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(consents).where(eq(consents.userId, userId));
}

export async function getUserConsentActions(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(consents)
    .where(eq(consents.userId, userId))
    .orderBy(desc(consents.timestamp));
}

// Deprecated old consent functions - kept for backwards compatibility with existing router
export async function createConsent(data: any) {
  throw new Error(
    "createConsent is deprecated - use logConsent from dataApi.ts instead"
  );
}

export async function getUserConsent(userId: number, consentType: string) {
  throw new Error(
    "getUserConsent is deprecated - use getUserConsentActions instead"
  );
}

// ============ EMAIL TOKEN QUERIES ============

export async function createEmailToken(
  email: string,
  token: string,
  expiresAt: Date
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(emailTokens).values({ email, token, expiresAt });
}

export async function getEmailToken(token: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(emailTokens)
    .where(and(eq(emailTokens.token, token), isNull(emailTokens.usedAt)))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function markEmailTokenAsUsed(tokenId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .update(emailTokens)
    .set({ usedAt: new Date() })
    .where(eq(emailTokens.id, tokenId));
}

// ============ MELBOURNE SUBURBS QUERIES ============

export async function getMelbournSuburbs(limit?: number) {
  const db = await getDb();
  if (!db) return [];

  if (limit) {
    return await db.select().from(melbournSuburbs).limit(limit);
  }
  return await db.select().from(melbournSuburbs);
}

export async function getMelbournSuburbByName(suburb: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(melbournSuburbs)
    .where(eq(melbournSuburbs.suburb, suburb))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ VENDOR QUERIES ============

export async function getVendorMeta(businessId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(vendorsMeta)
    .where(eq(vendorsMeta.businessId, businessId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function createVendorMeta(
  businessId: number,
  stripeAccountId: string,
  fulfilmentTerms?: object,
  refundPolicyUrl?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const values: InsertVendorMeta = {
    businessId,
    stripeAccountId,
    fulfilmentTerms: fulfilmentTerms ? JSON.stringify(fulfilmentTerms) : null,
    refundPolicyUrl,
  };

  return await db.insert(vendorsMeta).values(values);
}

export async function updateVendorMeta(
  businessId: number,
  updates: Partial<InsertVendorMeta>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .update(vendorsMeta)
    .set(updates)
    .where(eq(vendorsMeta.businessId, businessId));
}

export async function listAllRegions() {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .selectDistinct({ region: melbournSuburbs.region })
    .from(melbournSuburbs)
    .where(isNotNull(melbournSuburbs.region));

  return result;
}

export async function getBusinessesByRegion(
  region: string,
  limit: number = 20,
  offset: number = 0
) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(businesses)
    .innerJoin(melbournSuburbs, eq(businesses.suburb, melbournSuburbs.suburb))
    .where(eq(melbournSuburbs.region, region))
    .limit(limit)
    .offset(offset);
}

// ============ PHASE 4: BUSINESS CLAIMS QUERIES ============

export async function createBusinessClaim(data: InsertBusinessClaim) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(businessClaims).values(data);
}

export async function getBusinessClaimById(claimId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(businessClaims)
    .where(eq(businessClaims.id, claimId));
  return result.length > 0 ? result[0] : undefined;
}

export async function getBusinessClaimsByBusinessId(businessId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(businessClaims)
    .where(eq(businessClaims.businessId, businessId))
    .orderBy(desc(businessClaims.createdAt));
}

export async function getActiveBusinessClaim(businessId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(businessClaims)
    .where(
      and(
        eq(businessClaims.businessId, businessId),
        eq(businessClaims.status, "pending")
      )
    )
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateBusinessClaimStatus(
  claimId: number,
  status: "pending" | "approved" | "claimed" | "rejected",
  approvedAt?: Date
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData: any = { status };
  if (approvedAt) updateData.approvedAt = approvedAt;
  return await db
    .update(businessClaims)
    .set(updateData)
    .where(eq(businessClaims.id, claimId));
}

export async function updateBusinessClaimClaimed(claimId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .update(businessClaims)
    .set({ status: "claimed", claimedAt: new Date() })
    .where(eq(businessClaims.id, claimId));
}
// ============ PHASE 4: ORDERS QUERIES ============

export async function createOrder(data: InsertOrder) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(orders).values(data);
}

export async function getOrderById(orderId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(orders).where(eq(orders.id, orderId));
  return result.length > 0 ? result[0] : undefined;
}

export async function getOrdersByBuyerId(buyerId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(orders)
    .where(eq(orders.buyerId, buyerId))
    .orderBy(desc(orders.createdAt));
}

export async function getOrdersByVendorId(vendorId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(orders)
    .where(eq(orders.vendorId, vendorId))
    .orderBy(desc(orders.createdAt));
}

export async function getOrderByStripePaymentIntentId(
  stripePaymentIntentId: string
) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(orders)
    .where(eq(orders.stripePaymentIntentId, stripePaymentIntentId));
  return result.length > 0 ? result[0] : undefined;
}

export async function updateOrderStatus(
  orderId: number,
  status: "pending" | "completed" | "failed" | "refunded" | "disputed",
  failureReason?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData: any = { status };
  if (failureReason) updateData.failureReason = failureReason;
  if (status === "completed") updateData.completedAt = new Date();
  return await db.update(orders).set(updateData).where(eq(orders.id, orderId));
}

export async function updateOrderFulfillmentStatus(
  orderId: number,
  fulfillmentStatus: "pending" | "ready" | "completed" | "cancelled"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .update(orders)
    .set({ fulfillmentStatus })
    .where(eq(orders.id, orderId));
}

// ============ PHASE 4: REFUND REQUESTS QUERIES ============

export async function createRefundRequest(data: InsertRefundRequest) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(refundRequests).values(data);
}

export async function getRefundRequestById(refundId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(refundRequests)
    .where(eq(refundRequests.id, refundId));
  return result.length > 0 ? result[0] : undefined;
}

export async function getRefundRequestsByOrderId(orderId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(refundRequests)
    .where(eq(refundRequests.orderId, orderId))
    .orderBy(desc(refundRequests.createdAt));
}

export async function getRefundRequestsByBuyerId(buyerId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(refundRequests)
    .where(eq(refundRequests.buyerId, buyerId))
    .orderBy(desc(refundRequests.createdAt));
}

export async function updateRefundRequestStatus(
  refundId: number,
  status: "pending" | "approved" | "rejected" | "processing" | "completed",
  updatedFields?: {
    vendorResponse?: string;
    stripeRefundId?: string;
    refundAmountCents?: number;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData: any = { status };
  if (updatedFields?.vendorResponse)
    updateData.vendorResponse = updatedFields.vendorResponse;
  if (updatedFields?.stripeRefundId)
    updateData.stripeRefundId = updatedFields.stripeRefundId;
  if (updatedFields?.refundAmountCents)
    updateData.refundAmountCents = updatedFields.refundAmountCents;
  if (status === "completed") updateData.processedAt = new Date();
  if (status === "approved" || status === "rejected")
    updateData.respondedAt = new Date();
  return await db
    .update(refundRequests)
    .set(updateData)
    .where(eq(refundRequests.id, refundId));
}

export async function getRefundRequestsForVendor(businessId: number) {
  const db = await getDb();
  if (!db) return [];
  // Get all refunds for orders where this business is the vendor
  return await db
    .select()
    .from(refundRequests)
    .innerJoin(orders, eq(refundRequests.orderId, orders.id))
    .where(eq(orders.vendorId, businessId))
    .orderBy(desc(refundRequests.createdAt))
    .then(results => results.map(r => r.refund_requests));
}

export async function getAllRefundRequests() {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(refundRequests)
    .orderBy(desc(refundRequests.createdAt));
}

// ============ PHASE 4: DISPUTE LOGS QUERIES ============

export async function createDisputeLog(data: InsertDisputeLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(disputeLogs).values(data);
}

export async function getDisputeLogById(disputeId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(disputeLogs)
    .where(eq(disputeLogs.id, disputeId));
  return result.length > 0 ? result[0] : undefined;
}

export async function getDisputeLogsByOrderId(orderId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(disputeLogs)
    .where(eq(disputeLogs.orderId, orderId))
    .orderBy(desc(disputeLogs.createdAt));
}

export async function getOpenDisputes() {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(disputeLogs)
    .where(eq(disputeLogs.status, "open"))
    .orderBy(desc(disputeLogs.createdAt));
}

export async function updateDisputeLogStatus(
  disputeId: number,
  status: "open" | "under_review" | "resolved" | "escalated",
  updatedFields?: {
    adminDecision?: string;
    resolutionStatus?: "buyer_refund" | "vendor_keeps" | "split";
    decidedBy?: number;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData: any = { status };
  if (updatedFields?.adminDecision)
    updateData.adminDecision = updatedFields.adminDecision;
  if (updatedFields?.resolutionStatus)
    updateData.resolutionStatus = updatedFields.resolutionStatus;
  if (updatedFields?.decidedBy) updateData.decidedBy = updatedFields.decidedBy;
  if (status === "resolved") updateData.decidedAt = new Date();
  return await db
    .update(disputeLogs)
    .set(updateData)
    .where(eq(disputeLogs.id, disputeId));
}

// ============ PHASE 4: BUSINESS EXTENSIONS QUERIES ============

export async function updateBusinessVendorTier(
  businessId: number,
  vendorTier: "none" | "basic" | "featured",
  vendorTierExpiresAt?: Date
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData: any = { vendorTier };
  if (vendorTierExpiresAt) updateData.vendorTierExpiresAt = vendorTierExpiresAt;
  return await db
    .update(businesses)
    .set(updateData)
    .where(eq(businesses.id, businessId));
}

export async function updateBusinessFeaturedStatus(
  businessId: number,
  isFeatured: boolean,
  featuredUntil?: Date
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData: any = { isFeatured };
  if (featuredUntil) updateData.featuredUntil = featuredUntil;
  return await db
    .update(businesses)
    .set(updateData)
    .where(eq(businesses.id, businessId));
}

export async function getFeaturedBusinesses(limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(businesses)
    .where(
      and(eq(businesses.isFeatured, true), eq(businesses.status, "active"))
    )
    .orderBy(desc(businesses.updatedAt))
    .limit(limit)
    .offset(offset);
}

// ============ PHASE 4: VENDORS META EXTENSIONS QUERIES ============

export async function updateVendorSubscriptionStatus(
  vendorId: number,
  subscriptionStatus: "free" | "basic_active" | "featured_active" | "cancelled",
  updatedFields?: {
    stripeConnectAccountId?: string;
    bankAccountStatus?: "not_connected" | "verified" | "failed";
    subscriptionRenewsAt?: Date;
    totalEarningsCents?: number;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData: any = { subscriptionStatus };
  if (updatedFields?.stripeConnectAccountId)
    updateData.stripeConnectAccountId = updatedFields.stripeConnectAccountId;
  if (updatedFields?.bankAccountStatus)
    updateData.bankAccountStatus = updatedFields.bankAccountStatus;
  if (updatedFields?.subscriptionRenewsAt)
    updateData.subscriptionRenewsAt = updatedFields.subscriptionRenewsAt;
  if (updatedFields?.totalEarningsCents !== undefined)
    updateData.totalEarningsCents = updatedFields.totalEarningsCents;
  return await db
    .update(vendorsMeta)
    .set(updateData)
    .where(eq(vendorsMeta.businessId, vendorId));
}

export async function incrementVendorEarnings(
  vendorId: number,
  amountCents: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const vendor = await getVendorMeta(vendorId);
  if (!vendor) throw new Error("Vendor not found");
  return await db
    .update(vendorsMeta)
    .set({
      totalEarningsCents: (vendor.totalEarningsCents || 0) + amountCents,
    })
    .where(eq(vendorsMeta.businessId, vendorId));
}

// ============ PHASE 5: CART QUERIES ============

export async function getCartByUserId(userId: number): Promise<Cart | null> {
  const db = await getDb();
  if (!db) return null;
  const [cart] = await db
    .select()
    .from(carts)
    .where(eq(carts.userId, userId))
    .limit(1);
  return cart || null;
}

export async function createOrUpdateCart(
  userId: number,
  cartData: { items: string; totalCents: number; itemCount: number }
): Promise<Cart> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await getCartByUserId(userId);
  if (existing) {
    await db
      .update(carts)
      .set(cartData)
      .where(eq(carts.userId, userId));
    return (await getCartByUserId(userId))!;
  }

  const result = await db.insert(carts).values({
    userId,
    ...cartData,
  });
  return (await getCartByUserId(userId))!;
}

export async function clearCart(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(carts).where(eq(carts.userId, userId));
}

// ============ PHASE 5: NOTIFICATION QUERIES ============

export async function getNotificationsByUserId(
  userId: number,
  limit: number = 20,
  offset: number = 0
): Promise<Notification[]> {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function createNotification(
  notifData: InsertNotification
): Promise<Notification> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(notifications).values(notifData);

  // Return the created notification
  const [created] = await db
    .select()
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, notifData.userId),
        eq(notifications.type, notifData.type)
      )
    )
    .orderBy(desc(notifications.createdAt))
    .limit(1);
  return created;
}

export async function markNotificationAsRead(
  notificationId: number,
  userId: number
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(notifications)
    .set({ read: true, readAt: new Date() })
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId)
      )
    );
}

export async function deleteNotification(
  notificationId: number,
  userId: number
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .delete(notifications)
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId)
      )
    );
}

// ============================================================================
// Product Functions (Phase 5 Step 2 Packet 5.7)
// ============================================================================

/**
 * Create a new product for a vendor
 * Includes AuditLog write for compliance
 */
export async function createProduct(
  vendorId: number,
  input: Omit<InsertProduct, "vendorId" | "id" | "createdAt" | "updatedAt">
): Promise<Product> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const created = await db
    .insert(products)
    .values({
      vendorId,
      ...input,
    })
    .$returningId();

  // Fetch the created product
  const product = await db
    .select()
    .from(products)
    .where(eq(products.id, created[0].id))
    .limit(1);

  // TODO: Write AuditLog entry (Phase 5.3)
  // await writeAuditLog('product.create', vendorId, product[0].id);

  return product[0];
}

/**
 * Update an existing product
 * Ownership must be verified by caller
 */
export async function updateProduct(
  productId: number,
  input: Partial<Omit<InsertProduct, "id" | "vendorId" | "createdAt" | "updatedAt">>
): Promise<Product> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(products)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(eq(products.id, productId));

  // Fetch updated product
  const updated = await db
    .select()
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);

  // TODO: Write AuditLog entry (Phase 5.3)
  // await writeAuditLog('product.update', updated[0].vendorId, productId);

  return updated[0];
}

/**
 * List products by vendor (active only)
 * Paginated with limit and offset
 */
export async function listProductsByVendor(
  vendorId: number,
  limit: number = 20,
  offset: number = 0
): Promise<Product[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(products)
    .where(and(eq(products.vendorId, vendorId), eq(products.isActive, true)))
    .orderBy(desc(products.createdAt))
    .limit(limit)
    .offset(offset);
}

/**
 * Get a single product by ID (public read)
 */
export async function getProductById(productId: number): Promise<Product | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);

  return result[0];
}

/**
 * Soft delete a product (set isActive = false)
 * Ownership must be verified by caller
 */
export async function deactivateProduct(productId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(products)
    .set({
      isActive: false,
      updatedAt: new Date(),
    })
    .where(eq(products.id, productId));

  // TODO: Write AuditLog entry (Phase 5.3)
  // await writeAuditLog('product.deactivate', vendorId, productId);
}

/**
 * Count active products for a vendor
 * Used for tier limit validation
 */
export async function countProductsByVendor(vendorId: number): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(products)
    .where(and(eq(products.vendorId, vendorId), eq(products.isActive, true)));

  return result.length;
}

/**
 * Get vendor's tier limit and current usage
 * Returns: { current, limit, canAdd, tier }
 */
export async function getVendorTierLimit(vendorId: number): Promise<{
  current: number;
  limit: number;
  canAdd: boolean;
  tier: string;
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get vendor meta to check tier
  const vendorMeta = await db
    .select()
    .from(vendorsMeta)
    .where(eq(vendorsMeta.businessId, vendorId))
    .limit(1);

  // Default to free tier if no vendor meta found
  const tier = vendorMeta[0]?.subscriptionStatus || "free";

  // Tier limits from SSOT §3
  const tierLimits: Record<string, number> = {
    free: 0,
    basic_active: 12,
    featured_active: 48,
    cancelled: 0,
  };

  const limit = tierLimits[tier] || 0;
  const current = await countProductsByVendor(vendorId);

  return {
    current,
    limit,
    canAdd: current < limit,
    tier,
  };
}

// ============ CATEGORY QUERIES (Phase 5.9) ============

/**
 * Get all categories with product count
 * Public endpoint for browsing
 */
export async function getAllCategories(): Promise<
  (Category & { productCount: number })[]
> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const allCategories = await db
    .select()
    .from(categories);

  // Get product count for each category
  const withCounts = await Promise.all(
    allCategories.map(async (category: Category) => {
      const countResult = await db
        .select()
        .from(productCategories)
        .where(eq(productCategories.categoryId, category.id));
      return { ...category, productCount: countResult.length };
    })
  );

  return withCounts;
}

/**
 * Create a new category
 * Admin only
 */
export async function createCategory(data: {
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
}): Promise<Category> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .insert(categories)
    .values({
      name: data.name,
      slug: data.slug,
      description: data.description || null,
      icon: data.icon || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

  // Fetch the created category to return it
  const created = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, data.slug))
    .limit(1);

  return created[0];
}

/**
 * Get products by category slug with pagination
 * Returns category info + paginated products
 */
export async function getProductsByCategory(
  slug: string,
  limit: number = 20,
  offset: number = 0
): Promise<{
  category: Category | null;
  products: Product[];
  total: number;
} | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Find category by slug
  const categoryList = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1);

  const foundCategory = categoryList[0];
  if (!foundCategory) return null;

  // Find all product IDs for this category
  const productRows = await db
    .select({ productId: productCategories.productId })
    .from(productCategories)
    .where(eq(productCategories.categoryId, foundCategory.id));

  const productIds = productRows.map((row) => row.productId);

  if (productIds.length === 0) {
    return {
      category: foundCategory,
      products: [],
      total: 0,
    };
  }

  // Get paginated products using inArray condition
  const { inArray } = require("drizzle-orm");
  const productList = await db
    .select()
    .from(products)
    .where(inArray(products.id, productIds))
    .limit(limit)
    .offset(offset);

  return {
    category: foundCategory,
    products: productList,
    total: productIds.length,
  };
}

/**
 * Update product category assignments
 * Replaces all existing category assignments with new ones
 */
export async function updateProductCategories(
  productId: number,
  categoryIds: number[]
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Delete existing category assignments
  await db
    .delete(productCategories)
    .where(eq(productCategories.productId, productId));

  // Insert new category assignments if any
  if (categoryIds.length > 0) {
    await db.insert(productCategories).values(
      categoryIds.map((categoryId) => ({
        productId,
        categoryId,
        createdAt: new Date(),
      }))
    );
  }

  // Update product's updatedAt timestamp
  await db
    .update(products)
    .set({ updatedAt: new Date() })
    .where(eq(products.id, productId));
}

// ============ SUBSCRIPTION MANAGEMENT (Phase 5.3) ============

/**
 * Get vendor subscription status by vendor ID (businessId)
 * Returns current subscription state and renewal date
 */
export async function getVendorSubscription(vendorId: number): Promise<VendorMeta | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const vendorMeta = await db
    .select()
    .from(vendorsMeta)
    .where(eq(vendorsMeta.businessId, vendorId))
    .limit(1);

  return vendorMeta.length > 0 ? vendorMeta[0] : null;
}

/**
 * Get vendor's associated business for tier information
 * Returns business with vendorTier and tier expiration
 */
export async function getVendorBusiness(vendorId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const business = await db
    .select()
    .from(businesses)
    .where(eq(businesses.id, vendorId))
    .limit(1);

  return business.length > 0 ? business[0] : null;
}

/**
 * Create or update Stripe customer mapping
 * Used when vendor initiates subscription upgrade
 */
export async function upsertStripeCustomer(
  vendorId: number,
  stripeCustomerId: string
): Promise<VendorMeta> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if vendor exists
  const existing = await db
    .select()
    .from(vendorsMeta)
    .where(eq(vendorsMeta.businessId, vendorId))
    .limit(1);

  if (existing.length > 0) {
    // Update existing
    await db
      .update(vendorsMeta)
      .set({
        stripeAccountId: stripeCustomerId,
        updatedAt: new Date(),
      })
      .where(eq(vendorsMeta.businessId, vendorId));

    return existing[0];
  }

  // Create new vendors_meta entry
  await db.insert(vendorsMeta).values({
    businessId: vendorId,
    stripeAccountId: stripeCustomerId,
    subscriptionStatus: "free",
  });

  const created = await db
    .select()
    .from(vendorsMeta)
    .where(eq(vendorsMeta.businessId, vendorId))
    .limit(1);

  return created[0];
}

/**
 * Update subscription status after Stripe confirmation
 * Called by webhook handler when subscription created/updated/cancelled
 */
export async function updateSubscriptionStatus(
  vendorId: number,
  status: "free" | "basic_active" | "featured_active" | "cancelled",
  renewsAt?: Date
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Update vendors_meta subscription status
  await db
    .update(vendorsMeta)
    .set({
      subscriptionStatus: status,
      subscriptionRenewsAt: renewsAt || null,
      updatedAt: new Date(),
    })
    .where(eq(vendorsMeta.businessId, vendorId));

  // Update business tier based on subscription status
  let newTier: "none" | "basic" | "featured" = "none";
  let expiresAt: Date | null = null;

  if (status === "basic_active" && renewsAt) {
    newTier = "basic";
    expiresAt = renewsAt;
  } else if (status === "featured_active" && renewsAt) {
    newTier = "featured";
    expiresAt = renewsAt;
  }

  await db
    .update(businesses)
    .set({
      vendorTier: newTier,
      vendorTierExpiresAt: expiresAt,
      updatedAt: new Date(),
    })
    .where(eq(businesses.id, vendorId));
}

/**
 * Get vendor tier limit based on current subscription
 * BASIC: 12 products, FEATURED: 48 products, free: 3 products
 */
export async function getVendorTierLimitInfo(vendorId: number): Promise<{
  tier: "none" | "basic" | "featured";
  limit: number;
  current: number;
  canAdd: boolean;
  expiresAt?: Date;
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const business = await getVendorBusiness(vendorId);
  if (!business) {
    throw new Error(`Business not found for vendor ${vendorId}`);
  }

  const productCount = await db
    .select()
    .from(products)
    .where(eq(products.vendorId, vendorId));

  const tier = business.vendorTier || "none";
  let limit = 3; // Free tier

  if (tier === "basic") {
    limit = 12;
  } else if (tier === "featured") {
    limit = 48;
  }

  return {
    tier,
    limit,
    current: productCount.length,
    canAdd: productCount.length < limit,
    expiresAt: business.vendorTierExpiresAt || undefined,
  };
}

/**
 * Get all vendors with active subscriptions (for billing notifications)
 * Used by scheduled jobs to check renewal dates
 */
export async function getActiveVendorsForBilling(): Promise<VendorMeta[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(vendorsMeta)
    .where(
      and(
        isNotNull(vendorsMeta.subscriptionRenewsAt),
        isNotNull(vendorsMeta.stripeAccountId)
      )
    );
}
