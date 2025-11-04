import React from "react";
import { useCart } from "@/_core/contexts/CartContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import { CartItemCard } from "@/components/CartItemCard";
import { CartSummary } from "@/components/CartSummary";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart } from "lucide-react";

export const CartPage: React.FC = () => {
  const { items, clear, isLoading } = useCart();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Sign in to view your cart</h1>
          <p className="text-gray-600 mb-6">
            Please sign in to continue shopping
          </p>
          <Link href="/">
            <Button className="bg-forest-600 hover:bg-forest-700">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="text-center">
          <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
          <p className="text-gray-600 mb-6">
            Start shopping to add items to your cart
          </p>
          <Link href="/directory">
            <Button className="bg-forest-600 hover:bg-forest-700">
              Browse Products
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleCheckout = () => {
    // TODO: Implement checkout flow
    console.log("[Cart] Checkout initiated");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center mb-4">
              <p className="text-gray-600">
                {items.length} {items.length === 1 ? "item" : "items"}
              </p>
              <Button
                variant="outline"
                onClick={clear}
                disabled={isLoading}
                className="text-red-600 hover:text-red-700"
              >
                Clear Cart
              </Button>
            </div>
            <Separator />
            {items.map((item) => (
              <CartItemCard
                key={`${item.productId}-${item.vendorId}`}
                item={item}
              />
            ))}
          </div>

          <div>
            <CartSummary onCheckout={handleCheckout} />
          </div>
        </div>
      </div>
    </div>
  );
};
