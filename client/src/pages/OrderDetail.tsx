import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  OrderTimeline,
  type TimelineEvent,
} from "@/components/orders/OrderTimeline";
import { RefundRequestForm } from "@/components/orders/RefundRequestForm";
import { StatusBadge } from "@/components/StatusBadge";

export default function OrderDetail() {
  const [match, params] = useRoute("/orders/:orderId");
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const orderId = params?.orderId ? parseInt(params.orderId) : null;

  const {
    data: order,
    isLoading,
    error,
  } = trpc.order.getById.useQuery(
    { orderId: orderId! },
    { enabled: !!orderId }
  );

  const { data: refunds = [] } = trpc.refund.getByOrder.useQuery(
    { orderId: orderId! },
    { enabled: !!orderId }
  );

  if (!orderId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Invalid Order ID</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={() => navigate("/orders")}
              className="w-full"
            >
              Back to Orders
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Order Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              {error
                ? error.message
                : "The order you're looking for doesn't exist."}
            </p>
            <Button
              variant="outline"
              onClick={() => navigate("/orders")}
              className="w-full"
            >
              Back to Orders
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check authorization
  const isBuyer = user?.id === order.buyerId;
  const isVendor = user?.id === order.vendorId;
  const isAuthorized = isBuyer || isVendor;

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              You don't have permission to view this order.
            </p>
            <Button
              variant="outline"
              onClick={() => navigate("/orders")}
              className="w-full"
            >
              Back to Orders
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Build timeline
  const timelineEvents: TimelineEvent[] = [
    {
      timestamp: new Date(order.createdAt),
      title: "Order Created",
      icon: "clock",
    },
  ];

  // Add payment event
  if (order.status !== "pending") {
    timelineEvents.push({
      timestamp: new Date(order.updatedAt),
      title: `Payment ${order.status === "failed" ? "Failed" : "Succeeded"}`,
      icon: order.status === "failed" ? "alert" : "check",
    });
  }

  // Add fulfillment events
  if (order.fulfillmentStatus) {
    timelineEvents.push({
      timestamp: new Date(order.updatedAt),
      title: `Fulfillment: ${order.fulfillmentStatus}`,
      icon: order.fulfillmentStatus === "completed" ? "check" : "truck",
    });
  }

  // Add refund events
  if (refunds.length > 0) {
    refunds.forEach((refund: any) => {
      timelineEvents.push({
        timestamp: new Date(refund.createdAt),
        title: `Refund Request: ${refund.status}`,
        icon: refund.status === "approved" ? "check" : "alert",
        description: `Reason: ${refund.reason}`,
      });
    });
  }

  const hasExistingRefund = refunds.length > 0;

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container max-w-4xl">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/orders")}
          className="mb-6 pl-0"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Orders
        </Button>

        <div className="grid gap-6">
          {/* Order Header */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">Order #{order.id}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Placed on{" "}
                    {new Date(order.createdAt).toLocaleDateString("en-AU", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">
                    ${(order.totalCents / 100).toFixed(2)}
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Items */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-semibold mb-3">Items</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Product Subtotal</span>
                        <span>${(order.subtotalCents / 100).toFixed(2)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-sm">
                        <span>Platform Fee (8%)</span>
                        <span>
                          ${(order.platformFeeCents / 100).toFixed(2)}
                        </span>
                      </div>
                      {order.stripeFeesCents && order.stripeFeesCents > 0 && (
                        <>
                          <Separator />
                          <div className="flex justify-between text-sm">
                            <span>Payment Processing Fee</span>
                            <span>
                              ${(order.stripeFeesCents / 100).toFixed(2)}
                            </span>
                          </div>
                        </>
                      )}
                      <Separator className="my-2" />
                      <div className="flex justify-between font-semibold">
                        <span>Total</span>
                        <span>${(order.totalCents / 100).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badges */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">
                        Payment Status
                      </p>
                      <StatusBadge
                        status={order.status as any}
                        variant="compact"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">
                        Fulfillment Status
                      </p>
                      <StatusBadge
                        status={order.fulfillmentStatus as any}
                        variant="compact"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Order Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <OrderTimeline events={timelineEvents} />
                </CardContent>
              </Card>

              {/* Refund Request (Buyer Only) */}
              {isBuyer && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Request a Refund</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RefundRequestForm
                      orderId={order.id}
                      hasExistingRefund={hasExistingRefund}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Disclaimer */}
              <Alert className="border-amber-200 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-900">
                  <p className="font-semibold">Important</p>
                  <p className="text-sm mt-1">
                    Orders are fulfilled directly by the vendor. Suburbmates
                    does not deliver items or issue refunds. The vendor is
                    responsible for fulfilling your order and handling any
                    refund requests.
                  </p>
                </AlertDescription>
              </Alert>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Vendor Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Vendor Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Vendor ID
                    </p>
                    <p className="font-semibold">#{order.vendorId}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Contact the vendor directly regarding this order.
                  </p>
                </CardContent>
              </Card>

              {/* Order Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Order Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Quantity
                    </p>
                    <p className="font-semibold">{order.quantity}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Unit Price
                    </p>
                    <p className="font-semibold">${order.unitPrice}</p>
                  </div>
                  {order.shippingAddress && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Delivery Address
                      </p>
                      <p className="text-sm">{order.shippingAddress}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
