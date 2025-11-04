# Suburbmates Project TODO

**Project:** Suburbmates - Melbourne Hyper-Local Marketplace & Business Directory  
**Status:** Phase 1 - Foundation (In Progress)  
**Blueprint Version:** 2.0 (Final)

---

## Phase 1: Foundation (The Directory)

### Core Data Models & Database

- [x] Create `businesses` table with schema (id, ownerId, businessName, abn, abnVerifiedStatus, services, about, address, phone, website, openingHours)
- [x] Create `agreements` table for business terms (id, businessId, agreementType, version, acceptedAt)
- [x] Create `consents` table for privacy/marketing (id, userId, consentType, ip, ua, timestamp)
- [x] Create Melbourne Postcodes/Suburbs reference table for geofencing
- [x] Run `pnpm db:push` to migrate schema

### Authentication & User Hierarchy

- [x] Implement passwordless email link authentication flow
- [x] Create user role hierarchy: `buyer`, `business_owner`, `vendor`, `admin`
- [x] Implement email verification and one-time login link generation
- [x] Create session management with HTTP-only cookies
- [x] Add `useAuth()` hook for frontend authentication state

### Business Verification & Compliance

- [ ] Implement ABN verification integration (Australian Business Register)
- [x] Create ABN verification status tracking (pending, verified, rejected)
- [ ] Build legal compliance checklist (terms, privacy policy, etc.)
- [x] Create consent tracking system for GDPR/privacy compliance

### Design System & Mobile Enhancement

- [x] Define color palette and typography for "wow factor" aesthetic
- [x] Create Tailwind CSS configuration with custom design tokens
- [x] Build mobile-first responsive layout system
- [x] Implement smooth animations and optimized framing for motion
- [x] Create reusable UI component library using shadcn/ui

### UI/UX - Core Pages

- [x] Build landing page with hero section and feature highlights
- [x] Create business directory homepage with search and filtering
- [x] Build business profile view page
- [x] Create user registration/onboarding flow
- [x] Build user account settings page
- [x] Implement navigation structure (top nav, breadcrumbs, etc.)

---

## Phase 2: Marketplace Core

### Marketplace Data Models

- [x] Create `products` table (id, vendorId, title, description, price, category, kind, fulfillmentMethod, stockQuantity, imageUrl, isActive)
- [ ] Create `categories` table for product/service organization
- [ ] Create `reviews` table for ratings and feedback
- [ ] Create `favorites` table for user saved listings

### Vendor Features

- [ ] Build vendor upgrade flow from business_owner to vendor role
- [ ] Create vendor dashboard with analytics
- [x] Implement tRPC API endpoints for product CRUD (vendor.getProducts, vendor.createProduct, vendor.updateProduct, vendor.deleteProduct)
- [x] Create ProductForm component for creating/editing products
- [x] Create ProductCard component for displaying products
- [x] Create ProductsList component for managing vendor products
- [ ] Build inventory management system
- [ ] Create vendor communication interface

### Checkout & Payments

- [ ] Integrate Stripe payment processing
- [ ] Build shopping cart system
- [ ] Create checkout flow with order summary
- [ ] Implement order confirmation and receipt emails
- [ ] Create payment status tracking
- [x] Implement tRPC API endpoints for order management (order.getMine, order.getByVendor, order.getById, order.updateFulfillmentStatus)
- [x] Create OrderForm component for creating orders
- [x] Create OrdersList component for managing orders (buyer and vendor views)
- [x] Add order filtering by status and fulfillment status

### Communication & Notifications

- [ ] Build in-app messaging system between buyers and vendors
- [ ] Create email notification system for order updates
- [ ] Implement SMS notifications (optional)
- [ ] Build notification preferences management

### UI/UX - Marketplace Pages

- [ ] Build marketplace browsing interface
- [ ] Create advanced search and filtering
- [ ] Build listing detail page with images and reviews
- [ ] Create shopping cart and checkout UI
- [ ] Build vendor dashboard UI
- [ ] Create order history and tracking page

---

## Phase 3: Post-Transaction & Hardening

### Refund & Dispute System

- [ ] Create `refunds` table (id, orderId, reason, status, amount, processedAt)
- [ ] Build refund request interface
- [ ] Implement refund approval workflow
- [ ] Create dispute resolution system

