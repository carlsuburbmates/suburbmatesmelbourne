import { useState, useEffect } from "react";
import { OrderCard } from "./OrderCard";
import { ListSkeletonLoader } from "./SkeletonLoaders";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";

type OrderStatus = "pending" | "completed" | "failed" | "refunded" | "disputed";

interface Order {
  id: number;
  status: OrderStatus;
  totalCents: number;
  buyerId: number;
  vendorId: number;
  createdAt: Date | string;
  itemCount?: number;
  buyerName?: string;
  vendorName?: string;
}

interface OrderListProps {
  orders: Order[];
  isLoading: boolean;
  error: Error | any | null;
  onRefresh: () => void;
  onOrderClick: (orderId: number) => void;
  variant?: "buyer" | "vendor";
  isRefetching?: boolean;
}

export function OrderList({
  orders,
  isLoading,
  error,
  onRefresh,
  onOrderClick,
  variant = "buyer",
  isRefetching = false,
}: OrderListProps) {
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  useEffect(() => {
    if (!isRefetching && orders.length > 0) {
      setLastRefresh(new Date());
    }
  }, [orders, isRefetching]);

  if (error) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {typeof error === "string"
              ? error
              : error?.message || "Failed to load orders"}
          </AlertDescription>
        </Alert>
        <Button onClick={onRefresh} variant="outline" className="w-full">
          <RotateCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return <ListSkeletonLoader count={5} />;
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600 mb-4">
          {variant === "buyer" ? "No orders yet" : "No orders to manage"}
        </p>
        <Button onClick={onRefresh} variant="outline">
          <RotateCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with last refresh time */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {lastRefresh
            ? `Last updated: ${lastRefresh.toLocaleTimeString()}`
            : "Loading..."}
        </p>
        <Button
          onClick={onRefresh}
          variant="ghost"
          size="sm"
          disabled={isRefetching}
          className={cn(isRefetching && "animate-spin")}
        >
          <RotateCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Orders Grid */}
      <div className="grid gap-4">
        {orders.map(order => (
          <OrderCard
            key={order.id}
            orderId={order.id}
            status={order.status}
            totalCents={order.totalCents}
            itemCount={order.itemCount || 0}
            buyerName={order.buyerName}
            vendorName={order.vendorName}
            createdAt={order.createdAt}
            onClick={() => onOrderClick(order.id)}
            variant={variant}
          />
        ))}
      </div>

      {/* Refetch indicator */}
      {isRefetching && (
        <div className="text-center py-2">
          <p className="text-sm text-slate-500">Updating...</p>
        </div>
      )}
    </div>
  );
}
