import { z } from "zod";

// ============ PRODUCT SCHEMAS ============
export const productCreateSchema = z.object({
  vendorId: z.number().int(),
  title: z.string().min(1, "Title is required").max(255, "Title must be less than 255 characters"),
  description: z.string().optional(),
  price: z.number().min(0, "Price must be positive"),
  category: z.string().optional(),
  kind: z.enum(["service", "product", "package"]).default("service"),
  fulfillmentMethod: z.enum(["pickup", "delivery", "both"]).default("both"),
  stockQuantity: z.number().int().min(0).default(999),
  imageUrl: z.string().url("Invalid image URL").optional().or(z.literal("")),
});

export const productUpdateSchema = z.object({
  productId: z.number().int(),
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  price: z.number().min(0).optional(),
  stockQuantity: z.number().int().min(0).optional(),
  imageUrl: z.string().url("Invalid image URL").optional().or(z.literal("")),
});

export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;

// ============ CLAIM SCHEMAS ============
export const claimRequestSchema = z.object({
  businessId: z.number().int(),
});

export type ClaimRequestInput = z.infer<typeof claimRequestSchema>;

// ============ ORDER SCHEMAS ============
export const orderStatusUpdateSchema = z.object({
  orderId: z.number().int(),
  status: z.enum(["pending", "ready", "completed", "cancelled"]),
});

export type OrderStatusUpdateInput = z.infer<typeof orderStatusUpdateSchema>;

// ============ REFUND SCHEMAS ============
export const refundRequestSchema = z.object({
  orderId: z.number().int(),
  reason: z.string().min(1, "Reason is required"),
  description: z.string().optional(),
});

export type RefundRequestInput = z.infer<typeof refundRequestSchema>;

// ============ CHECKOUT SCHEMAS ============
export const checkoutPaymentIntentSchema = z.object({
  orderId: z.number().int(),
});

export type CheckoutPaymentIntentInput = z.infer<typeof checkoutPaymentIntentSchema>;
