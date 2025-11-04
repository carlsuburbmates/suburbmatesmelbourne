# Phase 5 Step 1: Shopping Cart & Notifications - Implementation Plan

**Version:** 1.0 (Locked)  
**Status:** Ready for Development  
**Target Completion:** TBD  
**Deployment Branch:** `phase5-step1`

---

## Executive Summary

Phase 5 introduces the **Shopping Cart System** and **Real-time Notifications**, completing the core e-commerce workflow. Users will be able to:

- Build persistent shopping carts across sessions
- Batch multiple items into single orders
- Receive real-time notifications for order status updates
- Manage inventory deductions automatically

This phase bridges the gap between current single-item checkout (Phase 4) and future multi-vendor fulfillment workflows.

---

## Phase 5 Architecture Overview

```
Shopping Cart System                     Notifications System
├─ Frontend: Cart Context/useCart()      ├─ In-App Notifications
├─ Storage: localStorage + DB            ├─ Email Notifications
├─ APIs: cart.add/remove/clear           ├─ Real-time WebSocket (future)
├─ Checkout: Multi-item batch            └─ Notification Preferences
└─ Inventory: Deduction on order
```

---

## Step 1: Shopping Cart & Notifications

### 1.1 Frontend Cart System

#### Cart Context (`client/src/_core/contexts/CartContext.tsx`)

```typescript
interface CartItem {
  id: string; // Unique cart item ID
  productId: number;
  vendorId: number;
  quantity: number;
  price: number;
  title: string;
  imageUrl?: string;
  selectedAt: Date;
}

interface Cart {
  items: CartItem[];
  total: number;
  itemCount: number;
  lastUpdated: Date;
}

// Context hooks:
-useCart() - // Get cart state + methods
  useCartPersist(); // Auto-save to localStorage + DB
```

#### Cart Storage Strategy

1. **localStorage** (client-side)
   - Primary storage for fast UX
   - Persists across browser sessions
   - Synced on app startup

2. **Database** (`cart` table in Drizzle)
   - Backup storage for authenticated users
   - Enables sync across devices
   - Cleaned up on checkout/7-day expiry

#### Cart API Endpoints (tRPC router: `cart`)

```typescript
cart.add.mutation(); // Add item to cart
cart.remove.mutation(); // Remove item from cart
cart.updateQuantity.mutation(); // Change item quantity
cart.clear.mutation(); // Clear entire cart
cart.getCart.query(); // Fetch cart (with DB sync)
cart.getCartTotal.query(); // Get cart totals (for checkout)
```

---

### 1.2 Cart UI Components

#### New Components

```
client/src/components/cart/
├─ CartIcon.tsx                 // Header cart icon with item count
├─ CartDropdown.tsx             // Quick-view cart dropdown (header)
├─ CartPage.tsx                 // Full cart page (/cart)
├─ CartItemCard.tsx             // Individual cart item row
├─ CartSummary.tsx              // Subtotal/taxes/shipping summary
└─ CheckoutFlow.tsx             // Multi-step checkout (existing extension)
```

#### Cart Page Routes

```typescript
// In App.tsx
<Route path="/cart" component={CartPage} />
<Route path="/checkout" component={CheckoutFlow} />
```

---

### 1.3 Notifications System

#### Notification Types

1. **In-App Notifications** (Sonner toast / persistent list)
   - Order created
   - Payment processed
   - Order shipped
   - Claim approved/rejected
   - Refund issued

2. **Email Notifications** (via Manus platform / SendGrid)
   - Order confirmation
   - Shipping update
   - Delivery notification
   - Refund confirmation
   - Admin alerts

#### Database Schema Extensions

**`notifications` table (Drizzle)**

```typescript
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // "order_created", etc
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message"),
  link?: varchar("link", { length: 500 }),
  read: boolean("read").default(false),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow(),
});
```

**`notification_preferences` table (Drizzle)**

