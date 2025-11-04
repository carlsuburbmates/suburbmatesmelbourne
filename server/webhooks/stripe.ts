/**
 * Stripe Webhook Handler
 * Processes Stripe events: payments, refunds, disputes, account updates
 */

import { Router } from "express";
import { Request, Response, raw } from "express";
import * as db from "../db";
import { stripe, verifyWebhookSignature } from "../integrations/stripe";
import type Stripe from "stripe";

const router = Router();

/**
 * Stripe Webhook Endpoint
 * Route: POST /api/webhooks/stripe
 * Webhook Secret: STRIPE_WEBHOOK_SECRET environment variable
 */
router.post(
  "/stripe",
  raw({ type: "application/json" }),
  async (req: Request, res: Response) => {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET not configured");
      return res.status(500).json({ error: "Webhook not configured" });
    }

    const signature = req.headers["stripe-signature"] as string;
    if (!signature) {
      console.error("Missing stripe-signature header");
      return res.status(400).json({ error: "Missing signature" });
    }

    // Verify webhook signature
    const body = Buffer.isBuffer(req.body)
      ? req.body
      : Buffer.from(JSON.stringify(req.body));
    const event = verifyWebhookSignature(body, signature, webhookSecret);

    if (!event) {
      console.error("Invalid webhook signature");
      return res.status(401).json({ error: "Invalid signature" });
    }

    // Process the event asynchronously
    // Return 200 immediately so Stripe doesn't retry
    res.status(200).json({ received: true });

    // Handle specific event types
    try {
      switch (event.type) {
        case "payment_intent.succeeded":
          await handlePaymentIntentSucceeded(event);
          break;

        case "payment_intent.payment_failed":
          await handlePaymentIntentFailed(event);
          break;

        case "charge.refunded":
          await handleChargeRefunded(event);
          break;

        case "charge.dispute.created":
          await handleDisputeCreated(event);
          break;

        case "charge.dispute.closed":
          await handleDisputeClosed(event);
          break;

        case "account.updated":
          await handleConnectAccountUpdated(event);
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      console.error(`Error processing webhook event ${event.id}:`, error);
      // Don't throw - we already sent 200 to Stripe
    }
  }
);

/**
 * Handle payment_intent.succeeded event
 * Called when payment is complete and funds are captured
 */
async function handlePaymentIntentSucceeded(event: Stripe.Event) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  const metadata = paymentIntent.metadata || {};

  console.log(
    `Payment succeeded for PaymentIntent: ${paymentIntent.id}`,
    metadata
  );

  // Extract order ID from metadata
  const orderId = metadata.orderId ? parseInt(metadata.orderId, 10) : null;
  if (!orderId) {
    console.warn(`No orderId found in payment metadata`);
    return;
  }

  try {
    // Check if order already processed (idempotency)
    const order = await db.getOrderById(orderId);
    if (!order) {
      console.warn(`Order ${orderId} not found`);
      return;
    }

    // Only update if order is not already paid/completed
    if (order.status !== "pending") {
      console.log(
        `Order ${orderId} already in status ${order.status}, skipping update`
      );
      return;
    }

    // Update order status to paid
    await db.updateOrderStatus(orderId, "completed");
    console.log(`Updated order ${orderId} to paid status`);

    // Note: Fulfillment status update will be handled separately when vendor processes
  } catch (error) {
    console.error(
      `Failed to handle payment success for order ${orderId}:`,
      error
    );
    // Don't re-throw; webhook already returned 200
  }
}

/**
 * Handle payment_intent.payment_failed event
 * Called when payment attempt fails
 */
async function handlePaymentIntentFailed(event: Stripe.Event) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  const metadata = paymentIntent.metadata || {};

  console.log(
    `Payment failed for PaymentIntent: ${paymentIntent.id}`,
    metadata
  );

  const orderId = metadata.orderId ? parseInt(metadata.orderId, 10) : null;
  if (!orderId) {
    console.warn(`No orderId found in failed payment metadata`);
    return;
  }

  try {
    const failureReason =
      paymentIntent.last_payment_error?.message || "Payment declined";

    // Update order with failure status and reason
    await db.updateOrderStatus(orderId, "failed", failureReason);
    console.log(`Updated order ${orderId} to payment_failed status`);
  } catch (error) {
    console.error(
      `Failed to handle payment failure for order ${orderId}:`,
      error
    );
  }
}

/**
 * Handle charge.refunded event
 * Called when a refund is completed
 */
async function handleChargeRefunded(event: Stripe.Event) {
  const charge = event.data.object as Stripe.Charge;
  const paymentIntentId = charge.payment_intent as string;

  console.log(
    `Charge refunded: ${charge.id}, PaymentIntent: ${paymentIntentId}`
  );

  if (!paymentIntentId) {
    console.warn(`No payment intent found in charge refund`);
    return;
  }

  try {
    // Find order by payment intent ID
    const order = await db.getOrderByStripePaymentIntentId(paymentIntentId);
    if (!order) {
      console.warn(`No order found for payment intent ${paymentIntentId}`);
      return;
    }

    // Find refund request for this order
    // (Assuming there's at most one active refund per order)
    const refundRequests = await db.getRefundRequestsByOrderId(order.id);
    if (refundRequests.length === 0) {
      console.warn(`No refund requests found for order ${order.id}`);
      return;
    }

    const refundRequest = refundRequests[0]; // Most recent/active
    if (refundRequest.status === "completed") {
      console.log(`Refund ${refundRequest.id} already marked completed`);
      return;
    }

    // Update refund status to completed
    await db.updateRefundRequestStatus(refundRequest.id, "completed", {
      stripeRefundId: charge.refunds?.data?.[0]?.id,
    });
    console.log(`Marked refund ${refundRequest.id} as completed`);
  } catch (error) {
    console.error(
      `Failed to handle charge refund for payment intent ${paymentIntentId}:`,
      error
    );
  }
}

