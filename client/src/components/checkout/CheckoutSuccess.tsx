import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

/**
 * CheckoutSuccess - Payment confirmation page
 * User is redirected here after successful Stripe payment
 */
export function CheckoutSuccess() {
  const [location, navigate] = useLocation();

  // Extract query params
  const searchParams = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : ""
  );
  const orderId = searchParams.get("orderId");
  const sessionId = searchParams.get("sessionId");

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-emerald-50 to-slate-50 p-4">
      <Card className="w-full max-w-md border-emerald-200 shadow-lg">
        <CardHeader className="bg-emerald-50 border-b border-emerald-200">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-emerald-100 rounded-full p-3">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
          </div>
          <CardTitle className="text-center text-emerald-900">
            Payment Successful
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          <div className="text-center space-y-2">
            <p className="text-slate-600">
              Your payment has been processed successfully.
            </p>
            {orderId && (
              <p className="text-sm text-slate-500">
                Order #{orderId} has been confirmed.
              </p>
            )}
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <p className="text-sm text-emerald-900 font-medium">
              ✓ Payment confirmed
            </p>
            <p className="text-sm text-emerald-700 mt-1">
              You will receive an email confirmation shortly.
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => navigate("/orders")}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              View My Orders
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
              Questions? Contact us at{" "}
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
