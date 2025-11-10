import React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, Zap } from "lucide-react";

interface TierInfo {
  tier: "none" | "basic" | "featured";
  limit: number;
  current: number;
  canAdd: boolean;
  expiresAt?: Date;
}

interface BillingCardProps {
  tierInfo: TierInfo;
  subscriptionStatus: string;
  onUpgrade: () => void;
  onManage: () => void;
  isLoading?: boolean;
}

/**
 * BillingCard Component
 * Displays vendor's current tier, product limits, and upgrade CTA
 * Uses v5.2 design tokens: Forest Green primary, Emerald success, Gold trust
 * WCAG 2.2 AA compliant with 4.5:1 contrast ratios
 */
export const BillingCard: React.FC<BillingCardProps> = ({
  tierInfo,
  subscriptionStatus,
  onUpgrade,
  onManage,
  isLoading = false,
}) => {
  const getTierLabel = (tier: string) => {
    switch (tier) {
      case "featured":
        return "Featured";
      case "basic":
        return "Basic";
      default:
        return "Free";
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "featured":
        return "bg-emerald-50 border-emerald-200";
      case "basic":
        return "bg-amber-50 border-amber-200";
      default:
        return "bg-stone-50 border-stone-200";
    }
  };

  const getBadgeVariant = (
    tier: string
  ): "default" | "secondary" | "destructive" | "outline" => {
    switch (tier) {
      case "featured":
        return "default";
      case "basic":
        return "secondary";
      default:
        return "outline";
    }
  };

  const isExpiringSoon =
    tierInfo.expiresAt &&
    new Date(tierInfo.expiresAt).getTime() - new Date().getTime() <
      7 * 24 * 60 * 60 * 1000;

  const productUsagePercent = Math.round(
    (tierInfo.current / tierInfo.limit) * 100
  );

  return (
    <Card
      className={cn(
        "border-2 transition-all duration-200",
        getTierColor(tierInfo.tier)
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-lg font-bold text-forest-900">
              {getTierLabel(tierInfo.tier)} Plan
            </CardTitle>
            <CardDescription className="mt-1 text-sm text-stone-600">
              {tierInfo.tier === "featured"
                ? "$29/month"
                : tierInfo.tier === "basic"
                  ? "Limited tier"
                  : "No active subscription"}
            </CardDescription>
          </div>
          <Badge variant={getBadgeVariant(tierInfo.tier)} className="text-xs">
            {subscriptionStatus === "featured_active"
              ? "Active"
              : subscriptionStatus === "basic_active"
                ? "Active"
                : "Inactive"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Product Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-forest-900">
              Product Slots
            </span>
            <span className="text-sm font-semibold text-forest-700">
              {tierInfo.current} / {tierInfo.limit}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="h-2 w-full overflow-hidden rounded-full bg-stone-200">
            <div
              className={cn(
                "h-full transition-all duration-300",
                productUsagePercent >= 90
                  ? "bg-red-500"
                  : productUsagePercent >= 75
                    ? "bg-amber-400"
                    : "bg-emerald-500"
              )}
              style={{ width: `${Math.min(productUsagePercent, 100)}%` }}
              role="progressbar"
              aria-valuenow={tierInfo.current}
              aria-valuemin={0}
              aria-valuemax={tierInfo.limit}
              aria-label="Product usage"
            />
          </div>

          {/* Usage Status Text */}
          {productUsagePercent >= 90 ? (
            <p className="flex items-center gap-2 text-xs font-medium text-red-600">
              <AlertCircle className="h-4 w-4" />
              Limit nearly reached. {tierInfo.limit - tierInfo.current} slots remaining.
            </p>
          ) : productUsagePercent >= 75 ? (
            <p className="flex items-center gap-2 text-xs font-medium text-amber-600">
              <AlertCircle className="h-4 w-4" />
              {tierInfo.limit - tierInfo.current} slots remaining.
            </p>
          ) : (
            <p className="flex items-center gap-2 text-xs font-medium text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
              {tierInfo.limit - tierInfo.current} slots available.
            </p>
          )}
        </div>

        {/* Expiration Warning */}
        {isExpiringSoon && tierInfo.expiresAt && (
          <div className="rounded-lg bg-amber-50 p-3 border border-amber-200">
            <p className="text-xs font-medium text-amber-900">
              ⚠️ Your subscription renews on{" "}
              {new Date(tierInfo.expiresAt).toLocaleDateString("en-AU", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        )}

        {/* Tier Benefits */}
        <div className="rounded-lg bg-white/50 p-3 border border-stone-200">
          <p className="text-xs font-semibold text-forest-900 mb-2">Tier Benefits:</p>
          <ul className="space-y-1 text-xs text-stone-700">
            {tierInfo.tier === "featured" && (
              <>
                <li className="flex items-center gap-2">
                  <Zap className="h-3 w-3 text-gold-400" />
                  <span>48 product slots</span>
                </li>
                <li className="flex items-center gap-2">
                  <Zap className="h-3 w-3 text-gold-400" />
                  <span>6% platform fee (vs 8%)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Zap className="h-3 w-3 text-gold-400" />
                  <span>Featured marketplace placement</span>
                </li>
              </>
            )}
            {tierInfo.tier === "basic" && (
              <>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  <span>12 product slots</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  <span>8% platform fee</span>
                </li>
              </>
            )}
            {tierInfo.tier === "none" && (
              <>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-stone-400" />
                  <span>3 product slots</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-stone-400" />
                  <span>Limited features</span>
                </li>
              </>
            )}
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {tierInfo.tier !== "featured" && (
            <Button
              onClick={onUpgrade}
              disabled={isLoading}
              className="flex-1 bg-gold-400 text-forest-900 font-semibold hover:bg-gold-400/90 transition-colors duration-200"
            >
              {isLoading ? "Loading..." : "Upgrade to Featured"}
            </Button>
          )}

          {tierInfo.tier === "featured" && (
            <Button
              onClick={onManage}
              disabled={isLoading}
              variant="outline"
              className="flex-1 border-forest-200 text-forest-900 hover:bg-forest-50 transition-colors duration-200"
            >
              Manage Subscription
            </Button>
          )}

          {tierInfo.tier === "basic" && (
            <>
              <Button
                onClick={onUpgrade}
                disabled={isLoading}
                className="flex-1 bg-gold-400 text-forest-900 font-semibold hover:bg-gold-400/90 transition-colors duration-200"
              >
                Upgrade
              </Button>
            </>
          )}
        </div>

        {/* Info Text */}
        <p className="text-xs text-stone-600 text-center pt-1">
          Billing renewals happen on your subscription renewal date.{" "}
          <a href="#" className="text-emerald-600 hover:text-emerald-700 font-medium">
            Learn more
          </a>
        </p>
      </CardContent>
    </Card>
  );
};

export default BillingCard;
