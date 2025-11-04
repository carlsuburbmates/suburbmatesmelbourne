import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { ProductCard } from "./ProductCard";
import { ProductForm } from "./ProductForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

interface ProductsListProps {
  vendorId?: number;
  isEditable?: boolean;
}

export function ProductsList({
  vendorId,
  isEditable = false,
}: ProductsListProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Fetch products for the vendor
  const {
    data: products,
    isLoading,
    error,
  } = trpc.vendor.getProducts.useQuery(
    { vendorId: vendorId || 0 },
    { enabled: !!vendorId }
  );

  // Mutations
  const createMutation = trpc.vendor.createProduct.useMutation();
  const deleteMutation = trpc.vendor.deleteProduct.useMutation();

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-40 w-full mb-4" />
              <Skeleton className="h-6 w-2/3 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-4" />
              <Skeleton className="h-8 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (showForm && isEditable) {
    return (
      <ProductForm
        mode={editingId ? "edit" : "create"}
        vendorId={vendorId}
        initialData={
          editingId && products
            ? products.find((p: any) => p.id === editingId)
            : undefined
        }
        onSuccess={() => {
          setShowForm(false);
          setEditingId(null);
        }}
        onCancel={() => {
          setShowForm(false);
          setEditingId(null);
        }}
        isLoading={createMutation.isPending}
      />
    );
  }

  return (
    <div className="space-y-6">
      {isEditable && (
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Products</h2>
          <Button
            onClick={() => {
              setEditingId(null);
              setShowForm(true);
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </div>
      )}

      {!products || products.length === 0 ? (
        <Card>
          <CardContent className="pt-12 text-center">
            <p className="text-gray-500 mb-4">No products yet</p>
            {isEditable && (
              <Button
                onClick={() => {
                  setEditingId(null);
                  setShowForm(true);
                }}
                variant="outline"
              >
                Create Your First Product
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map(product => (
            <ProductCard
              key={product.id}
              id={product.id}
              title={product.title}
              description={product.description || undefined}
              price={
                typeof product.price === "string"
                  ? parseFloat(product.price)
                  : product.price
              }
              category={product.category || undefined}
              kind={product.kind as "service" | "product" | "package"}
              fulfillmentMethod={
                product.fulfillmentMethod as "pickup" | "delivery" | "both"
              }
              stockQuantity={product.stockQuantity || 0}
              imageUrl={product.imageUrl || undefined}
              onEdit={
                isEditable
                  ? id => {
                      setEditingId(id);
                      setShowForm(true);
                    }
                  : undefined
              }
              onDelete={
                isEditable
                  ? async id => {
                      if (
                        window.confirm(
                          "Are you sure you want to delete this product?"
                        )
                      ) {
                        try {
                          await deleteMutation.mutateAsync({ productId: id });
                        } catch (error) {
                          console.error("Failed to delete product:", error);
                        }
                      }
                    }
                  : undefined
              }
              isLoading={deleteMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}
