import React from "react";
import { useCart } from "@/_core/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/utils";
import { Link } from "wouter";

interface CartSummaryProps {
  onCheckout?: () => void;
}

export const CartSummary: React.FC<CartSummaryProps> = ({ onCheckout }) => {
  const { items, totalCents, itemCount, isLoading } = useCart();

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
            <span className="text-gray-600">Subtotal</span>
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
        <Button
          onClick={onCheckout}
          disabled={itemCount === 0 || isLoading}
          className="w-full bg-forest-600 hover:bg-forest-700 text-white"
        >
          Proceed to Checkout
        </Button>
        <Link href="/directory">
          <Button variant="outline" className="w-full">
            Continue Shopping
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};
