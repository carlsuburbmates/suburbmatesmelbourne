import React from "react";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/_core/contexts/CartContext";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CartIconProps {
  className?: string;
  onClick?: () => void;
}

export const CartIcon: React.FC<CartIconProps> = ({ className, onClick }) => {
  const { itemCount } = useCart();

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative inline-flex items-center justify-center p-2 text-forest-700 hover:text-forest-900 transition-colors",
        className
      )}
      aria-label={`Shopping cart with ${itemCount} items`}
    >
      <ShoppingCart className="w-6 h-6" />
      {itemCount > 0 && (
        <Badge
          variant="destructive"
          className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
        >
          {itemCount > 99 ? "99+" : itemCount}
        </Badge>
      )}
    </button>
  );
};
