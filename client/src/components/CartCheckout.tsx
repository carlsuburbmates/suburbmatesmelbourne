import React from "react";
import { useCart } from "@/_core/contexts/CartContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import { Loader2 } from "lucide-react";

interface CartCheckoutProps {
  onCheckout?: () => void;
}

export const CartCheckout: React.FC<CartCheckoutProps> = ({ onCheckout }) => {
  const { items, totalCents, itemCount, isLoading } = useCart();
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      setLocation("/auth");
      return;
    }

    if (itemCount === 0) {
      return;
    }

    try {
      setIsProcessing(true);
      
      // TODO: Implement checkout flow
      // 1. Group items by vendor
      // 2. Create orders for each vendor
      // 3. Trigger payment processing
      // 4. Clear cart on success
      
      console.log("[Cart Checkout] Items by vendor:", items.reduce((acc, item) => {
        if (!acc[item.vendorId]) acc[item.vendorId] = [];
        acc[item.vendorId].push(item);
        return acc;
      }, {} as Record<number, typeof items>));

      onCheckout?.();
    } catch (error) {
      console.error("[Cart Checkout] Error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Calculate subtotals
  const subtotal = totalCents;
  const shippingEstimate = 0; // Can be calculated per vendor later
  const taxEstimate = Math.round(subtotal * 0.1); // 10% placeholder
  const total = subtotal + shippingEstimate + taxEstimate;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal ({itemCount} items)</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Shipping (est.)</span>
            <span>{formatPrice(shippingEstimate)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Tax (est.)</span>
            <span>{formatPrice(taxEstimate)}</span>
          </div>
        </div>
        <Separator />
        <div className="flex justify-between font-semibold text-lg">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>

        {!isAuthenticated && (
          <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
            Sign in to proceed with checkout
          </div>
        )}

        <Button
          onClick={handleCheckout}
          disabled={itemCount === 0 || isLoading || isProcessing}
          className="w-full bg-forest-600 hover:bg-forest-700 text-white"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : isAuthenticated ? (
            "Proceed to Checkout"
          ) : (
            "Sign In to Checkout"
          )}
        </Button>

        <Link href="/directory">
          <Button variant="outline" className="w-full">
            Continue Shopping
          </Button>
        </Link>

        {itemCount > 0 && (
          <div className="text-xs text-gray-500 text-center">
            Your items are saved in the cart
          </div>
        )}
      </CardContent>
    </Card>
  );
};
