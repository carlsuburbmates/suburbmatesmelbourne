import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";
import { trackBusinessCreated } from "./_core/notification";
import { logConsent } from "./_core/dataApi";
import crypto from "crypto";
import {
  createOrderPaymentIntent,
  createOrderCheckoutSession,
} from "./integrations/stripe";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ============ BUSINESS ROUTER ============
  business: router({
    /**
     * List all active businesses with optional filtering
     */
    list: publicProcedure
      .input(
        z.object({
          suburb: z.string().optional(),
          businessName: z.string().optional(),
          limit: z.number().min(1).max(100).default(20),
          offset: z.number().min(0).default(0),
        })
      )
      .query(async ({ input }) => {
        return await db.searchBusinesses({
          suburb: input.suburb,
          businessName: input.businessName,
          limit: input.limit,
          offset: input.offset,
        });
      }),

    /**
     * Get a specific business by ID
     */
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const business = await db.getBusinessById(input.id);
        if (!business) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Business not found",
          });
        }
        return business;
      }),

    /**
     * Get all businesses owned by the current user
     */
    myBusinesses: protectedProcedure.query(async ({ ctx }) => {
      return await db.getBusinessesByOwnerId(ctx.user.id);
    }),

    /**
     * Create a new business (requires business_owner or vendor role)
     */
    create: protectedProcedure
      .input(
        z.object({
          businessName: z.string().min(1).max(255),
          abn: z.string().length(11).optional(),
          services: z.string().optional(),
          about: z.string().optional(),
          address: z.string().optional(),
          suburb: z.string().optional(),
          phone: z.string().optional(),
          website: z.string().url().optional(),
          openingHours: z.string().optional(),
          profileImage: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Verify user role
        if (!["business_owner", "vendor", "admin"].includes(ctx.user.role)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only business owners and vendors can create businesses",
          });
        }

        const business = await db.createBusiness({
          ownerId: ctx.user.id,
          businessName: input.businessName,
          abn: input.abn,
          services: input.services,
          about: input.about,
          address: input.address,
          suburb: input.suburb,
          phone: input.phone,
          website: input.website,
          openingHours: input.openingHours,
          profileImage: input.profileImage,
        });

        // Track business creation event in PostHog
        await trackBusinessCreated(ctx.user.id.toString(), {
          businessName: input.businessName,
          suburb: input.suburb,
          category: input.services,
          hasABN: !!input.abn,
        });

        return { success: true, businessId: business[0].insertId };
      }),

    /**
     * Submit ABN for verification
     */
    submitABN: protectedProcedure
      .input(
        z.object({
          businessId: z.number(),
          abn: z.string().min(11).max(11),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Verify user owns the business or is admin
        const business = await db.getBusinessById(input.businessId);
        if (!business) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Business not found",
          });
        }

        if (business.ownerId !== ctx.user.id && ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can only verify ABN for your own businesses",
          });
        }

        try {
          // Import ABN service dynamically to avoid startup issues
          const { getABNDetails } = await import("./lib/abr");

          // Lookup ABN details
          const abnDetails = await getABNDetails(input.abn);

          if (!abnDetails) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "ABN not found in Australian Business Register",
            });
          }

          if (!abnDetails.isActive) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "ABN is not active in Australian Business Register",
            });
          }

          // Update business with verified ABN
          await db.updateBusinessABN(input.businessId, {
            abn: input.abn,
            abnVerifiedStatus: "verified",
            abnDetails: JSON.stringify(abnDetails),
          });

          return {
            success: true,
            abnDetails,
            message: "ABN successfully verified",
          };
        } catch (error) {
          console.error("ABN verification failed:", error);

          // Update status to rejected
          await db.updateBusinessABN(input.businessId, {
            abn: input.abn,
            abnVerifiedStatus: "rejected",
          });

          if (error instanceof TRPCError) {
            throw error;
          }

          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              error instanceof Error
                ? error.message
                : "ABN verification failed",
          });
        }
      }),

    /**
     * Get Melbourne suburbs for geofencing
     */
    getMelbournSuburbs: publicProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ input }) => {
        return await db.getMelbournSuburbs(input.limit);
      }),
  }),

  // ============ AGREEMENT ROUTER ============
  agreement: router({
    /**
     * Accept an agreement (terms, privacy policy, vendor agreement)
     */
    accept: protectedProcedure
      .input(
        z.object({
          businessId: z.number(),
          agreementType: z.enum([
            "terms_of_service",
            "privacy_policy",
            "vendor_agreement",
          ]),
          version: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Verify user owns the business
        const business = await db.getBusinessById(input.businessId);
        if (!business || business.ownerId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message:
              "You do not have permission to accept agreements for this business",
          });
        }

        const agreement = await db.createAgreement({
          businessId: input.businessId,
          agreementType: input.agreementType,
          version: input.version,
          acceptedAt: new Date(),
          ipAddress: ctx.req.ip,
          userAgent: ctx.req.headers["user-agent"],
        });

        return { success: true, agreementId: agreement[0].insertId };
      }),

    /**
     * Get all agreements for a business
     */
    getByBusinessId: publicProcedure
      .input(z.object({ businessId: z.number() }))
      .query(async ({ input }) => {
        return await db.getAgreementsByBusinessId(input.businessId);
      }),

    /**
     * Get the latest version of a specific agreement type
     */
    getLatest: publicProcedure
      .input(
        z.object({
          businessId: z.number(),
          agreementType: z.enum([
            "terms_of_service",
            "privacy_policy",
            "vendor_agreement",
          ]),
        })
      )
      .query(async ({ input }) => {
        return await db.getLatestAgreement(
          input.businessId,
          input.agreementType
        );
      }),
  }),

  // ============ CONSENT ROUTER ============
  consent: router({
    /**
     * Log a consent action (new immutable hash system)
     * Deprecated: Use consent.log instead for audit-ready consent tracking
     */
    set: protectedProcedure
      .input(
        z.object({
          consentType: z.enum([
            "marketing_emails",
            "sms_notifications",
            "analytics",
            "third_party_sharing",
          ]),
          granted: z.boolean(),
          version: z.string(),
          expiresAt: z.date().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Map old consent format to new action-based system
        const action = `${input.consentType}_${input.granted ? "granted" : "revoked"}_v${input.version}`;
        const result = await logConsent(ctx.user.id, action);

        return { success: true, consentId: result.id };
      }),

    /**
     * Get all consents for current user (new immutable hash system)
     */
    getAll: protectedProcedure.query(async ({ ctx }) => {
      const consents = await db.getConsentsByUserId(ctx.user.id);
      return consents;
    }),

    /**
     * Get actions for current user containing a specific consent type (new immutable hash system)
     * Returns all logged actions that include the consentType string
     */
    get: protectedProcedure
      .input(
        z.object({
          consentType: z.enum([
            "marketing_emails",
            "sms_notifications",
            "analytics",
            "third_party_sharing",
          ]),
        })
      )
      .query(async ({ ctx, input }) => {
        const allActions = await db.getUserConsentActions(ctx.user.id);
        // Filter actions that contain the consent type in the action string
        const filteredActions = allActions.filter(consent =>
          consent.action.includes(input.consentType)
        );
        return filteredActions;
      }),

    /**
     * Log an immutable consent action with cryptographic hash
     * This creates an audit-ready record for compliance tracking
     */
    log: protectedProcedure
      .input(
        z.object({
          action: z.string().min(1).max(255),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const result = await logConsent(ctx.user.id, input.action);
        return {
          success: true,
          consentId: result.id,
          immutableHash: result.immutableHash,
        };
      }),
  }),

  // ============ EMAIL VERIFICATION ROUTER ============
  emailVerification: router({
    /**
     * Request an email verification token (passwordless login)
     */
    requestToken: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ input }) => {
        // Generate a secure token
        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        await db.createEmailToken(input.email, token, expiresAt);

        // In production, send email with token link
        // For now, return token for testing
        return {
          success: true,
          message: "Email verification token sent",
          expiresAt,
        };
      }),

    /**
     * Verify an email token and create/update user
     */
    verifyToken: publicProcedure
      .input(z.object({ token: z.string() }))
      .mutation(async ({ input }) => {
        const emailToken = await db.getEmailToken(input.token);

        if (!emailToken) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Invalid or expired token",
          });
        }

        if (new Date() > emailToken.expiresAt) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Token has expired",
          });
        }

        // Mark token as used
        await db.markEmailTokenAsUsed(emailToken.id);

        // Get or create user
        let user = await db.getUserByOpenId(emailToken.email);
        if (!user) {
          // Create new user with buyer role
          await db.upsertUser({
            openId: emailToken.email,
            email: emailToken.email,
            role: "buyer",
            loginMethod: "email_link",
          });
          user = await db.getUserByOpenId(emailToken.email);
        }

        return {
          success: true,
          user,
        };
      }),
  }),

  // ============ LLM ROUTER ============
  llm: router({
    /**
     * Generate business description using AI
     */
    generateBusinessDescription: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1).max(255),
          category: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const { generateBusinessDescription } = await import("./_core/llm");
          const description = await generateBusinessDescription(
            input.name,
            input.category
          );

          return {
            success: true,
            description,
          };
        } catch (error) {
          console.error("Failed to generate business description:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              error instanceof Error
                ? error.message
                : "Failed to generate description",
          });
        }
      }),
  }),

  // ============ VENDOR ROUTER ============
  vendor: router({
    /**
     * Initiate Stripe Connect onboarding for a business
     */
    initiateStripeOnboarding: protectedProcedure
      .input(
        z.object({
          businessId: z.number(),
          redirectUrl: z.string().url(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Verify business belongs to authenticated user
        const business = await db.getBusinessById(input.businessId);
        if (!business || business.ownerId !== ctx.user?.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Not authorized to onboard this business",
          });
        }

        try {
          // TODO: Create Stripe Express account
          // const stripeAccount = await createStripeExpressAccount(...)
          // For now, return mock response
          const stripeAccountId = `acct_mock_${input.businessId}`;

          // Store in vendors_meta
          await db.createVendorMeta(input.businessId, stripeAccountId);

          // Log consent action
          await logConsent(ctx.user.id, "vendor_onboarding_initiated");

          // TODO: Return actual Stripe onboarding link
          return {
            success: true,
            stripeAccountId,
            onboardingLink: `https://stripe.com/oauth/authorize?mock=true`,
          };
        } catch (error) {
          console.error("Failed to initiate Stripe onboarding:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to initiate onboarding",
          });
        }
      }),

    /**
     * Complete Stripe onboarding (called after OAuth callback)
     */
    completeStripeOnboarding: protectedProcedure
      .input(z.object({ businessId: z.number() }))
      .query(async ({ ctx, input }) => {
        const vendor = await db.getVendorMeta(input.businessId);
        if (!vendor) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Vendor not found",
          });
        }

        // TODO: Verify Stripe account completion via Stripe API
        // For now, assume complete
        await logConsent(ctx.user.id, "vendor_onboarding_completed");

        return {
          success: true,
          vendor,
        };
      }),

    /**
     * Get vendor metadata (public)
     */
    getVendorMeta: publicProcedure
      .input(z.object({ businessId: z.number() }))
      .query(async ({ input }) => {
        const vendor = await db.getVendorMeta(input.businessId);
        if (!vendor) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Vendor not found",
          });
        }
        return vendor;
      }),

    /**
     * List all vendors with optional filtering (paginated)
     */
    listAll: publicProcedure
      .input(
        z.object({
          region: z.string().optional(),
          limit: z.number().min(1).max(100).default(20),
          offset: z.number().min(0).default(0),
        })
      )
      .query(async ({ input }) => {
        if (input.region) {
          return await db.getBusinessesByRegion(
            input.region,
            input.limit,
            input.offset
          );
        }

        // Get all businesses with vendor metadata
        const businesses = await db.searchBusinesses({
          limit: input.limit,
          offset: input.offset,
        });

        // TODO: Filter to only vendors with vendors_meta entries
        return businesses;
      }),

    /**
     * Get vendor details by business ID
     */
    getDetails: publicProcedure
      .input(z.object({ vendorId: z.number() }))
      .query(async ({ input }) => {
        const business = await db.getBusinessById(input.vendorId);
        if (!business) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Vendor not found",
          });
        }

        const vendor = await db.getVendorMeta(input.vendorId);
        return { business, vendor };
      }),

    /**
     * Get products for a vendor (public)
     */
    getProducts: publicProcedure
      .input(z.object({ vendorId: z.number() }))
      .query(async ({ input }) => {
        return await db.getProductsByVendorId(input.vendorId);
      }),

    /**
     * Create a new product for vendor (vendor only)
     */
    createProduct: protectedProcedure
      .input(
        z.object({
          vendorId: z.number(),
          title: z.string().min(1).max(255),
          description: z.string().optional(),
          price: z.number().min(0),
          category: z.string().optional(),
          kind: z.enum(["service", "product", "package"]).default("service"),
          fulfillmentMethod: z.enum(["pickup", "delivery", "both"]).default("both"),
          stockQuantity: z.number().int().default(999),
          imageUrl: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Verify vendor ownership
        const vendor = await db.getVendorMeta(input.vendorId);
        if (!vendor) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Vendor not found",
          });
        }

        const business = await db.getBusinessById(vendor.businessId);
        if (business?.ownerId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Can only create products for your vendor account",
          });
        }

        return await db.createProduct({
          vendorId: input.vendorId,
          title: input.title,
          description: input.description,
          price: String(input.price),
          category: input.category,
          kind: input.kind,
          fulfillmentMethod: input.fulfillmentMethod,
          stockQuantity: input.stockQuantity,
          imageUrl: input.imageUrl,
          isActive: true,
        });
      }),

    /**
     * Update a product (vendor only)
     */
    updateProduct: protectedProcedure
      .input(
        z.object({
          productId: z.number(),
          title: z.string().optional(),
          description: z.string().optional(),
          price: z.number().optional(),
          category: z.string().optional(),
          stockQuantity: z.number().optional(),
          imageUrl: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const product = await db.getProductById(input.productId);
        if (!product) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Product not found",
          });
        }

        // Verify ownership
        const vendor = await db.getVendorMeta(product.vendorId);
        const business = await db.getBusinessById(vendor!.businessId);
        if (business?.ownerId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Can only update your own products",
          });
        }

        return await db.updateProduct(input.productId, {
          title: input.title,
          description: input.description,
          price: input.price !== undefined ? String(input.price) : undefined,
          category: input.category,
          stockQuantity: input.stockQuantity,
          imageUrl: input.imageUrl,
        });
      }),

    /**
     * Delete a product (vendor only)
     */
    deleteProduct: protectedProcedure
      .input(z.object({ productId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const product = await db.getProductById(input.productId);
        if (!product) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Product not found",
          });
        }

        // Verify ownership
        const vendor = await db.getVendorMeta(product.vendorId);
        const business = await db.getBusinessById(vendor!.businessId);
        if (business?.ownerId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Can only delete your own products",
          });
        }

        // Soft delete by marking inactive
        return await db.updateProduct(input.productId, {
          isActive: false,
        });
      }),
  }),

  // ============ LOCATION ROUTER ============
  location: router({
    /**
     * List all Melbourne regions
     */
    listRegions: publicProcedure.query(async () => {
      const regions = await db.listAllRegions();
      return regions.map(r => r.region).filter(Boolean);
    }),

    /**
     * Get businesses by region
     */
    getBusinessesByRegion: publicProcedure
      .input(
        z.object({
          region: z.string(),
          limit: z.number().min(1).max(100).default(20),
          offset: z.number().min(0).default(0),
        })
      )
      .query(async ({ input }) => {
        return await db.getBusinessesByRegion(
          input.region,
          input.limit,
          input.offset
        );
      }),
  }),

  // ============ PHASE 4: BUSINESS CLAIMS ROUTER ============
  claim: router({
    /**
     * Create a new claim request for an unclaimed business
     */
    request: protectedProcedure
      .input(z.object({ businessId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const business = await db.getBusinessById(input.businessId);
        if (!business) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Business not found",
          });
        }

        // Check if already claimed
        const activeClaim = await db.getActiveBusinessClaim(input.businessId);
        if (activeClaim) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "A claim is already pending for this business",
          });
        }

        const claim = await db.createBusinessClaim({
          businessId: input.businessId,
          userId: ctx.user.id,
          status: "pending",
        });

        // TODO: Send verification email
        return claim;
      }),

    /**
     * Get claim status by business ID
     */
    getStatus: publicProcedure
      .input(z.object({ businessId: z.number() }))
      .query(async ({ input }) => {
        const claims = await db.getBusinessClaimsByBusinessId(input.businessId);
        return claims.length > 0 ? claims[0] : null;
      }),

    /**
     * Approve a business claim (admin only)
     */
    approve: protectedProcedure
      .input(z.object({ claimId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only admins can approve claims",
          });
        }

        return await db.updateBusinessClaimStatus(
          input.claimId,
          "approved",
          new Date()
        );
      }),

    /**
     * Reject a business claim (admin only)
     */
    reject: protectedProcedure
      .input(z.object({ claimId: z.number(), reason: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only admins can reject claims",
          });
        }

        return await db.updateBusinessClaimStatus(input.claimId, "rejected");
      }),

    /**
     * User confirms claim (after approval)
     */
    confirm: protectedProcedure
      .input(z.object({ claimId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const claim = await db.getBusinessClaimById(input.claimId);
        if (!claim) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Claim not found",
          });
        }

        if (claim.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Can only confirm your own claims",
          });
        }

        if (claim.status !== "approved") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Claim must be approved before confirming",
          });
        }

        return await db.updateBusinessClaimClaimed(input.claimId);
      }),
  }),

  // ============ PHASE 4: PRODUCTS ROUTER ============
  product: router({
    /**
     * Create a new product (vendor only)
     */
    create: protectedProcedure
      .input(
        z.object({
          vendorId: z.number(),
          title: z.string().min(1).max(255),
          description: z.string().optional(),
          price: z.number().min(0),
          category: z.string().optional(),
          kind: z.enum(["service", "product", "package"]).default("service"),
          fulfillmentMethod: z
            .enum(["pickup", "delivery", "both"])
            .default("both"),
          stockQuantity: z.number().int().default(999),
          imageUrl: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Verify vendor ownership
        const vendor = await db.getVendorMeta(input.vendorId);
        if (!vendor) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Vendor not found",
          });
        }

        const business = await db.getBusinessById(vendor.businessId);
        if (business?.ownerId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Can only create products for your vendor account",
          });
        }

        return await db.createProduct({
          vendorId: input.vendorId,
          title: input.title,
          description: input.description,
          price: String(input.price),
          category: input.category,
          kind: input.kind,
          fulfillmentMethod: input.fulfillmentMethod,
          stockQuantity: input.stockQuantity,
          imageUrl: input.imageUrl,
          isActive: true,
        });
      }),

    /**
     * Get product by ID (public)
     */
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getProductById(input.id);
      }),

    /**
     * List products by vendor (public)
     */
    listByVendor: publicProcedure
      .input(z.object({ vendorId: z.number() }))
      .query(async ({ input }) => {
        return await db.getProductsByVendorId(input.vendorId);
      }),

    /**
     * Update product (vendor only)
     */
    update: protectedProcedure
      .input(
        z.object({
          productId: z.number(),
          title: z.string().optional(),
          description: z.string().optional(),
          price: z.number().optional(),
          stockQuantity: z.number().optional(),
          imageUrl: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const product = await db.getProductById(input.productId);
        if (!product) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Product not found",
          });
        }

        // Verify ownership
        const vendor = await db.getVendorMeta(product.vendorId);
        const business = await db.getBusinessById(vendor!.businessId);
        if (business?.ownerId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Can only update your own products",
          });
        }

        return await db.updateProduct(input.productId, {
          title: input.title,
          description: input.description,
          price: input.price !== undefined ? String(input.price) : undefined,
          stockQuantity: input.stockQuantity,
          imageUrl: input.imageUrl,
        });
      }),

    /**
     * Deactivate product (vendor only)
     */
    deactivate: protectedProcedure
      .input(z.object({ productId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const product = await db.getProductById(input.productId);
        if (!product) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Product not found",
          });
        }

        const vendor = await db.getVendorMeta(product.vendorId);
        const business = await db.getBusinessById(vendor!.businessId);
        if (business?.ownerId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Can only deactivate your own products",
          });
        }

        return await db.deactivateProduct(input.productId);
      }),
  }),

  // ============ PHASE 4: ORDERS ROUTER ============
  order: router({
    /**
     * Get orders for current user (as buyer)
     */
    getMine: protectedProcedure.query(async ({ ctx }) => {
      return await db.getOrdersByBuyerId(ctx.user.id);
    }),

    /**
     * Get orders for vendor (admin view)
     */
    getByVendor: protectedProcedure
      .input(z.object({ vendorId: z.number() }))
      .query(async ({ ctx, input }) => {
        // Verify vendor ownership
        const vendor = await db.getVendorMeta(input.vendorId);
        if (!vendor) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Vendor not found",
          });
        }

        const business = await db.getBusinessById(vendor.businessId);
        if (business?.ownerId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Can only view your own vendor orders",
          });
        }

        return await db.getOrdersByVendorId(input.vendorId);
      }),

    /**
     * Get order details
     */
    getById: protectedProcedure
      .input(z.object({ orderId: z.number() }))
      .query(async ({ ctx, input }) => {
        const order = await db.getOrderById(input.orderId);
        if (!order) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Order not found",
          });
        }

        // Verify access: buyer or vendor
        if (order.buyerId !== ctx.user.id && order.vendorId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Cannot access this order",
          });
        }

        return order;
      }),

    /**
     * Update fulfillment status (vendor only)
     */
    updateFulfillmentStatus: protectedProcedure
      .input(
        z.object({
          orderId: z.number(),
          status: z.enum(["pending", "ready", "completed", "cancelled"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const order = await db.getOrderById(input.orderId);
        if (!order) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Order not found",
          });
        }

        if (order.vendorId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only vendor can update fulfillment status",
          });
        }

        return await db.updateOrderFulfillmentStatus(
          input.orderId,
          input.status
        );
      }),
  }),

  // ============ PHASE 4: REFUND ROUTER ============
  refund: router({
    /**
     * Request a refund (buyer only)
     */
    request: protectedProcedure
      .input(
        z.object({
          orderId: z.number(),
          reason: z.string().min(1),
          description: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const order = await db.getOrderById(input.orderId);
        if (!order) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Order not found",
          });
        }

        if (order.buyerId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only order buyer can request refund",
          });
        }

        return await db.createRefundRequest({
          orderId: input.orderId,
          buyerId: ctx.user.id,
          reason: input.reason,
          description: input.description,
          status: "pending",
        });
      }),

    /**
     * Get refund requests for order
     */
    getByOrder: publicProcedure
      .input(z.object({ orderId: z.number() }))
      .query(async ({ input }) => {
        return await db.getRefundRequestsByOrderId(input.orderId);
      }),

    /**
     * Get refund requests for buyer
     */
    getMine: protectedProcedure.query(async ({ ctx }) => {
      return await db.getRefundRequestsByBuyerId(ctx.user.id);
    }),

    /**
     * Update refund request status (vendor/admin only)
     */
    updateStatus: protectedProcedure
      .input(
        z.object({
          refundId: z.number(),
          status: z.enum([
            "pending",
            "approved",
            "rejected",
            "processing",
            "completed",
          ]),
          vendorResponse: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const refund = await db.getRefundRequestById(input.refundId);
        if (!refund) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Refund request not found",
          });
        }

        if (ctx.user.role !== "admin") {
          // Vendor can only approve/reject their own products
          const order = await db.getOrderById(refund.orderId);
          if (order?.vendorId !== ctx.user.id) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "Only vendor or admin can update refund status",
            });
          }
        }

        return await db.updateRefundRequestStatus(
          input.refundId,
          input.status,
          {
            vendorResponse: input.vendorResponse,
          }
        );
      }),
  }),

  // ============ PHASE 4: DISPUTES ROUTER ============
  dispute: router({
    /**
     * Get open disputes (admin only)
     */
    getOpen: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can view open disputes",
        });
      }

      return await db.getOpenDisputes();
    }),

    /**
     * Get dispute by ID
     */
    getById: protectedProcedure
      .input(z.object({ disputeId: z.number() }))
      .query(async ({ ctx, input }) => {
        const dispute = await db.getDisputeLogById(input.disputeId);
        if (!dispute) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Dispute not found",
          });
        }

        // Verify access: buyer, vendor, or admin
        if (
          dispute.buyerId !== ctx.user.id &&
          dispute.vendorId !== ctx.user.id &&
          ctx.user.role !== "admin"
        ) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Cannot access this dispute",
          });
        }

        return dispute;
      }),

    /**
     * Resolve dispute (admin only)
     */
    resolve: protectedProcedure
      .input(
        z.object({
          disputeId: z.number(),
          decision: z.enum(["buyer_refund", "vendor_keeps", "split"]),
          adminDecision: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only admins can resolve disputes",
          });
        }

        return await db.updateDisputeLogStatus(input.disputeId, "resolved", {
          resolutionStatus: input.decision,
          adminDecision: input.adminDecision,
          decidedBy: ctx.user.id,
        });
      }),
  }),

  // ============ CHECKOUT ROUTER ============
  checkout: router({
    /**
     * Create a Stripe Checkout Session for an order (buyer only)
     * Returns a redirect URL to complete payment on Stripe
     */
    createCheckoutSession: protectedProcedure
      .input(
        z.object({
          orderId: z.number(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Verify order exists and belongs to buyer
        const order = await db.getOrderById(input.orderId);
        if (!order) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Order not found",
          });
        }

        if (order.buyerId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Can only pay for your own orders",
          });
        }

        if (order.status !== "pending") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Order is not in pending status",
          });
        }

        // Get user email for receipt
        const user = await db.getUserById(ctx.user.id);
        if (!user) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found",
          });
        }

        // Get vendor's Stripe Connect account if available
        const vendor = await db.getVendorMeta(order.vendorId);
        const stripeConnectAccountId =
          vendor?.stripeConnectAccountId || undefined;

        try {
          return await createOrderCheckoutSession(
            order.id,
            order.totalCents,
            user.email || "",
            user.name || "",
            stripeConnectAccountId
          );
        } catch (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to create checkout: ${error instanceof Error ? error.message : "Unknown error"}`,
          });
        }
      }),

    /**
     * Create a payment intent for an order (buyer only) - Alternative to Checkout Session
     * @deprecated Use createCheckoutSession instead for redirect-based checkout
     */
    createPaymentIntent: protectedProcedure
      .input(
        z.object({
          orderId: z.number(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Verify order exists and belongs to buyer
        const order = await db.getOrderById(input.orderId);
        if (!order) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Order not found",
          });
        }

        if (order.buyerId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Can only pay for your own orders",
          });
        }

        if (order.status !== "pending") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Order is not in pending status",
          });
        }

        // Get user email for receipt
        const user = await db.getUserById(ctx.user.id);
        if (!user) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found",
          });
        }

        // Get vendor's Stripe Connect account if available
        const vendor = await db.getVendorMeta(order.vendorId);
        const stripeConnectAccountId =
          vendor?.stripeConnectAccountId || undefined;

        try {
          return await createOrderPaymentIntent(
            order.totalCents,
            input.orderId,
            user.email || "",
            user.name || "",
            stripeConnectAccountId
          );
        } catch (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to create payment: ${error instanceof Error ? error.message : "Unknown error"}`,
          });
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
