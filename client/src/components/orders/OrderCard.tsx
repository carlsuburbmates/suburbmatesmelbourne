import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./StatusBadge";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type OrderStatus = "pending" | "completed" | "failed" | "refunded" | "disputed";

interface OrderCardProps {
  orderId: number;
  status: OrderStatus;
  totalCents: number;
  itemCount: number;
  buyerName?: string;
  vendorName?: string;
  createdAt: Date | string;
  onClick?: () => void;
  variant?: "buyer" | "vendor";
}

export function OrderCard({
  orderId,
  status,
  totalCents,
  itemCount,
  buyerName,
  vendorName,
  createdAt,
  onClick,
  variant = "buyer",
}: OrderCardProps) {
  const date = typeof createdAt === "string" ? new Date(createdAt) : createdAt;
  const formattedDate = date.toLocaleDateString("en-AU", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const totalAmount = (totalCents / 100).toFixed(2);

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        onClick && "hover:bg-slate-50"
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base">Order #{orderId}</CardTitle>
            <p className="text-sm text-slate-600 mt-1">{formattedDate}</p>
          </div>
          <StatusBadge status={status} />
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600">Items:</span>
          <span className="font-medium">{itemCount}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600">Total:</span>
          <span className="font-semibold text-lg">${totalAmount}</span>
        </div>

        {variant === "buyer" && vendorName && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Vendor:</span>
            <span className="text-sm font-medium">{vendorName}</span>
          </div>
        )}

        {variant === "vendor" && buyerName && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Buyer:</span>
            <span className="text-sm font-medium">{buyerName}</span>
          </div>
        )}

        {onClick && (
          <Button
            variant="outline"
            className="w-full mt-2 justify-between"
            onClick={e => {
              e.stopPropagation();
              onClick();
            }}
          >
            <span>View Details</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
