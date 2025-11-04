import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";
import { TRPCError } from "@trpc/server";

/**
 * Cart router - Shopping cart management
 * Handles CRUD operations on user carts with localStorage sync
 */

export const cartRouter = router({
  /**
   * Get current user's cart
   */
  getMine: protectedProcedure.query(async ({ ctx }) => {
    const cart = await db.getCartByUserId(ctx.user.id);
    if (!cart) {
      return {
        items: [],
        totalCents: 0,
        itemCount: 0,
      };
    }

    try {
      const items = JSON.parse(cart.items);
      return {
        items,
        totalCents: cart.totalCents,
        itemCount: cart.itemCount,
      };
    } catch {
      return {
        items: [],
        totalCents: 0,
        itemCount: 0,
      };
    }
  }),

  /**
   * Add or update item in cart
   */
  addItem: protectedProcedure
    .input(
      z.object({
        productId: z.number(),
        vendorId: z.number(),
        quantity: z.number().min(1),
        price: z.number().min(0),
        title: z.string(),
        imageUrl: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const cart = await db.getCartByUserId(ctx.user.id);
      let items = [];

      if (cart) {
        try {
          items = JSON.parse(cart.items);
        } catch {
          items = [];
        }
      }

      // Check if item exists, update quantity if so
      const existingIndex = items.findIndex(
        (item: any) =>
          item.productId === input.productId && item.vendorId === input.vendorId
      );

      if (existingIndex >= 0) {
        items[existingIndex].quantity += input.quantity;
      } else {
        items.push({
          productId: input.productId,
          vendorId: input.vendorId,
          quantity: input.quantity,
          price: input.price,
          title: input.title,
          imageUrl: input.imageUrl || "",
        });
      }

      // Calculate totals
      const totalCents = items.reduce(
        (sum: number, item: any) => sum + item.price * item.quantity,
        0
      );
      const itemCount = items.reduce(
        (sum: number, item: any) => sum + item.quantity,
        0
      );

      await db.createOrUpdateCart(ctx.user.id, {
        items: JSON.stringify(items),
        totalCents,
        itemCount,
      });

      return { success: true, itemCount };
    }),

  /**
   * Remove item from cart
   */
  removeItem: protectedProcedure
    .input(
      z.object({
        productId: z.number(),
        vendorId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const cart = await db.getCartByUserId(ctx.user.id);
      if (!cart) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Cart not found",
        });
      }

      let items = [];
      try {
        items = JSON.parse(cart.items);
      } catch {
        items = [];
      }

      items = items.filter(
        (item: any) =>
          !(item.productId === input.productId && item.vendorId === input.vendorId)
      );

      if (items.length === 0) {
        await db.clearCart(ctx.user.id);
        return { success: true, itemCount: 0 };
      }

      // Calculate totals
      const totalCents = items.reduce(
        (sum: number, item: any) => sum + item.price * item.quantity,
        0
      );
      const itemCount = items.reduce(
        (sum: number, item: any) => sum + item.quantity,
        0
      );

      await db.createOrUpdateCart(ctx.user.id, {
        items: JSON.stringify(items),
        totalCents,
        itemCount,
      });

      return { success: true, itemCount };
    }),

  /**
   * Update item quantity
   */
  updateQuantity: protectedProcedure
    .input(
      z.object({
        productId: z.number(),
        vendorId: z.number(),
        quantity: z.number().min(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const cart = await db.getCartByUserId(ctx.user.id);
      if (!cart) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Cart not found",
        });
      }

      let items = [];
      try {
        items = JSON.parse(cart.items);
      } catch {
        items = [];
      }

      const itemIndex = items.findIndex(
        (item: any) =>
          item.productId === input.productId && item.vendorId === input.vendorId
      );

      if (itemIndex < 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Item not in cart",
        });
      }

      if (input.quantity === 0) {
        items.splice(itemIndex, 1);
      } else {
        items[itemIndex].quantity = input.quantity;
      }

      if (items.length === 0) {
        await db.clearCart(ctx.user.id);
        return { success: true, itemCount: 0 };
      }

      // Calculate totals
      const totalCents = items.reduce(
        (sum: number, item: any) => sum + item.price * item.quantity,
        0
      );
      const itemCount = items.reduce(
        (sum: number, item: any) => sum + item.quantity,
        0
      );

      await db.createOrUpdateCart(ctx.user.id, {
        items: JSON.stringify(items),
        totalCents,
        itemCount,
      });

      return { success: true, itemCount };
    }),

  /**
   * Clear entire cart
   */
  clear: protectedProcedure.mutation(async ({ ctx }) => {
    await db.clearCart(ctx.user.id);
    return { success: true };
  }),
});
