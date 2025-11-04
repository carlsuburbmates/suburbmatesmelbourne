import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { AlertCircle, CreditCard, Loader2 } from "lucide-react";

/**
 * CheckoutEntry - Stripe Checkout Session redirect page
 * User arrives here to proceed with payment for an order
 */
export function CheckoutEntry() {
  const [, params] = useRoute("/checkout/:orderId");
  const { isAuthenticated } = useAuth();
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const orderId = params?.orderId ? parseInt(params.orderId) : null;

  // Fetch order details
  const { data: order, isLoading: orderLoading } = trpc.order.getById.useQuery(
    { orderId: orderId! },
    { enabled: !!orderId && isAuthenticated }
  );

  // Create checkout session mutation
  const createCheckoutSessionMutation =
    trpc.checkout.createCheckoutSession.useMutation({
      onSuccess: data => {
        if (data.url) {
          setRedirecting(true);
          // Redirect to Stripe Checkout
          window.location.href = data.url;
        } else {
          setError("No checkout URL received. Please try again.");
        }
      },
      onError: error => {
        setError(`Payment error: ${error.message}`);
        setRedirecting(false);
      },
    });

  // Auto-initiate checkout when order is loaded and not pending payment
  useEffect(() => {
    if (order && !redirecting && !createCheckoutSessionMutation.isPending) {
      // Auto-proceed with checkout
      handleProceedToCheckout();
    }
  }, [order]);

  const handleProceedToCheckout = () => {
    if (!orderId) return;

    setError(null);
    createCheckoutSessionMutation.mutate({ orderId });
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600">
              Please log in to proceed with checkout.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!orderId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invalid Order</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600">
              No order ID provided. Please try again.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="bg-emerald-50 border-b">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Secure Checkout
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* Loading Order */}
          {orderLoading && (
            <div className="space-y-4">
              <div className="flex items-center justify-center py-8">
                <Spinner className="w-8 h-8" />
              </div>
              <p className="text-center text-slate-600">
                Loading order details...
              </p>
            </div>
          )}

          {/* Order Summary */}
          {order && !redirecting && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-600">Order ID</span>
                  <span className="font-medium">#{order.id}</span>
                </div>
                <div className="flex justify-between text-lg">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold text-emerald-600">
                    ${(order.totalCents / 100).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Info Message */}
              <Alert className="bg-blue-50 border-blue-200 text-blue-900">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You will be redirected to Stripe Checkout to complete your
                  payment securely.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Error */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Redirecting Message */}
          {redirecting && (
            <div className="space-y-4">
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              </div>
              <p className="text-center text-slate-600">
                Redirecting to Stripe Checkout...
              </p>
            </div>
          )}

          {/* Action Buttons */}
          {!orderLoading && !redirecting && (
            <Button
              onClick={handleProceedToCheckout}
              disabled={createCheckoutSessionMutation.isPending}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              size="lg"
            >
              {createCheckoutSessionMutation.isPending ? (
                <>
                  <Spinner className="w-4 h-4 mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Proceed to Stripe Checkout
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
