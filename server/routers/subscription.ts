import { z } from "zod";
import { router, protectedProcedure, publicProcedure, adminProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  getVendorSubscription,
  updateSubscriptionStatus,
  upsertStripeCustomer,
  getVendorTierLimitInfo,
  getVendorBusiness,
} from "../db";
import { stripe } from "../integrations/stripe";

/**
 * Subscription Router — Handles vendor tier upgrades and billing
 * Phase 5 Step 3 (Vendor Tiers & Subscriptions)
 *
 * SSOT Specs:
 * - FEATURED: $29/mo, Stripe Billing subscription
 * - Tier limits: BASIC=12 products, FEATURED=48 products
 * - Webhook events: customer.subscription.updated, invoice.payment_*
 */

const stripeProductId = process.env.STRIPE_PRICE_FEATURED;
if (!stripeProductId) {
  console.warn(
    "⚠️  STRIPE_PRICE_FEATURED not configured. Subscription features disabled."
  );
}

export const subscriptionRouter = router({
  /**
   * Get current vendor subscription and tier status
   * Returns: tier, limit, current products, renewal date, status
   */
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const { user } = ctx;

    // Only vendors can check subscription status
    if (user.role !== "vendor") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only vendors can access subscription status",
      });
    }

    // Get tier info
    const tierInfo = await getVendorTierLimitInfo(user.id);

    // Get subscription details
    const subscription = await getVendorSubscription(user.id);

    return {
      tier: tierInfo.tier,
      subscriptionStatus: subscription?.subscriptionStatus || "free",
      productLimit: tierInfo.limit,
      currentProducts: tierInfo.current,
      canAddProducts: tierInfo.canAdd,
      subscriptionRenewsAt: subscription?.subscriptionRenewsAt,
      stripeAccountId: subscription?.stripeAccountId,
      expiresAt: tierInfo.expiresAt,
    };
  }),

  /**
   * Initiate FEATURED tier subscription upgrade
   * Returns Stripe Billing Portal URL for checkout
   *
   * Flow:
   * 1. Create/retrieve Stripe customer
   * 2. Generate billing portal session URL
   * 3. Redirect user to Stripe (handles payment + subscription setup)
   * 4. Webhook updates vendors_meta on completion
   */
  upgradeToFeatured: protectedProcedure.mutation(async ({ ctx }) => {
    const { user } = ctx;

    if (user.role !== "vendor") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only vendors can upgrade",
      });
    }

    if (!stripeProductId) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Stripe configuration incomplete",
      });
    }

    try {
      // Get or create Stripe customer
      let stripeCustomerId: string;
      const existingMeta = await getVendorSubscription(user.id);

      if (existingMeta?.stripeAccountId) {
        stripeCustomerId = existingMeta.stripeAccountId;
      } else {
        // Create new Stripe customer
        const customer = await stripe.customers.create({
          email: user.email || `vendor-${user.id}@suburbmates.local`,
          description: `Vendor: ${user.name || `User ${user.id}`}`,
          metadata: {
            vendorId: String(user.id),
          },
        });

        stripeCustomerId = customer.id;

        // Save Stripe customer ID
        await upsertStripeCustomer(user.id, stripeCustomerId);
      }

      // Create checkout session for FEATURED subscription
      const session = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        mode: "subscription",
        line_items: [
          {
            price: stripeProductId,
            quantity: 1,
          },
        ],
        success_url: `${process.env.VITE_APP_URL || "http://localhost:5173"}/vendor/billing?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.VITE_APP_URL || "http://localhost:5173"}/vendor/dashboard`,
        metadata: {
          vendorId: String(user.id),
        },
      });

      return {
        checkoutUrl: session.url,
        sessionId: session.id,
      };
    } catch (error) {
      console.error("Error creating subscription checkout:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to initiate subscription upgrade",
      });
    }
  }),

  /**
   * Cancel current subscription
   * Sets tier back to "none" and product limit to 3
   * Downgrade happens at end of current billing period (Stripe manages this)
   */
  cancelSubscription: protectedProcedure.query(async ({ ctx }) => {
    const { user } = ctx;

    if (user.role !== "vendor") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only vendors can cancel subscriptions",
      });
    }

    try {
      const subscription = await getVendorSubscription(user.id);

      if (!subscription?.stripeAccountId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No active subscription found",
        });
      }

      // Get all subscriptions for this customer
      const subscriptions = await stripe.subscriptions.list({
        customer: subscription.stripeAccountId,
        status: "active",
      });

      if (subscriptions.data.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No active subscription to cancel",
        });
      }

      // Cancel the active subscription
      const subscription_to_cancel = subscriptions.data[0];
      await stripe.subscriptions.cancel(subscription_to_cancel.id);

      // Update DB to reflect cancellation
      // Note: Final status update will come via webhook
      // This is optimistic update for UX
      await updateSubscriptionStatus(user.id, "cancelled");

      return {
        success: true,
        message: "Subscription cancelled. You'll retain access until the end of your billing period.",
      };
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to cancel subscription",
      });
    }
  }),

  /**
   * Verify checkout session completion
   * Called after user returns from Stripe checkout
   * Validates session and prepares for webhook confirmation
   */
  verifyCheckoutSession: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;

      if (user.role !== "vendor") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only vendors can verify sessions",
        });
      }

      try {
        const session = await stripe.checkout.sessions.retrieve(input.sessionId);

        if (session.metadata?.vendorId !== String(user.id)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Session does not belong to this vendor",
          });
        }

        return {
          status: session.payment_status,
          subscriptionId: session.subscription,
          customerId: session.customer,
          // Payment status: "unpaid" | "paid"
          // Subscription will be created by webhook within 1-5 seconds
        };
      } catch (error) {
        console.error("Error verifying checkout session:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to verify checkout session",
        });
      }
    }),

  /**
   * Get billing history and upcoming invoices
   * Shows past invoices and next billing date
   */
  getBillingHistory: protectedProcedure.query(async ({ ctx }) => {
    const { user } = ctx;

    if (user.role !== "vendor") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only vendors can access billing history",
      });
    }

    try {
      const subscription = await getVendorSubscription(user.id);

      if (!subscription?.stripeAccountId) {
        return {
          invoices: [],
          upcomingInvoice: null,
        };
      }

      // Get past invoices
      const invoices = await stripe.invoices.list({
        customer: subscription.stripeAccountId,
        limit: 12, // Last 12 invoices
      });

      // Get upcoming invoice (if any)
      const upcomingInvoice = await stripe.invoices
        .list({
          customer: subscription.stripeAccountId,
          status: "draft",
          limit: 1,
        })
        .catch(() => ({ data: [] }));

      return {
        invoices: invoices.data.map((inv) => ({
          id: inv.id,
          number: inv.number,
          amount: inv.total,
          currency: inv.currency,
          status: inv.status,
          paidAt: inv.status_transitions?.paid_at ? new Date(inv.status_transitions.paid_at * 1000) : null,
          dueDate: inv.due_date ? new Date(inv.due_date * 1000) : null,
          pdf: inv.invoice_pdf,
        })),
        upcomingInvoice: upcomingInvoice.data[0]
          ? {
              amount: upcomingInvoice.data[0].total,
              dueDate: upcomingInvoice.data[0].due_date
                ? new Date(upcomingInvoice.data[0].due_date * 1000)
                : null,
            }
          : null,
      };
    } catch (error) {
      console.error("Error fetching billing history:", error);
      // Return empty history on error instead of throwing
      return {
        invoices: [],
        upcomingInvoice: null,
      };
    }
  }),

  /**
   * Access Stripe Customer Portal for subscription management
   * User can manage payment methods, invoices, etc.
   */
  getPortalUrl: protectedProcedure.mutation(async ({ ctx }) => {
    const { user } = ctx;

    if (user.role !== "vendor") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only vendors can access customer portal",
      });
    }

    try {
      const subscription = await getVendorSubscription(user.id);

      if (!subscription?.stripeAccountId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No Stripe customer found",
        });
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: subscription.stripeAccountId,
        return_url: `${process.env.VITE_APP_URL || "http://localhost:5173"}/vendor/billing`,
      });

      return {
        portalUrl: session.url,
      };
    } catch (error) {
      console.error("Error creating portal session:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to access customer portal",
      });
    }
  }),
});
