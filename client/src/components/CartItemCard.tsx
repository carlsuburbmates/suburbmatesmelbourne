import React from "react";
import { CartItem } from "@/_core/contexts/CartContext";
import { useCart } from "@/_core/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus, Minus } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

interface CartItemCardProps {
  item: CartItem;
}

export const CartItemCard: React.FC<CartItemCardProps> = ({ item }) => {
  const { updateQuantity, removeItem } = useCart();
  const [quantity, setQuantity] = React.useState(item.quantity);

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity < 1) return;
    setQuantity(newQuantity);
    await updateQuantity(item.productId, item.vendorId, newQuantity);
  };

  const handleRemove = async () => {
    await removeItem(item.productId, item.vendorId);
  };

  const subtotal = item.price * quantity;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-4">
          {item.imageUrl && (
            <img
              src={item.imageUrl}
              alt={item.title}
              className="w-24 h-24 object-cover rounded"
            />
          )}
          <div className="flex-1">
            <h3 className="font-semibold mb-2">{item.title}</h3>
            <p className="text-sm text-gray-600 mb-3">
              {formatPrice(item.price)} each
            </p>
            <div className="flex items-center gap-2 mb-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuantityChange(quantity - 1)}
                disabled={quantity <= 1}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-12 h-9 text-center"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuantityChange(quantity + 1)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold">
                Subtotal: {formatPrice(subtotal)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Remove
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
