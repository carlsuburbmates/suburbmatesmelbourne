import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

interface ProductFormProps {
  vendorId: string;
  product?: {
    id: number;
    title: string;
    description: string | null;
    price: string;
    kind: string;
    fulfillmentMethod: string;
    stock?: number;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ProductForm({
  vendorId,
  product,
  onSuccess,
  onCancel,
  open = false,
  onOpenChange,
}: ProductFormProps) {
  const [title, setTitle] = useState<string>(product?.title || "");
  const [description, setDescription] = useState<string>(product?.description ?? "");
  const [price, setPrice] = useState<string>(product ? product.price : "");
  const [kind, setKind] = useState<string>(product?.kind || "product");
  const [fulfillmentMethod, setFulfillmentMethod] = useState<string>(
    product?.fulfillmentMethod || "pickup"
  );
  const [stock, setStock] = useState<number>(product?.stock || 0);
  const [tierError, setTierError] = useState<string | null>(null);
  const queryClient = trpc.useUtils();

  // Check tier limit before allowing create
  const { data: tierInfo } = trpc.product.checkTierLimit.useQuery(undefined, {
    enabled: open && !product,
  });

  // Create and update mutations
  const createMutation = trpc.product.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Product "${data.product.title}" created successfully!`);
      handleOpenChange(false);
      queryClient.product.listByVendor.invalidate();
      onSuccess?.();
    },
    onError: (error) => {
      if (error.data?.code === "BAD_REQUEST") {
        setTierError(error.message);
      } else {
        toast.error(error.message || "Failed to create product");
      }
    },
  });

  const updateMutation = trpc.product.update.useMutation({
    onSuccess: () => {
      toast.success(`Product updated successfully!`);
      handleOpenChange(false);
      queryClient.product.listByVendor.invalidate();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update product");
    },
  });

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange?.(newOpen);
    if (!newOpen) {
      setTierError(null);
      setTitle(product?.title || "");
      setDescription(product?.description ?? "");
      setPrice(product ? product.price : "");
      setKind(product?.kind || "product");
      setFulfillmentMethod(product?.fulfillmentMethod || "pickup");
      setStock(product?.stock || 0);
      onCancel?.();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (product) {
        await updateMutation.mutateAsync({
          id: product.id,
          title,
          description: description.length > 0 ? description : undefined,
          price: parseFloat(price) || 0,
          kind: kind as "service" | "product" | "package",
          fulfillmentMethod: fulfillmentMethod as
            | "pickup"
            | "delivery"
            | "both",
          stockQuantity: stock,
        });
      } else {
        await createMutation.mutateAsync({
          title,
          description: description.length > 0 ? description : undefined,
          price: parseFloat(price) || 0,
          kind: kind as "service" | "product" | "package",
          fulfillmentMethod: fulfillmentMethod as
            | "pickup"
            | "delivery"
            | "both",
          stockQuantity: stock,
        });
      }
    } catch {
      // Error handled by mutation callbacks
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const canCreateProduct = !product && tierInfo?.canAdd;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {product ? "Edit Product" : "Create New Product"}
          </DialogTitle>
          <DialogDescription>
            {product
              ? "Update product details below"
              : "Add a new product to your catalog"}
          </DialogDescription>
        </DialogHeader>

        {tierError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{tierError}</AlertDescription>
          </Alert>
        )}

        {!product && tierInfo && !canCreateProduct && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Product limit reached. Your {tierInfo.tier} tier allows{" "}
              {tierInfo.limit} products, you have {tierInfo.current}.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Product Title
            </label>
            <Input
              placeholder="e.g., Premium Photography Session"
              disabled={isLoading || (!product && !canCreateProduct)}
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Description (Optional)
            </label>
            <Textarea
              placeholder="Describe your product or service..."
              disabled={isLoading || (!product && !canCreateProduct)}
              className="h-20"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <p className="text-xs text-slate-500 mt-1">
              {description.length}/500 characters
            </p>
          </div>

          {/* Price */}
          <div>
            <label className="text-sm font-medium mb-2 block">Price ($)</label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              disabled={isLoading || (!product && !canCreateProduct)}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </div>

          {/* Kind */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Product Type
            </label>
            <Select
              disabled={isLoading || (!product && !canCreateProduct)}
              onValueChange={setKind}
              value={kind}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="service">Service</SelectItem>
                <SelectItem value="product">Product</SelectItem>
                <SelectItem value="package">Package</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Fulfillment Method */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Fulfillment Method
            </label>
            <Select
              disabled={isLoading || (!product && !canCreateProduct)}
              onValueChange={setFulfillmentMethod}
              value={fulfillmentMethod}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select method..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pickup">Pickup</SelectItem>
                <SelectItem value="delivery">Delivery</SelectItem>
                <SelectItem value="both">Pickup & Delivery</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Stock (for Phase 5.9) */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Stock Count
            </label>
            <Input
              type="number"
              placeholder="0"
              disabled={isLoading || (!product && !canCreateProduct)}
              value={stock}
              onChange={(e) => setStock(parseInt(e.target.value) || 0)}
            />
            <p className="text-xs text-slate-500 mt-1">Used for inventory tracking</p>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              disabled={isLoading}
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isLoading || (!product && !canCreateProduct) || !title.trim()
              }
            >
              {isLoading && <Spinner className="mr-2 h-4 w-4" />}
              {product ? "Update Product" : "Create Product"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