```typescript
export const notificationPreferences = pgTable("notification_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  emailOrderUpdates: boolean("email_order_updates").default(true),
  emailRefunds: boolean("email_refunds").default(true),
  emailMarketingInfo: boolean("email_marketing_info").default(false),
  inAppNotifications: boolean("in_app_notifications").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});
```

#### Notification API (tRPC router: `notifications`)

```typescript
notifications.list.query(); // Get user's notifications
notifications.markAsRead.mutation(); // Mark notification read
notifications.markAllAsRead.mutation(); // Mark all read
notifications.delete.mutation(); // Delete notification
notifications.getPreferences.query();
notifications.updatePreferences.mutation();
```

#### Notification Components

```
client/src/components/notifications/
├─ NotificationBell.tsx          // Header bell icon (with unread count)
├─ NotificationDropdown.tsx       // Quick-view list
├─ NotificationCenter.tsx         // Full notification management page
├─ NotificationItem.tsx           // Individual notification row
└─ NotificationPreferences.tsx    // Settings/preferences panel
```

**Route:**

```typescript
<Route path="/notifications" component={NotificationCenter} />
```

---

## 1.4 Checkout Flow Enhancement

### Current State (Phase 4)

- Single product checkout
- Stripe payment
- Order creation
- Success/cancel pages

### Phase 5 Enhancement

1. **Cart Review Step**
   - Show all items
   - Allow quantity adjustments
   - Apply coupon codes (future)
   - Estimate taxes/shipping

2. **Inventory Deduction**
   - On checkout confirmation
   - Update `products.stock`
   - Create inventory audit log

3. **Batch Order Creation**
   - Group items by vendor
   - Create separate orders per vendor
   - Link to parent order in DB

4. **Notification Trigger**
   - Email order confirmation
   - Create in-app notification
   - Send to vendor dashboard

---

## Step 1 Deliverables

### Packet 5.1: Shopping Cart Backend & API

**Files to Create:**

- `server/routers/cart.ts` - tRPC cart procedures
- `drizzle/schema.ts` - Add `cart` & `notification_preference` tables
- `server/db.ts` - Cart query functions

**tRPC Procedures:**

```typescript
cart.add; // Add to cart
cart.remove; // Remove from cart
cart.updateQuantity; // Update item qty
cart.clear; // Clear cart
cart.getCart; // Fetch cart with DB sync
cart.getCartTotal; // Get totals for checkout
```

**Database Operations:**

- Create cart table + migrations
- Create notification_preferences table
- Add cart CRUD functions in `db.ts`
- Setup proper indexes and constraints

**Status:** TODO

---

### Packet 5.2: Shopping Cart Frontend UI

**Files to Create:**

- `client/src/_core/contexts/CartContext.tsx` - Cart state management
- `client/src/components/cart/CartIcon.tsx` - Header icon
- `client/src/components/cart/CartDropdown.tsx` - Quick view
- `client/src/components/cart/CartPage.tsx` - Full page
- `client/src/components/cart/CartItemCard.tsx` - Item row
- `client/src/components/cart/CartSummary.tsx` - Summary card
- `client/src/pages/Cart.tsx` - Cart page wrapper
- `client/src/lib/useCart.ts` - Cart hook

**Features:**

- Add/remove items
- Update quantities
- localStorage persistence
- Real-time total calculations
- Empty cart state

**Status:** TODO

---

### Packet 5.3: Notifications Backend & API

**Files to Create:**

- `server/routers/notifications.ts` - tRPC notification procedures
- `server/_core/notifications.ts` - Email service integration
- `server/db.ts` - Notification query functions

**tRPC Procedures:**

```typescript
notifications.list; // Fetch notifications
notifications.markAsRead; // Mark read
notifications.delete;
notifications.getPreferences;
notifications.updatePreferences;
```

**Services:**

- `sendOrderConfirmation()` - Email notifications
- `sendRefundNotification()`
- `createInAppNotification()` - DB trigger

