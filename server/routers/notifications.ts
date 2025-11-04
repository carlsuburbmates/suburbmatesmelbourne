import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";
import { TRPCError } from "@trpc/server";

/**
 * Notifications router - In-app notification management
 * Handles listing, reading, and deleting user notifications
 */

export const notificationsRouter = router({
  /**
   * Get all notifications for current user
   */
  getMine: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const notifications = await db.getNotificationsByUserId(
        ctx.user.id,
        input.limit,
        input.offset
      );

      return {
        notifications,
        total: notifications.length,
      };
    }),

  /**
   * Mark notification as read
   */
  markAsRead: protectedProcedure
    .input(z.object({ notificationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.markNotificationAsRead(input.notificationId, ctx.user.id);
      return { success: true };
    }),

  /**
   * Mark all notifications as read
   */
  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    const notifications = await db.getNotificationsByUserId(
      ctx.user.id,
      1000,
      0
    );

    for (const notif of notifications) {
      if (!notif.read) {
        await db.markNotificationAsRead(notif.id, ctx.user.id);
      }
    }

    return { success: true, count: notifications.length };
  }),

  /**
   * Delete notification
   */
  delete: protectedProcedure
    .input(z.object({ notificationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.deleteNotification(input.notificationId, ctx.user.id);
      return { success: true };
    }),

  /**
   * Delete all notifications
   */
  deleteAll: protectedProcedure.mutation(async ({ ctx }) => {
    const notifications = await db.getNotificationsByUserId(
      ctx.user.id,
      1000,
      0
    );

    for (const notif of notifications) {
      await db.deleteNotification(notif.id, ctx.user.id);
    }

    return { success: true, count: notifications.length };
  }),

  /**
   * Get unread count
   */
  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const notifications = await db.getNotificationsByUserId(
      ctx.user.id,
      1000,
      0
    );
    const unreadCount = notifications.filter((n) => !n.read).length;
    return { unreadCount };
  }),
});
