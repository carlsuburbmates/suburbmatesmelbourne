import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Edit2, Trash2, Package, Truck, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  id: number;
  title: string;
  description?: string;
  price: number;
  category?: string;
  kind: "service" | "product" | "package";
  fulfillmentMethod: "pickup" | "delivery" | "both";
  stockQuantity: number;
  imageUrl?: string;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
  isLoading?: boolean;
}

const kindBadgeColor: Record<string, string> = {
  service: "bg-blue-100 text-blue-800",
  product: "bg-purple-100 text-purple-800",
  package: "bg-pink-100 text-pink-800",
};

const fulfillmentIcon: Record<string, typeof MapPin> = {
  pickup: MapPin,
  delivery: Truck,
  both: Package,
};

export function ProductCard({
  id,
  title,
  description,
  price,
  category,
  kind,
  fulfillmentMethod,
  stockQuantity,
  imageUrl,
  onEdit,
  onDelete,
  isLoading,
}: ProductCardProps) {
  const FulfillmentIcon = fulfillmentIcon[fulfillmentMethod];

  return (
    <Card className="h-full overflow-hidden hover:shadow-lg transition-shadow">
      {imageUrl && (
        <div className="w-full h-40 bg-gray-100 overflow-hidden">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.parentElement!.style.display = "none";
            }}
          />
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <Badge className={cn("capitalize", kindBadgeColor[kind])}>{kind}</Badge>
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <FulfillmentIcon className="w-3 h-3" />
            <span className="capitalize">{fulfillmentMethod === "both" ? "Flexible" : fulfillmentMethod}</span>
          </div>
        </div>
        <CardTitle className="text-base line-clamp-2">{title}</CardTitle>
        {category && <CardDescription className="text-xs">{category}</CardDescription>}
      </CardHeader>

      <CardContent className="space-y-2 pb-3">
        {description && (
          <p className="text-sm text-gray-600 line-clamp-2">{description}</p>
        )}

        <div className="flex items-center justify-between pt-2 border-t">
          <div>
            <p className="text-2xl font-bold text-emerald-600">
              ${price.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500">
              {stockQuantity > 0 ? `${stockQuantity} available` : "Out of stock"}
            </p>
          </div>

          {stockQuantity <= 5 && stockQuantity > 0 && (
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
              Low Stock
            </Badge>
          )}
        </div>
      </CardContent>

      {(onEdit || onDelete) && (
        <CardFooter className="flex gap-2 pt-2">
          {onEdit && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(id)}
              disabled={isLoading}
              className="flex-1"
            >
              <Edit2 className="w-4 h-4 mr-1" />
              Edit
            </Button>
          )}
          {onDelete && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onDelete(id)}
              disabled={isLoading}
              className="flex-1"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
