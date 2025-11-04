import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { ShoppingCart, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { z } from "zod";

const orderCreateSchema = z.object({
  productId: z.number().positive("Product ID required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  notes: z.string().optional(),
  shippingAddress: z.string().optional(),
});

type OrderCreateInput = z.infer<typeof orderCreateSchema>;

interface OrderFormProps {
  productId: number;
  productTitle: string;
  price: number;
  onSuccess: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function OrderForm({
  productId,
  productTitle,
  price,
  onSuccess,
  onCancel,
  isLoading = false,
}: OrderFormProps) {
  const form = useForm<any>({
    resolver: zodResolver(orderCreateSchema),
    defaultValues: {
      productId,
      quantity: 1,
      notes: "",
      shippingAddress: "",
    },
  });

  const quantity = form.watch("quantity");
  const subtotal = price * quantity;

  const handleSubmit = async (data: any) => {
    // TODO: Call tRPC endpoint to create order
    console.log("Order data:", data);
    console.log("Subtotal:", subtotal);
    onSuccess();
    form.reset();
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Order {productTitle}
        </CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={onCancel}
          disabled={isLoading}
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            {/* Product Info */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <h3 className="font-semibold text-sm">{productTitle}</h3>
              <p className="text-2xl font-bold text-emerald-600">
                ${price.toFixed(2)} per unit
              </p>
            </div>

            {/* Quantity */}
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="1"
                      min="1"
                      {...field}
                      onChange={e =>
                        field.onChange(parseInt(e.target.value) || 1)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Shipping Address */}
            <FormField
              control={form.control}
              name="shippingAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Delivery Address</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter full delivery address"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    For pickup orders, you can leave this blank
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Order Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Special Requests</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any special instructions for the vendor..."
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Order Summary */}
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-semibold">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Platform fee (8%):</span>
                <span className="font-semibold">
                  ${(subtotal * 0.08).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-base font-bold pt-2 border-t">
                <span>Total:</span>
                <span className="text-emerald-600">
                  ${(subtotal * 1.08).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                {isLoading ? (
                  <>
                    <Spinner className="w-4 h-4 mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Proceed to Checkout
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>

            <p className="text-xs text-gray-500 text-center">
              You will complete payment securely with Stripe
            </p>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