### Stripe Integration & Webhooks

- [ ] Implement Stripe webhook handlers for payment events
- [ ] Create webhook signature verification
- [ ] Build payment reconciliation system
- [ ] Implement automatic refund processing

### AI-Powered Automation

- [ ] Implement AI-powered product description generation
- [ ] Build AI recommendation system for listings
- [ ] Create automated fraud detection
- [ ] Implement AI-powered customer support chatbot

### Security & Privacy

- [ ] Implement rate limiting on API endpoints
- [ ] Add CSRF protection
- [ ] Create data encryption for sensitive fields
- [ ] Build audit logging system
- [ ] Implement role-based access control (RBAC)
- [ ] Add IP whitelisting for admin panel

### Data Governance & Monitoring

- [ ] Create data retention policies
- [ ] Build data export functionality (GDPR compliance)
- [ ] Implement activity logging and monitoring
- [ ] Create analytics dashboard for platform metrics
- [ ] Build performance monitoring

### Testing & QA

- [ ] Write unit tests for core business logic
- [ ] Create integration tests for API endpoints
- [ ] Build end-to-end tests for critical user flows
- [ ] Implement performance testing
- [ ] Create security testing checklist

---

## Frontend Implementation Tasks

### Design & Styling

- [ ] Choose and implement color scheme (luxury fitness + accessible fitness blend)
- [ ] Set up Google Fonts integration
- [ ] Configure Tailwind CSS with custom theme
- [ ] Create component library documentation

### Core Components

- [ ] Build Header/Navigation component
- [ ] Create Footer component
- [ ] Build SearchBar component
- [ ] Create BusinessCard component
- [ ] Build ListingCard component
- [ ] Create UserProfile component
- [ ] Build ShoppingCart component
- [ ] Create CheckoutForm component

### Pages

- [ ] Home/Landing page
- [ ] Business Directory page
- [ ] Business Profile page
- [ ] Marketplace Browse page
- [ ] Listing Detail page
- [ ] User Dashboard page
- [ ] Vendor Dashboard page
- [ ] Cart & Checkout pages
- [ ] Order History page
- [ ] Settings page

---

## Backend Implementation Tasks

### tRPC Routers

- [ ] Create `business` router (list, get, create, update, verify)
- [ ] Create `auth` router (login, logout, verify email)
- [ ] Create `user` router (profile, settings, preferences)
- [ ] Create `listings` router (CRUD operations)
- [ ] Create `cart` router (add, remove, update items)
- [ ] Create `orders` router (create, get, list, track)
- [ ] Create `payments` router (process, webhook handlers)
- [ ] Create `reviews` router (create, list, update)
- [ ] Create `search` router (full-text search, filtering)

### Database Queries

- [ ] Implement business search with geofencing
- [ ] Create listing search with advanced filters
- [ ] Build user order history query
- [ ] Implement vendor analytics queries
- [ ] Create reporting queries for admin

### External Integrations

- [ ] Set up Stripe API integration
- [ ] Integrate ABN verification service
- [ ] Set up email service (SendGrid/Mailgun)
- [ ] Configure SMS service (optional)
- [ ] Integrate Google Maps API for location services

---

## Deployment & DevOps

- [ ] Set up CI/CD pipeline
- [ ] Configure environment variables for production
- [ ] Set up database backups
- [ ] Configure CDN for static assets
- [ ] Set up monitoring and alerting
- [ ] Create deployment documentation
- [ ] Set up SSL/TLS certificates

---

## Documentation & Launch

- [ ] Create user guide (userGuide.md)
- [ ] Write API documentation
- [ ] Create admin guide
- [ ] Build help/FAQ section
- [ ] Create privacy policy
- [ ] Create terms of service
- [ ] Launch beta testing program
- [ ] Create marketing materials

---

## Notes

- **Design Philosophy:** Mobile-first, minimalist design with "wow factor" through optimized framing and motion
- **Target Market:** Melbourne-based businesses and local shoppers
- **Key Differentiators:** Hyper-local focus, ABN verification, community-driven
- **Monetization:** Commission on transactions, premium vendor features, advertising
- **Compliance:** GDPR, Australian Consumer Law, ABN requirements
