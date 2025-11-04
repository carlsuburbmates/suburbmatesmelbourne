import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { AlertCircle, CheckCircle } from "lucide-react";

/**
 * StripeTest - Debug page to validate Stripe Checkout Session integration
 * This page is NOT part of the user-facing interface and should only be accessible in dev mode
 * It tests the full checkout flow: create order → get payment intent → redirect URL
 */
export function StripeTest() {
  const { user, isAuthenticated } = useAuth();
  const [testOrderId, setTestOrderId] = useState<number | null>(null);
  const [paymentIntentData, setPaymentIntentData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const createPaymentIntentMutation = trpc.checkout.createPaymentIntent.useMutation({
    onSuccess: (data) => {
      setPaymentIntentData(data);
      setSuccess("✅ Payment intent created successfully!");
      console.log("Payment Intent Data:", data);
    },
    onError: (error) => {
      setError(`❌ Error: ${error.message}`);
      console.error("Payment Intent Error:", error);
    },
  });

  const handleTestCheckout = async () => {
    if (!testOrderId) {
      setError("Please enter a test order ID");
      return;
    }

    setError(null);
    setSuccess(null);
    setPaymentIntentData(null);

    console.log(`Testing checkout for order ${testOrderId}`);
    createPaymentIntentMutation.mutate({ orderId: testOrderId });
  };

  const handleRedirect = () => {
    if (paymentIntentData?.url) {
      window.location.href = paymentIntentData.url;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Stripe Test - Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600">Please log in to access the Stripe test page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto py-8">
      <Card>
        <CardHeader className="bg-red-50 border-b">
          <CardTitle className="text-red-900">🧪 Stripe Checkout Test (Dev Only)</CardTitle>
          <p className="text-sm text-red-700 mt-2">
            This page is for testing the Stripe Checkout Session integration. Do not use in production.
          </p>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {/* User Info */}
          <div className="bg-slate-50 p-4 rounded-lg">
            <p className="text-sm font-semibold">Authenticated User</p>
            <p className="text-sm text-slate-600 mt-1">
              {user?.name} ({user?.email})
            </p>
          </div>

          {/* Test Controls */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Test Order ID</label>
              <input
                type="number"
                value={testOrderId || ""}
                onChange={(e) => setTestOrderId(e.target.value ? parseInt(e.target.value) : null)}
                placeholder="Enter an order ID to test"
                className="w-full mt-2 px-3 py-2 border rounded-md text-sm"
              />
              <p className="text-xs text-slate-600 mt-1">
                Enter an order ID that exists in the database and belongs to you (as buyer)
              </p>
            </div>

            <Button
              onClick={handleTestCheckout}
              disabled={!testOrderId || createPaymentIntentMutation.isPending}
              className="w-full"
            >
              {createPaymentIntentMutation.isPending ? (
                <>
                  <Spinner className="w-4 h-4 mr-2" />
                  Creating Payment Intent...
                </>
              ) : (
                "Test Checkout → Create Payment Intent"
              )}
            </Button>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Alert */}
          {success && (
            <Alert className="bg-emerald-50 border-emerald-200 text-emerald-900">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* Payment Intent Response */}
          {paymentIntentData && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-3">Payment Intent Response</h3>

                <div className="bg-slate-50 p-4 rounded-lg space-y-3 text-xs font-mono max-h-64 overflow-auto">
                  <div>
                    <p className="text-slate-600">Client ID:</p>
                    <p className="text-slate-900 break-all">{paymentIntentData.clientId}</p>
                  </div>

                  {paymentIntentData.url && (
                    <div>
                      <p className="text-slate-600">Checkout URL:</p>
                      <p className="text-slate-900 break-all">{paymentIntentData.url}</p>
                    </div>
                  )}

                  {paymentIntentData.error && (
                    <div>
                      <p className="text-red-600">Error:</p>
                      <p className="text-red-900">{paymentIntentData.error}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-slate-600">Full Response (JSON):</p>
                    <pre className="text-slate-900 whitespace-pre-wrap break-words">
                      {JSON.stringify(paymentIntentData, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Redirect Button */}
              {paymentIntentData.url && (
                <Button onClick={handleRedirect} className="w-full bg-emerald-600 hover:bg-emerald-700">
                  Redirect to Stripe Checkout →
                </Button>
              )}
            </div>
          )}

          {/* Documentation */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
            <h3 className="font-semibold text-blue-900 mb-2">How to Use This Test Page</h3>
            <ol className="text-blue-900 space-y-1 list-decimal list-inside">
              <li>Create a test order first (via the Orders page or API)</li>
              <li>Copy the order ID</li>
              <li>Paste it into the input field above</li>
              <li>Click "Test Checkout" to create a payment intent</li>
              <li>If successful, you'll see the Stripe Checkout URL</li>
              <li>Click "Redirect to Stripe Checkout" to test the full flow</li>
              <li>Use Stripe test card: 4242 4242 4242 4242 (exp: any future date, CVC: any 3 digits)</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