**Status:** TODO

---

### Packet 5.4: Notifications Frontend UI

**Files to Create:**

- `client/src/components/notifications/NotificationBell.tsx`
- `client/src/components/notifications/NotificationDropdown.tsx`
- `client/src/components/notifications/NotificationCenter.tsx`
- `client/src/components/notifications/NotificationItem.tsx`
- `client/src/components/notifications/NotificationPreferences.tsx`
- `client/src/pages/NotificationCenter.tsx`

**Features:**

- Bell icon with unread count
- Dropdown quick-view
- Full notification center page
- Mark as read/delete
- Notification preferences settings

**Status:** TODO

---

### Packet 5.5: Checkout & Inventory Integration

**Files to Modify:**

- `client/src/pages/Checkout.tsx` - Add cart review step
- `server/routers/order.ts` - Add inventory deduction
- `server/db.ts` - Update order creation logic

**Features:**

- Cart review before payment
- Inventory deduction on order
- Batch order creation by vendor
- Notification triggers

**Status:** TODO

---

### Packet 5.6: QA & Deployment

**Tasks:**

- `pnpm check` - TypeScript verification
- `pnpm build` - Production build
- QA checklist verification
- Create v5.0 tag
- Documentation updates
- Merge to main

**Status:** TODO

---

## Implementation Priority

### Tier 1 (Critical Path)

1. Packet 5.1: Cart backend API
2. Packet 5.2: Cart UI (with localStorage)
3. Packet 5.5: Checkout integration

### Tier 2 (High Priority)

1. Packet 5.3: Notifications backend
2. Packet 5.4: Notifications UI

### Tier 3 (Polish)

1. Packet 5.6: QA & Deployment

---

## Technical Considerations

### localStorage vs. Database

- **localStorage:** Fast, no latency, works offline
- **Database:** Cross-device sync, audit log, recovery

**Strategy:** Use localStorage as primary, sync to DB for authenticated users on app load.

### Notification Delivery

- **In-App:** Via Sonner toast + notification center
- **Email:** Via Manus platform (existing OAuth integration)
- **Future:** WebSocket for real-time updates

### Inventory Locking

- **Soft Lock:** Reserve items on checkout start (session-based)
- **Hard Lock:** Confirm on payment success (DB deduction)
- **Timeout:** Release reserved items after 15 min inactivity

---

## Success Criteria

| Criterion                        | Status  |
| -------------------------------- | ------- |
| Cart can persist across sessions | ⏳ TODO |
| Multi-item checkout works        | ⏳ TODO |
| Inventory deducted correctly     | ⏳ TODO |
| Notifications sent & displayed   | ⏳ TODO |
| TypeScript: Zero errors          | ⏳ TODO |
| Build: Production verified       | ⏳ TODO |
| QA: All tests pass               | ⏳ TODO |

---

## Dependencies

- **Existing:** React 19, TypeScript, tRPC, Drizzle, Stripe
- **New:** Email service (Manus SendGrid integration)
- **Future:** WebSocket library (Socket.io for real-time)

---

## Timeline

**Estimated Effort:**

- Packet 5.1: 2-3 hours
- Packet 5.2: 2-3 hours
- Packet 5.3: 1.5-2 hours
- Packet 5.4: 1.5-2 hours
- Packet 5.5: 1-1.5 hours
- Packet 5.6: 0.5-1 hour

**Total:** ~10-12 hours of autonomous development

---

## Notes

- Phase 5 Step 1 is **foundational** for Phase 6 multi-vendor fulfillment
- All notification infrastructure is **extensible** for future channels (SMS, push)
- Cart system **must** handle concurrent updates gracefully
- Inventory deduction **must** be transactional (no overselling)

---

**Document Status:** 🔒 LOCKED  
**Last Updated:** 2024-11-04  
**Next Review:** Post Phase 5 Step 1 completion