/**
 * Handle charge.dispute.created event
 * Called when a customer initiates a chargeback/dispute
 */
async function handleDisputeCreated(event: Stripe.Event) {
  const dispute = event.data.object as Stripe.Dispute;
  const chargeId = dispute.charge as string;

  console.log(`Dispute created: ${dispute.id} for charge: ${chargeId}`);

  if (!chargeId) {
    console.warn(`No charge found in dispute`);
    return;
  }

  try {
    // Retrieve the charge to get payment intent
    const charge = await stripe.charges.retrieve(chargeId);
    const paymentIntentId = charge.payment_intent as string;

    if (!paymentIntentId) {
      console.warn(`No payment intent found in charge ${chargeId}`);
      return;
    }

    // Find order by payment intent
    const order = await db.getOrderByStripePaymentIntentId(paymentIntentId);
    if (!order) {
      console.warn(`No order found for payment intent ${paymentIntentId}`);
      return;
    }

    // Create dispute log entry
    // Check if dispute already exists (idempotency)
    const existingDisputeLogs = await db.getDisputeLogsByOrderId(order.id);
    const alreadyExists = existingDisputeLogs.some(
      d => d.status === "open" && d.reason === "chargeback"
    );
    if (alreadyExists) {
      console.log(
        `Dispute already logged for order ${order.id}, skipping duplicate`
      );
      return;
    }

    await db.createDisputeLog({
      orderId: order.id,
      buyerId: order.buyerId,
      vendorId: order.vendorId,
      refundRequestId: null,
      status: "open",
      reason: "chargeback",
      buyerEvidence: `Chargeback initiated in Stripe. Dispute ID: ${dispute.id}`,
      vendorResponse: null,
      adminDecision: null,
      resolutionStatus: null,
      decidedAt: null,
      decidedBy: null,
    });

    console.log(
      `Created dispute log for order ${order.id}, dispute ${dispute.id}`
    );
  } catch (error) {
    console.error(`Failed to handle dispute creation ${dispute.id}:`, error);
  }
}

/**
 * Handle charge.dispute.closed event
 * Called when a dispute is resolved
 */
async function handleDisputeClosed(event: Stripe.Event) {
  const dispute = event.data.object as Stripe.Dispute;
  const chargeId = dispute.charge as string;

  console.log(
    `Dispute closed: ${dispute.id} for charge: ${chargeId}, Status: ${dispute.status}`
  );

  if (!chargeId) {
    console.warn(`No charge found in dispute`);
    return;
  }

  try {
    const charge = await stripe.charges.retrieve(chargeId);
    const paymentIntentId = charge.payment_intent as string;

    if (!paymentIntentId) {
      console.warn(`No payment intent found in charge ${chargeId}`);
      return;
    }

    const order = await db.getOrderByStripePaymentIntentId(paymentIntentId);
    if (!order) {
      console.warn(`No order found for payment intent ${paymentIntentId}`);
      return;
    }

    // Update dispute log status
    const disputeLogs = await db.getDisputeLogsByOrderId(order.id);
    const openDispute = disputeLogs.find(d => d.status === "open");

    if (openDispute) {
      // For disputes, we don't use refund resolution types
      // Disputes are resolved with buyer_refund, vendor_keeps, or split
      const resolutionStatus =
        dispute.status === "won" ? "vendor_keeps" : "buyer_refund";
      await db.updateDisputeLogStatus(openDispute.id, "resolved", {
        resolutionStatus,
        adminDecision: `Stripe dispute resolved: ${dispute.status}`,
      });

      console.log(
        `Updated dispute log ${openDispute.id} to closed with resolution: ${resolutionStatus}`
      );
    }
  } catch (error) {
    console.error(`Failed to handle dispute closure ${dispute.id}:`, error);
  }
}

/**
 * Handle account.updated event
 * Called when a Stripe Connect account is updated
 */
async function handleConnectAccountUpdated(event: Stripe.Event) {
  const account = event.data.object as Stripe.Account;
  const businessIdStr = account.metadata?.businessId;

  console.log(
    `Stripe Connect account updated: ${account.id}, Charges enabled: ${account.charges_enabled}`
  );

  if (!businessIdStr) {
    console.warn(`No businessId found in account metadata`);
    return;
  }

  try {
    const businessId = parseInt(businessIdStr, 10);
    const business = await db.getBusinessById(businessId);

    if (!business) {
      console.warn(`Business ${businessId} not found`);
      return;
    }

    // Get vendor meta
    const vendorMeta = await db.getVendorMeta(businessId);
    if (!vendorMeta) {
      console.warn(`Vendor meta for business ${businessId} not found`);
      return;
    }

    // Update vendor's Stripe Connect account status
    const bankAccountStatus = account.external_accounts?.data?.[0]
      ? "verified"
      : "not_connected";
    const subscriptionStatus = account.charges_enabled
      ? "featured_active"
      : "basic_active";

    await db.updateVendorSubscriptionStatus(businessId, subscriptionStatus, {
      bankAccountStatus,
    });

    console.log(
      `Updated vendor ${businessId} subscription status to ${subscriptionStatus}`
    );
  } catch (error) {
    console.error(
      `Failed to handle Connect account update for ${businessIdStr}:`,
      error
    );
  }
}

export default router;
