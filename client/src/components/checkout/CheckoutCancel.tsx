import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

/**
 * CheckoutCancel - Payment cancellation page
 * User is redirected here if they cancel the Stripe Checkout
 */
export function CheckoutCancel() {
  const [location, navigate] = useLocation();

  // Extract query params
  const searchParams = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : ""
  );
  const orderId = searchParams.get("orderId");

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-amber-50 to-slate-50 p-4">
      <Card className="w-full max-w-md border-amber-200 shadow-lg">
        <CardHeader className="bg-amber-50 border-b border-amber-200">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-amber-100 rounded-full p-3">
              <AlertCircle className="w-8 h-8 text-amber-600" />
            </div>
          </div>
          <CardTitle className="text-center text-amber-900">
            Payment Cancelled
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          <div className="text-center space-y-2">
            <p className="text-slate-600">Your payment was not completed.</p>
            {orderId && (
              <p className="text-sm text-slate-500">
                Order #{orderId} is still pending.
              </p>
            )}
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-900 font-medium">
              Payment not processed
            </p>
            <p className="text-sm text-amber-700 mt-1">
              You can return to complete your payment anytime.
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => {
                if (orderId) {
                  navigate(`/checkout/${orderId}`);
                } else {
                  navigate("/orders");
                }
              }}
              className="w-full bg-amber-600 hover:bg-amber-700"
            >
              {orderId ? "Return to Checkout" : "View My Orders"}
            </Button>
            <Button
              onClick={() => navigate("/")}
              variant="outline"
              className="w-full"
            >
              Back to Home
            </Button>
          </div>

          <div className="text-center text-xs text-slate-500 border-t pt-4">
            <p>
              Need help? Contact us at{" "}
              <a
                href="mailto:support@suburbmates.com"
                className="text-blue-600 hover:underline"
              >
                support@suburbmates.com
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
