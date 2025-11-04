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

// ============ PHASE 4: PRODUCTS QUERIES ============

export async function createProduct(data: InsertProduct) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(products).values(data);
}

export async function getProductById(productId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(products)
    .where(eq(products.id, productId));
  return result.length > 0 ? result[0] : undefined;
}

export async function getProductsByVendorId(vendorId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(products)
    .where(and(eq(products.vendorId, vendorId), eq(products.isActive, true)))
    .orderBy(desc(products.createdAt));
}

export async function updateProduct(productId: number, data: Partial<Product>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(products).set(data).where(eq(products.id, productId));
}

export async function deactivateProduct(productId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .update(products)
    .set({ isActive: false })
    .where(eq(products.id, productId));
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
