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
