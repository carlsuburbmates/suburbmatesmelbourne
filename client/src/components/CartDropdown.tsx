import React from "react";
import { useCart } from "@/_core/contexts/CartContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { CartIcon } from "./CartIcon";
import { Trash2 } from "lucide-react";
import { formatPrice } from "@/lib/utils";

export const CartDropdown: React.FC = () => {
  const { items, totalCents, itemCount, removeItem } = useCart();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <CartIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        {itemCount === 0 ? (
          <div className="p-4 text-center text-gray-500">
            Your cart is empty
          </div>
        ) : (
          <>
            <div className="p-3 max-h-80 overflow-y-auto">
              {items.map((item) => (
                <div
                  key={`${item.productId}-${item.vendorId}`}
                  className="flex gap-3 py-2 border-b last:border-b-0"
                >
                  {item.imageUrl && (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-12 h-12 object-cover rounded"
                    />
                  )}
                  <div className="flex-1 text-sm">
                    <p className="font-medium truncate">{item.title}</p>
                    <p className="text-gray-600">
                      {item.quantity} × {formatPrice(item.price)}
                    </p>
                  </div>
                  <button
                    onClick={() => removeItem(item.productId, item.vendorId)}
                    className="text-red-600 hover:text-red-700 p-1"
                    aria-label="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <DropdownMenuSeparator />
            <div className="p-3">
              <div className="flex justify-between mb-3 font-semibold">
                <span>Total:</span>
                <span>{formatPrice(totalCents)}</span>
              </div>
              <Link href="/cart">
                <Button className="w-full bg-forest-600 hover:bg-forest-700">
                  View Cart
                </Button>
              </Link>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
