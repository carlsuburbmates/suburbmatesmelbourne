/**
 * Stripe Integration Module
 * Handles payment processing, billing, and marketplace payments via Stripe
 */

import Stripe from "stripe";

// Initialize Stripe with secret key
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  throw new Error(
    "STRIPE_SECRET_KEY is not configured. Payment processing will not work."
  );
}

export const stripe = new Stripe(stripeSecretKey);

/**
 * Create a payment intent for an order
 * Returns the client secret needed for frontend payment collection
 */
export async function createOrderPaymentIntent(
  amount: number, // in cents
  orderId: number,
  buyerEmail: string,
  buyerName: string,
  vendorStripeConnectAccountId?: string
) {
  try {
    const metadata = {
      orderId: String(orderId),
      type: "order",
    };

    // Calculate application fee (Platform takes 5%, vendor gets 95%)
    // Application fees only apply when using Stripe Connect
    const applicationFee = vendorStripeConnectAccountId
      ? Math.round(amount * 0.05)
      : undefined;

    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount,
        currency: "aud",
        description: `Order #${orderId} - Suburbmates`,
        receipt_email: buyerEmail,
        metadata,
        statement_descriptor: "Suburbmates Order",
      },
      vendorStripeConnectAccountId
        ? {
            stripeAccount: vendorStripeConnectAccountId,
          }
        : {}
    );

    return {
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
    };
  } catch (error) {
    console.error("Failed to create payment intent:", error);
    throw new Error(
      `Payment processing failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Create a Stripe Checkout session for an order
 * Returns a redirect URL for the user to complete payment
 */
export async function createOrderCheckoutSession(
  orderId: number,
  amountInCents: number,
  buyerEmail: string,
  buyerName: string,
  vendorStripeConnectAccountId?: string
) {
  try {
    const successUrl = `${process.env.VITE_APP_URL || "http://localhost:5173"}/checkout/success?orderId=${orderId}&sessionId={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${process.env.VITE_APP_URL || "http://localhost:5173"}/checkout/cancel?orderId=${orderId}`;

    const session = await stripe.checkout.sessions.create(
      {
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "aud",
              product_data: {
                name: `Suburbmates Order #${orderId}`,
                description: "Marketplace order payment",
              },
              unit_amount: amountInCents,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: successUrl,
        cancel_url: cancelUrl,
        customer_email: buyerEmail,
        metadata: {
          orderId: String(orderId),
          type: "order",
        },
        payment_intent_data: {
          metadata: {
            orderId: String(orderId),
            type: "order",
          },
        },
      },
      vendorStripeConnectAccountId
        ? {
            stripeAccount: vendorStripeConnectAccountId,
          }
        : {}
    );

    return {
      success: true,
      sessionId: session.id,
      url: session.url,
      clientSecret:
        typeof session.payment_intent === "object"
          ? session.payment_intent?.client_secret
          : undefined,
    };
  } catch (error) {
    console.error("Failed to create order checkout session:", error);
    throw new Error(
      `Checkout creation failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Retrieve payment intent details
 */
export async function getPaymentIntent(
  paymentIntentId: string,
  stripeConnectAccountId?: string
) {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(
      paymentIntentId,
      stripeConnectAccountId
        ? {
            stripeAccount: stripeConnectAccountId,
          }
        : {}
    );
    return paymentIntent;
  } catch (error) {
    console.error("Failed to retrieve payment intent:", error);
    throw new Error(
      `Failed to retrieve payment status: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Create a Stripe Checkout session for featured tier upgrade
 */
export async function createFeaturedCheckoutSession(
  businessId: number,
  vendorEmail: string,
  vendorStripeConnectAccountId: string,
  tierDurationDays: number = 30,
  priceInCents: number = 4999 // $49.99
) {
  try {
    const session = await stripe.checkout.sessions.create(
      {
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "aud",
              product_data: {
                name: "Featured Tier Upgrade",
                description: `Featured listing for ${tierDurationDays} days`,
              },
              unit_amount: priceInCents,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${process.env.VITE_APP_URL || "http://localhost:5173"}/checkout/success?sessionId={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.VITE_APP_URL || "http://localhost:5173"}/checkout/cancel`,
        customer_email: vendorEmail,
        metadata: {
          businessId: String(businessId),
          type: "featured_upgrade",
          tierDurationDays: String(tierDurationDays),
        },
        payment_intent_data: {
          metadata: {
            businessId: String(businessId),
            type: "featured_upgrade",
          },
        },
      },
      {
        stripeAccount: vendorStripeConnectAccountId,
      }
    );

    return {
      success: true,
      sessionId: session.id,
      clientSecret:
        typeof session.payment_intent === "object"
          ? session.payment_intent?.client_secret
          : undefined,
      url: session.url,
    };
  } catch (error) {
    console.error("Failed to create checkout session:", error);
    throw new Error(
      `Checkout creation failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Create a Stripe Connect account for a vendor
 */
export async function createConnectAccount(
  vendorBusinessId: number,
  vendorEmail: string,
  vendorName: string
) {
  try {
    const account = await stripe.accounts.create({
      type: "express",
      country: "AU",
      email: vendorEmail,
      business_profile: {
        name: vendorName,
        support_url: "https://suburbmates.com/support",
        url: "https://suburbmates.com",
      },
      metadata: {
        businessId: String(vendorBusinessId),
      },
    });

    return {
      success: true,
      accountId: account.id,
      status: account.charges_enabled ? "active" : "pending",
    };
  } catch (error) {
    console.error("Failed to create Connect account:", error);
    throw new Error(
      `Account creation failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Get account details for a Stripe Connect account
 */
export async function getConnectAccount(accountId: string) {
  try {
    const account = await stripe.accounts.retrieve(accountId);
    return {
      accountId: account.id,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      status: account.charges_enabled ? "active" : "pending",
      email: account.email,
      businessProfile: account.business_profile,
    };
  } catch (error) {
    console.error("Failed to retrieve Connect account:", error);
    throw new Error(
      `Failed to retrieve account details: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Create a refund for a payment
 */
export async function createRefund(
  paymentIntentId: string,
  amountInCents?: number,
  reason?: string,
  stripeConnectAccountId?: string
) {
  try {
    const refund = await stripe.refunds.create(
      {
        payment_intent: paymentIntentId,
        amount: amountInCents,
        reason: (reason as any) || undefined,
      },
      stripeConnectAccountId
        ? {
            stripeAccount: stripeConnectAccountId,
          }
        : {}
    );

    return {
      success: true,
      refundId: refund.id,
      amount: refund.amount,
      status: refund.status,
    };
  } catch (error) {
    console.error("Failed to create refund:", error);
    throw new Error(
      `Refund creation failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Verify Stripe webhook signature
 */
export function verifyWebhookSignature(
  body: string | Buffer,
  signature: string,
  webhookSecret: string
): Stripe.Event | null {
  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );
    return event;
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return null;
  }
}

/**
 * Extract typed data from Stripe event
 */
export function getTypedEventData(event: Stripe.Event) {
  return event.data.object as any;
}
