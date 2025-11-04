import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { OrderCard } from "./OrderCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Filter } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface OrdersListProps {
  view: "buyer" | "vendor";
  vendorId?: number;
  onViewDetails?: (orderId: number) => void;
}

export function OrdersList({ view, vendorId, onViewDetails }: OrdersListProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [fulfillmentFilter, setFulfillmentFilter] = useState<string>("all");

  // Fetch orders based on view
  const buyerQuery = trpc.order.getMine.useQuery(undefined, {
    enabled: view === "buyer",
  });

  const vendorQuery = trpc.order.getByVendor.useQuery(
    { vendorId: vendorId || 0 },
    { enabled: view === "vendor" && !!vendorId }
  );

  const {
    data: orders,
    isLoading,
    error,
  } = view === "buyer" ? buyerQuery : vendorQuery;

  // Filter orders
  const filteredOrders = useMemo(() => {
    if (!orders) return [];

    return orders.filter((order: any) => {
      const statusMatch =
        statusFilter === "all" || order.status === statusFilter;
      const fulfillmentMatch =
        fulfillmentFilter === "all" ||
        order.fulfillmentStatus === fulfillmentFilter;
      return statusMatch && fulfillmentMatch;
    });
  }, [orders, statusFilter, fulfillmentFilter]);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load orders: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">
          {view === "buyer" ? "Your Orders" : "Customer Orders"}
        </h2>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-600" />
            <span className="text-sm text-gray-600">Filter by:</span>
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
              <SelectItem value="disputed">Disputed</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={fulfillmentFilter}
            onValueChange={setFulfillmentFilter}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Fulfillment</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="ready">Ready</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Orders Grid */}
      {!filteredOrders || filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="pt-12 text-center">
            <p className="text-gray-500 mb-4">No orders found</p>
            {view === "buyer" && (
              <Button variant="outline">Browse Marketplace</Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order: any) => (
            <OrderCard
              key={order.id}
              orderId={order.id}
              status={order.status}
              totalCents={order.totalCents}
              itemCount={order.quantity}
              createdAt={order.createdAt}
              variant={view}
              onClick={
                onViewDetails ? () => onViewDetails(order.id) : undefined
              }
            />
          ))}
        </div>
      )}

      {/* Results Summary */}
      {filteredOrders && filteredOrders.length > 0 && (
        <div className="text-sm text-gray-600 text-center pt-4">
          Showing {filteredOrders.length} order
          {filteredOrders.length !== 1 ? "s" : ""}
          {(statusFilter !== "all" || fulfillmentFilter !== "all") &&
            " (filtered)"}
        </div>
      )}
    </div>
  );
}
