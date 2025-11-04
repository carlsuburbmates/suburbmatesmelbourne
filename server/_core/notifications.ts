import * as db from "../db";

// Use notification types from schema
type NotificationType = 
  | "order_created" 
  | "order_confirmed" 
  | "order_completed" 
  | "refund_requested" 
  | "refund_processed" 
  | "claim_submitted" 
  | "claim_approved" 
  | "dispute_opened" 
  | "system";

/**
 * Create a notification for a user
 * Used after order creation, refund initiated, dispute updates, etc.
 */
export async function createNotification(
  userId: number,
  type: NotificationType,
  title: string,
  message: string,
  data?: {
    relatedOrderId?: number;
    relatedRefundId?: number;
    actionUrl?: string;
  }
) {
  try {
    const notification = await db.createNotification({
      userId,
      type,
      title,
      message,
      relatedOrderId: data?.relatedOrderId,
      relatedRefundId: data?.relatedRefundId,
      actionUrl: data?.actionUrl,
    });
    return notification;
  } catch (error) {
    console.error("[Notifications] Failed to create notification:", error);
    // Don't throw - notifications are non-critical
    return null;
  }
}

/**
 * Notify user when their order is created
 */
export async function notifyOrderCreated(
  userId: number,
  orderId: number,
  vendorName: string
) {
  return createNotification(
    userId,
    "order_created",
    "Order Created",
    `Your order #${orderId} from ${vendorName} has been created`,
    {
      relatedOrderId: orderId,
      actionUrl: `/orders/${orderId}`,
    }
  );
}

/**
 * Notify user when their order is confirmed
 */
export async function notifyOrderConfirmed(
  userId: number,
  orderId: number,
  vendorName: string
) {
  return createNotification(
    userId,
    "order_confirmed",
    "Order Confirmed",
    `Your order #${orderId} from ${vendorName} has been confirmed`,
    {
      relatedOrderId: orderId,
      actionUrl: `/orders/${orderId}`,
    }
  );
}

/**
 * Notify user when order is marked as completed
 */
export async function notifyOrderCompleted(
  userId: number,
  orderId: number
) {
  return createNotification(
    userId,
    "order_completed",
    "Order Completed",
    `Your order #${orderId} has been completed`,
    {
      relatedOrderId: orderId,
      actionUrl: `/orders/${orderId}`,
    }
  );
}

/**
 * Notify user when a refund is requested
 */
export async function notifyRefundRequested(
  userId: number,
  orderId: number,
  refundId: number,
  amount: number
) {
  const formattedAmount = new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(amount / 100);

  return createNotification(
    userId,
    "refund_requested",
    "Refund Requested",
    `Refund of ${formattedAmount} has been requested for order #${orderId}`,
    {
      relatedOrderId: orderId,
      relatedRefundId: refundId,
      actionUrl: `/orders/${orderId}`,
    }
  );
}

/**
 * Notify user when a refund is processed
 */
export async function notifyRefundProcessed(
  userId: number,
  orderId: number,
  refundId: number,
  amount: number
) {
  const formattedAmount = new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(amount / 100);

  return createNotification(
    userId,
    "refund_processed",
    "Refund Processed",
    `Refund of ${formattedAmount} has been processed for order #${orderId}`,
    {
      relatedOrderId: orderId,
      relatedRefundId: refundId,
      actionUrl: `/orders/${orderId}`,
    }
  );
}

/**
 * Notify user when a claim is submitted
 */
export async function notifyClaimSubmitted(
  userId: number,
  orderId: number,
  claimReason: string
) {
  return createNotification(
    userId,
    "claim_submitted",
    "Claim Submitted",
    `A claim has been submitted for order #${orderId}: ${claimReason}`,
    {
      relatedOrderId: orderId,
      actionUrl: `/orders/${orderId}`,
    }
  );
}

/**
 * Notify user when a claim is approved
 */
export async function notifyClaimApproved(
  userId: number,
  orderId: number,
  resolution: string
) {
  return createNotification(
    userId,
    "claim_approved",
    "Claim Approved",
    `Your claim for order #${orderId} has been approved: ${resolution}`,
    {
      relatedOrderId: orderId,
      actionUrl: `/orders/${orderId}`,
    }
  );
}

/**
 * Notify user when a dispute is opened
 */
export async function notifyDisputeOpened(
  userId: number,
  orderId: number,
  disputeReason: string
) {
  return createNotification(
    userId,
    "dispute_opened",
    "Dispute Opened",
    `A dispute has been opened for order #${orderId}: ${disputeReason}`,
    {
      relatedOrderId: orderId,
      actionUrl: `/orders/${orderId}`,
    }
  );
}

/**
 * Send a system notification
 */
export async function notifySystemMessage(
  userId: number,
  title: string,
  message: string,
  actionUrl?: string
) {
  return createNotification(
    userId,
    "system",
    title,
    message,
    { actionUrl }
  );
}
