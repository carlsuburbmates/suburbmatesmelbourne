import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { OrderList } from "@/components/orders/OrderList";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

/**
 * Orders Page - Role-based order management
 * Buyers see their orders, vendors see orders for their products
 */
export default function Orders() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  // Fetch buyer orders
  const {
    data: buyerOrders = [],
    isLoading: buyerLoading,
    error: buyerError,
    refetch: refetchBuyerOrders,
    isFetching: buyerFetching,
  } = trpc.order.getMine.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "buyer",
  });

  // Fetch vendor ID (needed for vendor orders)
  // For now, we'll use a simple approach: vendor orders are fetched using vendorId from user
  // TODO: Get vendorId from business.vendorMeta relationship when available
  const [vendorId, setVendorId] = useState<number | null>(null);

  // Determine which role and orders to display
  const isBuyer = user?.role === "buyer";
  const isVendor = user?.role === "vendor";

  useEffect(() => {
    // Vendor IDs can be derived from user context or business metadata
    // For MVP, we assume vendor is set up correctly in system
    if (isVendor && user?.id) {
      // Set a placeholder vendorId - this should come from business setup
      setVendorId(user.id); // Temporary - will be properly mapped
    }
  }, [isVendor, user?.id]);
  const {
    data: vendorOrders = [],
    isLoading: vendorLoading,
    error: vendorError,
    refetch: refetchVendorOrders,
    isFetching: vendorFetching,
  } = trpc.order.getByVendor.useQuery(
    { vendorId: vendorId! },
    {
      enabled: !!vendorId && user?.role === "vendor",
    }
  );

  const orders = isBuyer ? buyerOrders : vendorOrders;
  const isLoading = isBuyer ? buyerLoading : vendorLoading;
  const error = isBuyer ? buyerError : vendorError;
  const isFetching = isBuyer ? buyerFetching : vendorFetching;
  const refetch = isBuyer ? refetchBuyerOrders : refetchVendorOrders;

  // Filter orders by status if selected
  const filteredOrders = selectedStatus
    ? orders.filter((order: any) => order.status === selectedStatus)
    : orders;

  // Auto-refetch on focus
  useEffect(() => {
    const handleFocus = () => {
      if (isBuyer) {
        refetchBuyerOrders();
      } else if (isVendor) {
        refetchVendorOrders();
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [isBuyer, isVendor]);

  // Authentication check
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 mb-4">
              Please log in to view your orders.
            </p>
            <Button onClick={() => navigate("/auth")} className="w-full">
              Log In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isBuyer && !isVendor) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600">
              Your role does not have access to orders.
            </p>
            <Button onClick={() => navigate("/")} className="w-full mt-4">
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            {isBuyer ? "My Orders" : "Vendor Orders"}
          </h1>
          <p className="text-slate-600 mt-2">
            {isBuyer
              ? "Track and manage your purchases"
              : "Manage orders for your products"}
          </p>
        </div>

        {/* Status Filter Tabs */}
        {orders.length > 0 && (
          <Tabs
            value={selectedStatus || "all"}
            onValueChange={value =>
              setSelectedStatus(value === "all" ? null : value)
            }
            className="mb-6"
          >
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="failed">Failed</TabsTrigger>
              <TabsTrigger value="refunded">Refunded</TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        {/* Info Alert */}
        <Alert className="mb-6 bg-blue-50 border-blue-200 text-blue-900">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Refreshes automatically when you return to this page. Manual refresh
            available via button.
          </AlertDescription>
        </Alert>

        {/* Orders List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Orders ({filteredOrders.length})</span>
              {filteredOrders.length > 0 && (
                <Button
                  onClick={() => refetch()}
                  disabled={isFetching}
                  variant="outline"
                  size="sm"
                >
                  Refresh
                </Button>
              )}
            </CardTitle>
          </CardHeader>

          <CardContent>
            <OrderList
              orders={filteredOrders}
              isLoading={isLoading}
              error={error}
              onRefresh={() => refetch()}
              onOrderClick={orderId => navigate(`/orders/${orderId}`)}
              variant={isBuyer ? "buyer" : "vendor"}
              isRefetching={isFetching}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
