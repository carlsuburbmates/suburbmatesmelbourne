import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";
import { trackBusinessCreated } from "./_core/notification";
import crypto from "crypto";

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
          hasABN: !!input.abn
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
            message: error instanceof Error ? error.message : "ABN verification failed",
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
          agreementType: z.enum(["terms_of_service", "privacy_policy", "vendor_agreement"]),
          version: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Verify user owns the business
        const business = await db.getBusinessById(input.businessId);
        if (!business || business.ownerId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have permission to accept agreements for this business",
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
          agreementType: z.enum(["terms_of_service", "privacy_policy", "vendor_agreement"]),
        })
      )
      .query(async ({ input }) => {
        return await db.getLatestAgreement(input.businessId, input.agreementType);
      }),
  }),

  // ============ CONSENT ROUTER ============
  consent: router({
    /**
     * Create or update user consent
     */
    set: protectedProcedure
      .input(
        z.object({
          consentType: z.enum(["marketing_emails", "sms_notifications", "analytics", "third_party_sharing"]),
          granted: z.boolean(),
          version: z.string(),
          expiresAt: z.date().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const consent = await db.createConsent({
          userId: ctx.user.id,
          consentType: input.consentType,
          granted: input.granted,
          version: input.version,
          ipAddress: ctx.req.ip,
          userAgent: ctx.req.headers["user-agent"],
          expiresAt: input.expiresAt,
        });

        return { success: true, consentId: consent[0].insertId };
      }),

    /**
     * Get all consents for the current user
     */
    getAll: protectedProcedure.query(async ({ ctx }) => {
      return await db.getConsentsByUserId(ctx.user.id);
    }),

    /**
     * Get a specific consent type for the current user
     */
    get: protectedProcedure
      .input(
        z.object({
          consentType: z.enum(["marketing_emails", "sms_notifications", "analytics", "third_party_sharing"]),
        })
      )
      .query(async ({ ctx, input }) => {
        return await db.getUserConsent(ctx.user.id, input.consentType);
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
          const description = await generateBusinessDescription(input.name, input.category);
          
          return {
            success: true,
            description,
          };
        } catch (error) {
          console.error("Failed to generate business description:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error instanceof Error ? error.message : "Failed to generate description",
          });
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
