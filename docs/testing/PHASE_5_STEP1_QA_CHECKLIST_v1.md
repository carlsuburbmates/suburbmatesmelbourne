# Phase 5 Step 1: Shopping Cart & Notifications - QA Checklist v1

**Version:** 1.0 (Locked)  
**Release:** v5.0  
**Branch:** `phase5-step1`

---

## Pre-Deployment Verification

### Code Quality

- [ ] **TypeScript Check**

  ```bash
  pnpm check
  ```

  Expected: Zero errors, strict mode compliant

- [ ] **Build Verification**

  ```bash
  pnpm build
  ```

  Expected: Clean build, production bundle generated

- [ ] **Linting**
  ```bash
  pnpm lint  # if configured
  ```
  Expected: No style violations

### Git & Commits

- [ ] All work committed to `phase5-step1` branch
- [ ] Commit messages follow convention (`feat:`, `fix:`, `chore:`)
- [ ] No WIP or debug commits
- [ ] Branch is 6 commits ahead of main
- [ ] Remote tracking up-to-date

---

## Functional Testing

### Packet 5.1: Cart Backend API

#### Cart CRUD Operations

- [ ] `cart.add` mutation
  - [ ] Add item to empty cart
  - [ ] Add duplicate product (increase qty)
  - [ ] Add from different vendors
  - [ ] Response includes updated cart

- [ ] `cart.remove` mutation
  - [ ] Remove existing item
  - [ ] Remove non-existent item (error handling)
  - [ ] Cart updates after removal

- [ ] `cart.updateQuantity` mutation
  - [ ] Increase quantity
  - [ ] Decrease quantity
  - [ ] Set to zero (should remove)
  - [ ] Set invalid quantity (error handling)

- [ ] `cart.clear` mutation
  - [ ] Empties cart
  - [ ] Returns empty array

- [ ] `cart.getCart` query
  - [ ] Returns user's cart with all items
  - [ ] Syncs localStorage ↔ DB
  - [ ] Handles missing cart gracefully

- [ ] `cart.getCartTotal` query
  - [ ] Calculates subtotal correctly
  - [ ] Includes tax calculation (if applicable)
  - [ ] Includes shipping estimate

#### Database Integrity

- [ ] Cart table created with correct schema
- [ ] Indexes on `userId` and `productId`
- [ ] Foreign key constraints set up
- [ ] Timestamps auto-populated

---

### Packet 5.2: Shopping Cart Frontend UI

#### Cart Icon (Header)

- [ ] Icon displays in header
- [ ] Shows item count badge
- [ ] Badge updates on item add/remove
- [ ] Badge hides when cart empty
- [ ] Clickable to open dropdown

#### Cart Dropdown

- [ ] Opens/closes on icon click
- [ ] Shows 3-5 recent items
- [ ] Shows cart total
- [ ] "View Full Cart" link present
- [ ] "Checkout" button visible
- [ ] Closes on outside click

#### Cart Page (`/cart`)

- [ ] Page loads without errors
- [ ] Shows all cart items in table format
- [ ] Each item shows: product, vendor, qty, price, subtotal
- [ ] Remove button works on each item
- [ ] Quantity input allows adjustments
- [ ] Cart total updates in real-time
- [ ] Empty cart state displays properly

#### Cart Item Card

- [ ] Product image displays
- [ ] Product title/description present
- [ ] Vendor name shown
- [ ] Price per unit displayed
- [ ] Quantity selector works (±1 buttons or input)
- [ ] Subtotal calculated correctly
- [ ] Remove button functional

#### Cart Summary

- [ ] Displays subtotal
- [ ] Calculates taxes (if applicable)
- [ ] Shows shipping estimate
- [ ] Displays final total
- [ ] All calculations accurate
- [ ] Updates when items change

#### localStorage Persistence

- [ ] Cart saves to localStorage on add/remove
- [ ] Cart persists after page reload
- [ ] Cart syncs after browser close/reopen
- [ ] Handles corrupted localStorage gracefully

#### Cart Context (React)

- [ ] `useCart()` hook provides cart state
- [ ] `useCart()` provides add/remove/clear methods
- [ ] Context updates trigger re-renders
- [ ] Multiple components stay in sync

---

### Packet 5.3: Notifications Backend API

#### Notification CRUD

- [ ] `notifications.list` query
  - [ ] Returns user's notifications
  - [ ] Ordered by most recent first
  - [ ] Includes read/unread status
  - [ ] Pagination works

- [ ] `notifications.markAsRead` mutation
  - [ ] Sets `read: true` and `readAt` timestamp
  - [ ] Returns updated notification

- [ ] `notifications.markAllAsRead` mutation
  - [ ] Sets all user notifications to read
  - [ ] Updates `readAt` for all

- [ ] `notifications.delete` mutation
  - [ ] Removes notification from DB
  - [ ] Returns success response

#### Notification Preferences

- [ ] `notifications.getPreferences` query
  - [ ] Returns user's notification settings
  - [ ] Defaults created if not exist

- [ ] `notifications.updatePreferences` mutation
  - [ ] Updates email opt-in flags
  - [ ] Updates in-app toggle
  - [ ] Returns updated preferences

#### Notification Creation

- [ ] Order confirmation email sent
- [ ] Order confirmation in-app notification created
- [ ] Refund notifications triggered
- [ ] Claim notifications triggered
- [ ] All notifications include proper links

---

### Packet 5.4: Notifications Frontend UI

