import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertCircle } from "lucide-react";

/**
 * Vendor Setup Page - Stripe Connect Onboarding Flow
 * Protected page for business owners to upgrade to vendors
 */
export function VendorSetup() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [businessId, setBusinessId] = useState<string>("");
  const [step, setStep] = useState<"select" | "connecting" | "complete">("select");
  const [error, setError] = useState<string>("");

  const initiateOnboarding = trpc.vendor.initiateStripeOnboarding.useMutation();

  // Redirect if not authenticated
  if (!user) {
    setLocation("/auth");
    return null;
  }

  const handleInitiateOnboarding = async () => {
    if (!businessId) {
      setError("Please enter a business ID");
      return;
    }

    setStep("connecting");
    setError("");

    try {
      const result = await initiateOnboarding.mutateAsync({
        businessId: parseInt(businessId),
        redirectUrl: `${window.location.origin}/dashboard/vendor/setup/complete`,
      });

      // In production, redirect to Stripe onboarding link
      if (result.onboardingLink) {
        // window.location.href = result.onboardingLink;
      }

      setStep("complete");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to initiate Stripe onboarding"
      );
      setStep("select");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-emerald-900 mb-2">
            Become a Vendor
          </h1>
          <p className="text-lg text-emerald-700">
            Set up Stripe payments and start selling on Suburbmates
          </p>
        </div>

        {/* Step Indicator */}
        <div className="mb-8 flex items-center justify-between">
          <div className="text-center flex-1">
            <Badge
              variant={step === "select" ? "default" : "secondary"}
              className="mb-2"
            >
              1
            </Badge>
            <p className="text-sm font-medium">Connect Stripe</p>
          </div>
          <div className="w-12 h-1 bg-emerald-200 mb-8" />
          <div className="text-center flex-1">
            <Badge
              variant={step === "complete" ? "default" : "secondary"}
              className="mb-2"
            >
              2
            </Badge>
            <p className="text-sm font-medium">Complete</p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
        {step === "select" && (
          <Card className="bg-white border-emerald-200">
            <CardHeader>
              <CardTitle>Connect Your Stripe Account</CardTitle>
              <CardDescription>
                Enter your business ID to proceed with Stripe Connect setup
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="businessId" className="text-emerald-900">
                  Business ID
                </Label>
                <Input
                  id="businessId"
                  type="text"
                  placeholder="Enter your business ID"
                  value={businessId}
                  onChange={e => setBusinessId(e.target.value)}
                  className="mt-2 border-emerald-200 focus:border-emerald-600"
                />
                <p className="text-xs text-gray-500 mt-2">
                  You can find this in your business profile
                </p>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded p-4">
                <h3 className="font-medium text-emerald-900 mb-2">
                  What you'll need:
                </h3>
                <ul className="text-sm text-emerald-700 space-y-1">
                  <li>✓ Active Stripe account (or create one)</li>
                  <li>✓ Business verification documents</li>
                  <li>✓ Bank account details for payouts</li>
                </ul>
              </div>

              <Button
                onClick={handleInitiateOnboarding}
                disabled={!businessId || initiateOnboarding.isPending}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {initiateOnboarding.isPending
                  ? "Connecting..."
                  : "Connect with Stripe →"}
              </Button>
            </CardContent>
          </Card>
        )}

        {step === "connecting" && (
          <Card className="bg-white border-emerald-200">
            <CardContent className="pt-8 text-center">
              <div className="animate-spin h-12 w-12 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto mb-4" />
              <h3 className="text-lg font-medium text-emerald-900 mb-2">
                Connecting to Stripe...
              </h3>
              <p className="text-gray-600">
                Please wait while we set up your Stripe account
              </p>
            </CardContent>
          </Card>
        )}

        {step === "complete" && (
          <Card className="bg-white border-emerald-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
                Setup Complete!
              </CardTitle>
              <CardDescription>
                Your vendor account is ready
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded p-4">
                <p className="text-emerald-900 font-medium mb-2">
                  You're now a verified vendor!
                </p>
                <p className="text-sm text-emerald-700">
                  Your business is now listed on the Suburbmates marketplace.
                  Customers can find you through our vendor directory.
                </p>
              </div>

              <Button
                onClick={() => setLocation("/dashboard/vendor")}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Go to Vendor Dashboard →
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
