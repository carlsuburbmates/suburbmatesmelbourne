import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ProductKind = "service" | "product" | "package";

interface ProductCardProps {
  productId: number;
  title: string;
  price: number;
  kind: ProductKind;
  stockQuantity: number;
  isActive: boolean;
  description?: string;
  onEdit?: () => void;
  onDeactivate?: () => void;
  isLoading?: boolean;
}

const kindLabelMap: Record<ProductKind, string> = {
  service: "Service",
  product: "Product",
  package: "Package",
};

const kindColorMap: Record<ProductKind, string> = {
  service: "bg-blue-100 text-blue-800",
  product: "bg-purple-100 text-purple-800",
  package: "bg-emerald-100 text-emerald-800",
};

export function ProductCard({
  productId,
  title,
  price,
  kind,
  stockQuantity,
  isActive,
  description,
  onEdit,
  onDeactivate,
  isLoading = false,
}: ProductCardProps) {
  const priceDisplay = typeof price === "string" ? parseFloat(price) : price;

  return (
    <Card className={cn(!isActive && "opacity-60")}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base line-clamp-1">{title}</CardTitle>
            {description && <p className="text-sm text-slate-600 line-clamp-1 mt-1">{description}</p>}
          </div>
          <Badge className={cn(kindColorMap[kind], "shrink-0")}>{kindLabelMap[kind]}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-slate-600">Price</p>
            <p className="font-semibold text-lg">${priceDisplay.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Stock</p>
            <p className="font-semibold text-lg">{stockQuantity}</p>
          </div>
        </div>

        {!isActive && (
          <div className="bg-amber-50 border border-amber-200 rounded px-3 py-2">
            <p className="text-sm text-amber-800 font-medium">This product is inactive</p>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            disabled={isLoading || !isActive}
            className="flex-1 gap-2"
          >
            <Edit2 className="w-4 h-4" />
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={onDeactivate}
            disabled={isLoading || !isActive}
            className="flex-1 gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Deactivate
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
