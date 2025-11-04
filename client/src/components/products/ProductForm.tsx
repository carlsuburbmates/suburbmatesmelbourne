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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { productCreateSchema, productUpdateSchema } from "@/lib/schemas/forms";
import type {
  ProductCreateInput,
  ProductUpdateInput,
} from "@/lib/schemas/forms";
import { X, Save } from "lucide-react";
import { cn } from "@/lib/utils";

type ProductKind = "service" | "product" | "package";
type FulfillmentMethod = "pickup" | "delivery" | "both";

interface Product {
  id: number;
  title: string;
  description?: string | null;
  price: string | number;
  category?: string | null;
  kind: ProductKind;
  fulfillmentMethod: FulfillmentMethod;
  stockQuantity: number | null;
  imageUrl?: string | null;
}

interface ProductFormProps {
  mode: "create" | "edit";
  initialData?: Product;
  vendorId?: number;
  onSuccess: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ProductForm({
  mode,
  initialData,
  vendorId,
  onSuccess,
  onCancel,
  isLoading = false,
}: ProductFormProps) {
  const schema = mode === "create" ? productCreateSchema : productUpdateSchema;
  const form = useForm<any>({
    resolver: zodResolver(schema),
    defaultValues:
      mode === "edit" && initialData
        ? {
            productId: initialData.id,
            title: initialData.title,
            description: initialData.description || "",
            price:
              typeof initialData.price === "string"
                ? parseFloat(initialData.price)
                : initialData.price,
            category: initialData.category || "",
            kind: initialData.kind,
            fulfillmentMethod: initialData.fulfillmentMethod,
            stockQuantity: initialData.stockQuantity || 0,
            imageUrl: initialData.imageUrl || "",
          }
        : {
            vendorId,
            title: "",
            description: "",
            price: 0,
            category: "",
            kind: "service",
            fulfillmentMethod: "both",
            stockQuantity: 999,
            imageUrl: "",
          },
  });

  const handleSubmit = async (
    data: ProductCreateInput | ProductUpdateInput
  ) => {
    onSuccess();
    form.reset();
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">
          {mode === "create" ? "Create New Product" : "Edit Product"}
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
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter product name" {...field} />
                  </FormControl>
                  <FormDescription>Maximum 255 characters</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your product or service"
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Grid: Price + Category */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price (AUD) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        {...field}
                        onChange={e =>
                          field.onChange(parseFloat(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Cleaning, IT Support"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Grid: Kind + Fulfillment Method */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="kind"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="service">Service</SelectItem>
                        <SelectItem value="product">Product</SelectItem>
                        <SelectItem value="package">Package</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fulfillmentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fulfillment *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pickup">Pickup</SelectItem>
                        <SelectItem value="delivery">Delivery</SelectItem>
                        <SelectItem value="both">Both</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Stock Quantity */}
            <FormField
              control={form.control}
              name="stockQuantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock Quantity *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="999"
                      min="0"
                      {...field}
                      onChange={e =>
                        field.onChange(parseInt(e.target.value) || 0)
                      }
                    />
                  </FormControl>
                  <FormDescription>Number of items available</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Image URL */}
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://example.com/image.jpg"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Optional product image</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {mode === "create" ? "Create Product" : "Save Changes"}
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
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