#### Notification Bell Icon

- [ ] Icon displays in header
- [ ] Shows unread count badge
- [ ] Badge updates when new notification
- [ ] Badge hides when no unread

#### Notification Dropdown

- [ ] Opens on bell click
- [ ] Shows 5 most recent notifications
- [ ] Each notification includes: icon, title, message, time
- [ ] Mark as read on click
- [ ] Delete button on each
- [ ] "View All" link to full center
- [ ] Closes on outside click

#### Notification Center Page (`/notifications`)

- [ ] Page loads with all notifications
- [ ] Grouped by date (Today, Yesterday, This Week)
- [ ] Read/unread status indicated visually
- [ ] Filtering works (All/Unread)
- [ ] Sorting works (Newest first, etc)
- [ ] Bulk actions available (Mark all read, delete)
- [ ] Individual delete works
- [ ] Empty state displays when no notifications

#### Notification Preferences Panel

- [ ] Email notification toggles work
- [ ] In-app notification toggle works
- [ ] Changes save to DB
- [ ] Success toast on save
- [ ] Page reflects persisted settings on reload

---

### Packet 5.5: Checkout & Inventory Integration

#### Enhanced Checkout Flow

- [ ] Cart review step displays all items
- [ ] User can adjust quantities before payment
- [ ] Can remove items from checkout
- [ ] Total updates correctly
- [ ] Proceed to payment button works

#### Inventory Deduction

- [ ] Product stock decreases on order
- [ ] Stock doesn't go negative
- [ ] Out-of-stock products handled
- [ ] Insufficient stock error message clear
- [ ] Inventory audit log created

#### Batch Order Creation

- [ ] Multiple items → multiple orders (per vendor)
- [ ] Each order links to parent
- [ ] Order numbers unique
- [ ] All items accounted for

#### Notification Triggers

- [ ] Order confirmation email sent
- [ ] In-app notification created
- [ ] Vendor receives order notification
- [ ] Customer email includes order details
- [ ] Customer email includes tracking info

---

## Integration Testing

### End-to-End Flows

#### Scenario 1: Add Multiple Items & Checkout

- [ ] Add product from Vendor A
- [ ] Add product from Vendor B
- [ ] Both appear in cart
- [ ] Total calculates correctly
- [ ] Navigate to checkout
- [ ] Review page shows both items
- [ ] Payment succeeds
- [ ] Two separate orders created
- [ ] Confirmation emails sent

#### Scenario 2: Cart Persistence

- [ ] Add items to cart (logged out)
- [ ] Close browser
- [ ] Reopen app
- [ ] Cart items still present
- [ ] Quantities preserved

#### Scenario 3: Notification Workflow

- [ ] Create order
- [ ] In-app notification appears
- [ ] Bell icon badge updates
- [ ] Dropdown shows notification
- [ ] Full center loads
- [ ] Mark as read works
- [ ] Badge disappears
- [ ] Notification center reflects change

#### Scenario 4: Inventory Management

- [ ] Product has 5 in stock
- [ ] Add 3 to cart
- [ ] Proceed to checkout
- [ ] Stock reduces to 2
- [ ] Try to add more after purchase
- [ ] Cannot exceed new stock

---

## Performance & UX

### Performance

- [ ] Cart operations complete <200ms
- [ ] Page transitions smooth (no lag)
- [ ] Notification dropdown loads quickly
- [ ] Bundle size increase <50KB

### User Experience

- [ ] Cart icon always visible
- [ ] Feedback clear for all actions
- [ ] Error messages helpful
- [ ] Success confirmations present
- [ ] Mobile responsive
- [ ] Accessibility compliant (a11y)

---

## Security & Authorization

### Authentication

- [ ] Only authenticated users can access cart
- [ ] Users can only see their own cart
- [ ] Users can only see their notifications

### Data Validation

- [ ] Quantity must be positive integer
- [ ] Product IDs validated
- [ ] Vendor IDs validated
- [ ] No SQL injection possible
- [ ] No XSS vulnerabilities

### Rate Limiting

- [ ] Cart operations rate-limited
- [ ] Notification queries rate-limited
- [ ] Prevents abuse

---

## Documentation

- [ ] README updated with cart usage
- [ ] API documentation updated
- [ ] Component props documented (JSDoc)
- [ ] Setup instructions clear
- [ ] Troubleshooting guide included

---

## Deployment Readiness

### Pre-Merge Checklist

- [ ] All tests passing
- [ ] TypeScript: Zero errors
- [ ] Build: Successful
- [ ] No console errors/warnings
- [ ] No uncommitted changes
- [ ] Branch is up-to-date with main

### Version Control

- [ ] Tag `v5.0` created
- [ ] Release notes written
- [ ] Changelog updated
- [ ] All commits signed

### Deployment

- [ ] Staging deployment successful
- [ ] Production deployment ready
- [ ] Rollback plan documented
- [ ] Monitoring/alerts configured

---

## Sign-Off

| Role      | Sign-Off   | Date |
| --------- | ---------- | ---- |
| Developer | ⏳ Pending | TBD  |
| QA        | ⏳ Pending | TBD  |
| Product   | ⏳ Pending | TBD  |
| DevOps    | ⏳ Pending | TBD  |

---

**Checklist Version:** 1.0  
**Last Updated:** 2024-11-04  
**Status:** 🔒 LOCKED  
**Next Review:** Pre-deployment Phase 5 Step 1
