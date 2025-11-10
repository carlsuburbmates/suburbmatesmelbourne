import React, { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { DashboardLayoutSkeleton } from "@/components/DashboardLayoutSkeleton";
import ErrorBoundary from "@/components/ErrorBoundary";
import { BillingCard } from "@/components/BillingCard";
import { TierUpgradeModal } from "@/components/TierUpgradeModal";
import { SubscriptionStatus } from "@/components/SubscriptionStatus";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Check } from "lucide-react";
import { useLocation } from "wouter";

/**
 * BillingPage Component
 * Vendor billing dashboard with tier management, subscription, and billing history
 * Phase 5 Step 3 (Vendor Tiers & Subscriptions)
 *
 * Routes:
 * /vendor/billing - Main billing dashboard
 * /vendor/billing?session_id=... - Post-checkout verification
 */
export const BillingPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [isVerifyingCheckout, setIsVerifyingCheckout] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  const subscriptionStatus = trpc.subscription.getStatus.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "vendor",
  });

  const billingHistory = trpc.subscription.getBillingHistory.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "vendor",
  });

  const upgradeToFeaturedMutation = trpc.subscription.upgradeToFeatured.useMutation();

  const verifyCheckoutMutation = trpc.subscription.verifyCheckoutSession.useMutation();

  const portalUrlMutation = trpc.subscription.getPortalUrl.useMutation();

  // Handle checkout verification on mount if session_id present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");

    if (sessionId && !isVerifyingCheckout && !checkoutSuccess) {
      setIsVerifyingCheckout(true);
      verifyCheckoutMutation.mutate(
        { sessionId },
        {
          onSuccess: (data: any) => {
            setCheckoutSuccess(data.status === "paid");
            setIsVerifyingCheckout(false);

            // Clear URL params after verification
            const newUrl = window.location.pathname;
            window.history.replaceState({}, "", newUrl);

            // Refetch subscription status
            subscriptionStatus.refetch();
          },
          onError: (error: any) => {
            setCheckoutError(error.message);
            setIsVerifyingCheckout(false);
          },
        }
      );
    }
  }, []);

  // Redirect if not vendor
  useEffect(() => {
    if (isAuthenticated && user?.role !== "vendor") {
      setLocation("/");
    }
  }, [isAuthenticated, user]);

  if (!isAuthenticated || !user || user.role !== "vendor") {
    return null;
  }

  if (subscriptionStatus.isLoading) {
    return <DashboardLayoutSkeleton />;
  }

  if (subscriptionStatus.isError) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold text-forest-900">Billing & Subscriptions</h1>
            <p className="text-stone-600 mt-2">Manage your subscription and billing information</p>
          </div>

          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load subscription details. Please try again later.
            </AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }

  const status = subscriptionStatus.data;

  return (
    <ErrorBoundary>
      <DashboardLayout>
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-forest-900">Billing & Subscriptions</h1>
            <p className="text-stone-600 mt-2">
              Manage your subscription tier and billing information
            </p>
          </div>

          {/* Checkout Success Message */}
          {checkoutSuccess && (
            <Alert className="bg-emerald-50 border border-emerald-200">
              <Check className="h-4 w-4 text-emerald-600" />
              <AlertDescription className="text-emerald-800">
                <strong>Success!</strong> Your subscription has been activated. Your new tier is now available.
              </AlertDescription>
            </Alert>
          )}

          {/* Checkout Error Message */}
          {checkoutError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{checkoutError}</AlertDescription>
            </Alert>
          )}

          {/* Verification In Progress */}
          {isVerifyingCheckout && (
            <Alert className="bg-blue-50 border border-blue-200">
              <div className="flex items-center gap-2">
                <div className="inline-block h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-blue-800">
                  Verifying your subscription... Please wait.
                </span>
              </div>
            </Alert>
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Billing Card - Featured */}
            <div className="lg:col-span-2">
              <BillingCard
                tierInfo={{
                  tier: status?.tier || "none",
                  limit: status?.productLimit || 3,
                  current: status?.currentProducts || 0,
                  canAdd: status?.canAddProducts || false,
                  expiresAt: status?.expiresAt,
                }}
                subscriptionStatus={status?.subscriptionStatus || "free"}
                onUpgrade={() => setUpgradeModalOpen(true)}
                onManage={async () => {
                  try {
                    const { portalUrl } = await portalUrlMutation.mutateAsync();
                    window.location.href = portalUrl;
                  } catch (error) {
                    console.error("Failed to access portal:", error);
                  }
                }}
                isLoading={upgradeToFeaturedMutation.isPending}
              />
            </div>

            {/* Quick Stats */}
            <div className="space-y-4">
              <Card className="border-2 border-stone-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold text-forest-900">
                    Tier Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <p className="text-stone-600 font-medium">Current Tier</p>
                    <p className="text-base font-bold text-forest-900 mt-1">
                      {status?.tier === "featured"
                        ? "Featured"
                        : status?.tier === "basic"
                          ? "Basic"
                          : "Free"}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-stone-200">
                    <p className="text-stone-600 font-medium">Product Slots</p>
                    <p className="text-base font-bold text-forest-900 mt-1">
                      {status?.currentProducts} / {status?.productLimit}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-stone-200">
                    <p className="text-stone-600 font-medium">Monthly Price</p>
                    <p className="text-base font-bold text-forest-900 mt-1">
                      {status?.tier === "featured" ? "$29" : "Free"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-stone-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold text-forest-900">
                    Platform Fees
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-stone-600">Transaction Fee</span>
                    <span className="font-semibold text-forest-900">
                      {status?.tier === "featured" ? "6%" : "8%"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-stone-600">Fixed Fee</span>
                    <span className="font-semibold text-forest-900">$0.50</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Subscription Status & Billing History */}
          <SubscriptionStatus
            tier={status?.tier || "none"}
            subscriptionStatus={status?.subscriptionStatus || "free"}
            renewsAt={
              status?.subscriptionRenewsAt
                ? typeof status.subscriptionRenewsAt === "string"
                  ? new Date(status.subscriptionRenewsAt)
                  : status.subscriptionRenewsAt
                : undefined
            }
            billingInfo={
              billingHistory.data && {
                invoices: billingHistory.data.invoices.map((inv) => ({
                  id: inv.id,
                  number: inv.number,
                  amount: inv.amount,
                  currency: inv.currency,
                  status: inv.status || null,
                  paidAt: inv.paidAt ? new Date(inv.paidAt) : null,
                  dueDate: inv.dueDate ? new Date(inv.dueDate) : null,
                  pdf: inv.pdf || null,
                })),
                upcomingInvoice: billingHistory.data.upcomingInvoice
                  ? {
                      amount: billingHistory.data.upcomingInvoice.amount,
                      dueDate: billingHistory.data.upcomingInvoice.dueDate
                        ? new Date(billingHistory.data.upcomingInvoice.dueDate)
                        : null,
                    }
                  : null,
              }
            }
            onManagePayment={async () => {
              try {
                const { portalUrl } = await portalUrlMutation.mutateAsync();
                window.location.href = portalUrl;
              } catch (error) {
                console.error("Failed to access portal:", error);
              }
            }}
            isLoading={portalUrlMutation.isPending}
          />

          {/* Info Cards */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-2 border-stone-200 bg-forest-50">
              <CardHeader>
                <CardTitle className="text-base font-bold text-forest-900">
                  How Upgrades Work
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-stone-700">
                <p>
                  • Click "Upgrade to Featured" to start your subscription
                </p>
                <p>
                  • You'll be redirected to Stripe's secure checkout
                </p>
                <p>
                  • Your tier upgrades immediately after payment
                </p>
                <p>
                  • Subscribe monthly—cancel anytime
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-stone-200 bg-emerald-50">
              <CardHeader>
                <CardTitle className="text-base font-bold text-forest-900">
                  Tier Benefits
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-stone-700">
                <p>
                  ✓ Featured: 48 products, 6% fee, featured placement
                </p>
                <p>
                  ✓ Basic: 12 products, 8% fee
                </p>
                <p>
                  ✓ Free: 3 products, 8% fee
                </p>
                <p>
                  <a href="#" className="text-emerald-600 hover:text-emerald-700 font-medium">
                    Learn more →
                  </a>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Upgrade Modal */}
        <TierUpgradeModal
          open={upgradeModalOpen}
          onOpenChange={setUpgradeModalOpen}
          currentTier={status?.tier || "none"}
          onConfirm={async (tier) => {
            try {
              if (tier === "featured") {
                const result = await upgradeToFeaturedMutation.mutateAsync();
                if (result?.checkoutUrl) {
                  window.location.href = result.checkoutUrl;
                }
              }
            } catch (error) {
              console.error("Upgrade failed:", error);
              setCheckoutError("Failed to initiate upgrade. Please try again.");
            }
          }}
          isLoading={upgradeToFeaturedMutation.isPending}
        />
      </DashboardLayout>
    </ErrorBoundary>
  );
};

export default BillingPage;
