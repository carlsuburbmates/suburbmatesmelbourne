import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Plus,
  AlertCircle,
  Edit2,
  Trash2,
  Image as ImageIcon,
  Eye,
  EyeOff,
  MoreVertical,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ProductsListProps {
  vendorId: string;
  onEditClick?: (productId: number) => void;
  onCreateClick?: () => void;
  pageSize?: number;
}

interface Product {
  id: number;
  title: string;
  description?: string | null;
  price: string;
  kind: string;
  fulfillmentMethod: string;
  stock?: number;
  isActive: boolean;
}

export function ProductsList({
  vendorId,
  onEditClick,
  onCreateClick,
  pageSize = 12,
}: ProductsListProps) {
  const [offset, setOffset] = useState(0);
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(
    new Set()
  );
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const queryClient = trpc.useUtils();

  // Fetch products for vendor
  const { data, isLoading, error } = trpc.product.listByVendor.useQuery({
    vendorId: parseInt(vendorId, 10),
    limit: pageSize,
    offset,
  });

  // Deactivate mutation
  const deactivateMutation = trpc.product.deactivate.useMutation({
    onSuccess: () => {
      toast.success("Product deactivated");
      setDeleteConfirmId(null);
      queryClient.product.listByVendor.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to deactivate product");
    },
  });

  const products = data?.products || [];
  const pagination = data?.pagination;

  const handleSelectAll = () => {
    if (selectedProducts.size === products.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(products.map((p: Product) => p.id)));
    }
  };

  const handleSelectProduct = (productId: number) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const handleBulkDeactivate = async () => {
    if (selectedProducts.size === 0) return;

    const count = selectedProducts.size;
    try {
      const promises = Array.from(selectedProducts).map((id: number) =>
        deactivateMutation.mutateAsync({ id })
      );
      await Promise.all(promises);
      toast.success(`Deactivated ${count} product${count !== 1 ? "s" : ""}`);
      setSelectedProducts(new Set());
    } catch (error) {
      toast.error("Failed to deactivate some products");
    }
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load products: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-4">
                <Skeleton className="h-40 w-full mb-4 rounded" />
                <Skeleton className="h-5 w-2/3 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-3" />
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const hasProducts = products.length > 0;

  return (
    <div className="space-y-4">
      {/* Empty State */}
      {!hasProducts && (
        <Card className="border-dashed">
          <CardContent className="pt-12 pb-12 text-center">
            <ImageIcon className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 mb-4">No products yet</p>
            <Button onClick={onCreateClick} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Your First Product
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Bulk Actions Bar */}
      {hasProducts && selectedProducts.size > 0 && (
        <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <span className="text-sm font-medium text-blue-900">
            {selectedProducts.size} of {products.length} products selected
          </span>
          <div className="flex-1" />
          <Button
            size="sm"
            variant="destructive"
            onClick={handleBulkDeactivate}
            disabled={deactivateMutation.isPending}
          >
            Deactivate ({selectedProducts.size})
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSelectedProducts(new Set())}
          >
            Clear
          </Button>
        </div>
      )}

      {/* Products Grid */}
      {hasProducts && (
        <>
          {/* Header with Select All */}
          <div className="flex items-center gap-3 px-2 py-2">
            <Checkbox
              checked={selectedProducts.size === products.length}
              onCheckedChange={() => handleSelectAll()}
            />
            <span className="text-sm font-medium text-slate-600">
              {selectedProducts.size === products.length
                ? "All selected"
                : "Select all"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product: Product) => (
              <ProductCard
                key={product.id}
                product={product}
                selected={selectedProducts.has(product.id)}
                onSelect={() => handleSelectProduct(product.id)}
                onEdit={() => onEditClick?.(product.id)}
                onDelete={() => setDeleteConfirmId(product.id)}
                isDeleting={deactivateMutation.isPending}
              />
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.hasMore && (
            <div className="flex gap-2 justify-center pt-4">
              <Button
                variant="outline"
                disabled={offset === 0}
                onClick={() => setOffset(Math.max(0, offset - pageSize))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={() => setOffset(offset + pageSize)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirmId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Product?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the product from your catalog. You can reactivate
              it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={async () => {
                if (deleteConfirmId !== null) {
                  await deactivateMutation.mutateAsync({ id: deleteConfirmId });
                }
              }}
              disabled={deactivateMutation.isPending}
            >
              Deactivate
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface ProductCardProps {
  product: Product;
  selected?: boolean;
  onSelect?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
}

function ProductCard({
  product,
  selected = false,
  onSelect,
  onEdit,
  onDelete,
  isDeleting = false,
}: ProductCardProps) {
  const price = parseFloat(product.price as unknown as string).toFixed(2);
  const fulfillmentLabel =
    product.fulfillmentMethod === "pickup"
      ? "🚗 Pickup"
      : product.fulfillmentMethod === "delivery"
        ? "🚚 Delivery"
        : "🚗 Pickup & 🚚 Delivery";

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all",
        selected && "ring-2 ring-blue-500"
      )}
    >
      {/* Checkbox */}
      <div className="absolute top-2 left-2 z-10">
        <Checkbox
          checked={selected}
          onCheckedChange={onSelect}
          className="border-white shadow-md"
        />
      </div>

      {/* Image Placeholder */}
      <div className="aspect-square bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
        <ImageIcon className="h-8 w-8 text-slate-400" />
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Status Badge */}
        <div className="flex gap-2">
          <Badge
            variant={product.isActive ? "default" : "secondary"}
            className="text-xs"
          >
            {product.isActive ? (
              <Eye className="h-3 w-3 mr-1" />
            ) : (
              <EyeOff className="h-3 w-3 mr-1" />
            )}
            {product.isActive ? "Active" : "Inactive"}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {product.kind}
          </Badge>
        </div>

        {/* Title and Price */}
        <div>
          <h3 className="font-semibold text-sm text-slate-900 truncate">
            {product.title}
          </h3>
          <p className="text-lg font-bold text-green-600 mt-1">${price}</p>
        </div>

        {/* Details */}
        <div className="space-y-1 text-xs text-slate-600">
          <p>{fulfillmentLabel}</p>
          {product.stock !== undefined && (
            <p>
              Stock: <span className="font-medium">{product.stock} units</span>
            </p>
          )}
        </div>

        {/* Description Preview */}
        {product.description && (
          <p className="text-xs text-slate-500 line-clamp-2">
            {product.description}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={onEdit}
            disabled={isDeleting}
          >
            <Edit2 className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={onDelete}
            disabled={isDeleting}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                disabled={isDeleting}
              >
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Product
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
