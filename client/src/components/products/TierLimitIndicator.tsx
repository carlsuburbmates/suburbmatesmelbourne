import { trpc } from "@/lib/trpc";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, TrendingUp, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface TierLimitIndicatorProps {
  vendorId?: string;
  onCreateClick?: () => void;
}

export function TierLimitIndicator({
  onCreateClick,
}: TierLimitIndicatorProps) {
  const { data: tierInfo, isLoading } = trpc.product.checkTierLimit.useQuery();

  if (isLoading || !tierInfo) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="h-8 bg-slate-200 rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  const percentageUsed = (tierInfo.current / tierInfo.limit) * 100;
  const remaining = tierInfo.limit - tierInfo.current;
  const isFull = tierInfo.current >= tierInfo.limit;
  const isNearLimit = percentageUsed >= 80;

  let progressColor = "bg-green-500";
  if (isNearLimit && !isFull) progressColor = "bg-amber-500";
  if (isFull) progressColor = "bg-red-500";

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-slate-600" />
              <div>
                <p className="text-sm font-medium text-slate-900">Your Tier</p>
                <p className="text-xs text-slate-500">
                  {tierInfo.tier.toUpperCase()}
                </p>
              </div>
            </div>
            <span className="text-lg font-bold text-slate-900">
              {tierInfo.current}/{tierInfo.limit}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress
              value={percentageUsed}
              className={cn("h-2", progressColor && "bg-slate-200")}
            />
            <p className="text-sm text-slate-600">
              {tierInfo.canAdd
                ? `${remaining} product${remaining !== 1 ? "s" : ""} available`
                : "Product limit reached"}
            </p>
          </div>

          {/* Warning Message */}
          {isFull && (
            <div className="flex gap-2 rounded-md bg-red-50 p-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">
                You've reached your product limit. Upgrade your tier to add more
                products.
              </p>
            </div>
          )}

          {isNearLimit && !isFull && (
            <div className="flex gap-2 rounded-md bg-amber-50 p-3">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700">
                You're near your product limit ({remaining} remaining). Consider upgrading your tier soon.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {tierInfo.canAdd && (
              <Button
                size="sm"
                onClick={onCreateClick}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Product
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              disabled={tierInfo.tier === "featured_active"}
            >
              {tierInfo.tier === "featured_active"
                ? "Premium Tier Active"
                : "Upgrade Tier"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
