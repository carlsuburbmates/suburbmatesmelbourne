import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Zap, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface TierUpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTier: "none" | "basic" | "featured";
  onConfirm: (tier: "basic" | "featured") => Promise<void>;
  isLoading?: boolean;
}

/**
 * TierUpgradeModal Component
 * Modal dialog for vendor to upgrade subscription tier
 * Displays tier comparison and upgrade pricing
 * Uses v5.2 design tokens with locked colors/typography
 */
export const TierUpgradeModal: React.FC<TierUpgradeModalProps> = ({
  open,
  onOpenChange,
  currentTier,
  onConfirm,
  isLoading = false,
}) => {
  const [selectedTier, setSelectedTier] = useState<"basic" | "featured">("featured");

  const tiers = [
    {
      id: "basic" as const,
      name: "Basic",
      price: "Free",
      period: "Forever",
      description: "Perfect for getting started",
      slots: 12,
      fee: "8.00%",
      features: [
        "12 product slots",
        "8% + $0.50 per transaction",
        "Standard marketplace placement",
        "Basic analytics",
        "Email support",
      ],
      highlighted: false,
    },
    {
      id: "featured" as const,
      name: "Featured",
      price: "$29",
      period: "/month",
      description: "Maximize your visibility",
      slots: 48,
      fee: "6.00%",
      features: [
        "48 product slots",
        "6% + $0.50 per transaction",
        "Featured placement in marketplace",
        "Advanced analytics",
        "Priority email & chat support",
        "Sales reports",
      ],
      highlighted: true,
    },
  ];

  const handleUpgrade = async () => {
    try {
      await onConfirm(selectedTier);
      onOpenChange(false);
    } catch (error) {
      console.error("Upgrade failed:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-2xl font-bold text-forest-900">
            Upgrade Your Tier
          </DialogTitle>
          <DialogDescription className="text-base text-stone-600">
            Choose the plan that works best for your business
          </DialogDescription>
        </DialogHeader>

        {/* Tier Cards Grid */}
        <div className="grid gap-4 md:grid-cols-2 py-6">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              onClick={() => setSelectedTier(tier.id)}
              className={cn(
                "relative rounded-lg border-2 cursor-pointer transition-all duration-200 p-6",
                selectedTier === tier.id
                  ? tier.id === "featured"
                    ? "border-gold-400 bg-gold-50 ring-2 ring-gold-400/30"
                    : "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/30"
                  : "border-stone-200 bg-stone-50 hover:border-stone-300",
                currentTier === tier.id && "opacity-60"
              )}
            >
              {/* Current Badge */}
              {currentTier === tier.id && (
                <div className="absolute top-3 right-3">
                  <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700">
                    Current
                  </Badge>
                </div>
              )}

              {/* Featured Badge */}
              {tier.highlighted && (
                <div className="absolute top-3 left-3">
                  <Badge className="text-xs bg-gold-400 text-forest-900 font-semibold">
                    <Zap className="h-3 w-3 mr-1" />
                    Best Value
                  </Badge>
                </div>
              )}

              <div className="space-y-4 mt-8">
                {/* Price */}
                <div>
                  <h3 className="text-xl font-bold text-forest-900">{tier.name}</h3>
                  <p className="text-sm text-stone-600 mt-1">{tier.description}</p>
                  <div className="mt-3">
                    <span className="text-3xl font-bold text-forest-900">{tier.price}</span>
                    <span className="text-sm text-stone-600 ml-1">{tier.period}</span>
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="bg-white/60 rounded-lg p-3 border border-stone-200">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-stone-600 font-medium">Products</p>
                      <p className="text-lg font-bold text-forest-900">{tier.slots}</p>
                    </div>
                    <div>
                      <p className="text-stone-600 font-medium">Fee Rate</p>
                      <p className="text-lg font-bold text-forest-900">{tier.fee}</p>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-2">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-stone-700">
                      {tier.id === "featured" ? (
                        <Zap className="h-4 w-4 text-gold-400 flex-shrink-0" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      )}
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* Select Button */}
                <Button
                  onClick={() => setSelectedTier(tier.id)}
                  variant={selectedTier === tier.id ? "default" : "outline"}
                  className={cn(
                    "w-full font-medium transition-colors duration-200",
                    selectedTier === tier.id
                      ? tier.id === "featured"
                        ? "bg-gold-400 text-forest-900 hover:bg-gold-400/90"
                        : "bg-emerald-500 text-white hover:bg-emerald-600"
                      : "border-stone-300 text-forest-900 hover:bg-stone-100"
                  )}
                  disabled={currentTier === tier.id}
                >
                  {currentTier === tier.id ? (
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Currently Active
                    </span>
                  ) : (
                    `Select ${tier.name}`
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Billing Info */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-900">Billing Information</p>
              <ul className="text-xs text-amber-800 mt-2 space-y-1">
                <li>• Subscription renews monthly on the same date</li>
                <li>• Cancel anytime - access continues until end of billing period</li>
                <li>• Product slot limits apply immediately upon upgrade</li>
                <li>• Powered by Stripe Billing - secure and PCI compliant</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Privacy Note */}
        <div className="bg-forest-50 border border-forest-200 rounded-lg p-3">
          <p className="text-xs text-forest-700">
            <Lock className="h-3 w-3 inline mr-1" />
            Your payment information is encrypted and handled by Stripe. SuburbMates never stores credit card details.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-stone-200">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="flex-1 border-stone-300 text-forest-900 hover:bg-stone-100"
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpgrade}
            disabled={isLoading || currentTier === selectedTier}
            className={cn(
              "flex-1 font-semibold transition-colors duration-200",
              selectedTier === "featured"
                ? "bg-gold-400 text-forest-900 hover:bg-gold-400/90 disabled:opacity-50"
                : "bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50"
            )}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Processing...
              </span>
            ) : (
              `Upgrade to ${tiers.find((t) => t.id === selectedTier)?.name}`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TierUpgradeModal;
