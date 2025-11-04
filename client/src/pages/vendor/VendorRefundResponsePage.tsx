import DashboardLayout from "@/components/DashboardLayout";
import {
  VendorRefundResponseForm,
  RefundRequest,
} from "@/components/vendor/VendorRefundResponseForm";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";

export default function VendorRefundResponsePage() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState("pending");

  const [mockRefunds] = useState<RefundRequest[]>([
    {
      id: 1,
      orderId: 501,
      buyerId: 201,
      amount: 45.99,
      reason: "Product damaged in shipping",
      status: "PENDING_VENDOR_RESPONSE",
      requestedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      responseDeadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      buyerNote:
        "The item arrived broken. I have photographic evidence. Please process refund.",
    },
    {
      id: 2,
      orderId: 502,
      buyerId: 202,
      amount: 120.0,
      reason: "Wrong item shipped",
      status: "PENDING_VENDOR_RESPONSE",
      requestedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      responseDeadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      buyerNote: "I ordered size M but received size L instead.",
    },
    {
      id: 3,
      orderId: 503,
      buyerId: 203,
      amount: 35.5,
      reason: "Item not as described",
      status: "APPROVED",
      requestedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      responseDeadline: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    },
    {
      id: 4,
      orderId: 504,
      buyerId: 204,
      amount: 89.99,
      reason: "Quality issue",
      status: "REJECTED",
      requestedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      responseDeadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      id: 5,
      orderId: 505,
      buyerId: 205,
      amount: 67.0,
      reason: "Product damaged in shipping",
      status: "REFUNDED",
      requestedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      responseDeadline: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
  ]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="container max-w-4xl mx-auto py-8 space-y-6">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-96" />
        </div>
      </DashboardLayout>
    );
  }

  // Redirect if not vendor
  if (user && user.role !== "vendor" && user.role !== "business_owner") {
    return (
      <DashboardLayout>
        <div className="container max-w-4xl mx-auto py-8">
          <div className="flex gap-3 border-l-4 border-red-500 bg-red-50 p-4 rounded">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900">Access Denied</p>
              <p className="text-sm text-red-800">
                Only vendors can access this page.
              </p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const allRefunds = mockRefunds;
  const pendingRefunds = allRefunds.filter(
    (r) => r.status === "PENDING_VENDOR_RESPONSE"
  );
  const approvedRefunds = allRefunds.filter((r) => r.status === "APPROVED");
  const rejectedRefunds = allRefunds.filter((r) => r.status === "REJECTED");
  const refundedRefunds = allRefunds.filter((r) => r.status === "REFUNDED");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING_VENDOR_RESPONSE":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
            <AlertCircle className="mr-1 h-3 w-3" />
            Awaiting Response
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Approved
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700">
            <XCircle className="mr-1 h-3 w-3" />
            Rejected
          </Badge>
        );
      case "REFUNDED":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Refunded
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <DashboardLayout>
      <div className="container max-w-4xl mx-auto py-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Refund Requests</h1>
          <p className="text-muted-foreground">
            Respond to customer refund requests
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-yellow-600">
                  {pendingRefunds.length}
                </p>
                <p className="text-sm text-muted-foreground">Awaiting Response</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">
                  {approvedRefunds.length}
                </p>
                <p className="text-sm text-muted-foreground">Approved</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-red-600">
                  {rejectedRefunds.length}
                </p>
                <p className="text-sm text-muted-foreground">Rejected</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">
                  {refundedRefunds.length}
                </p>
                <p className="text-sm text-muted-foreground">Refunded</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pending">
              Pending ({pendingRefunds.length})
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved ({approvedRefunds.length})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejected ({rejectedRefunds.length})
            </TabsTrigger>
            <TabsTrigger value="refunded">
              Refunded ({refundedRefunds.length})
            </TabsTrigger>
          </TabsList>

          {/* Pending Tab */}
          <TabsContent value="pending" className="space-y-6">
            {pendingRefunds.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No pending refund requests at this time
                </CardContent>
              </Card>
            ) : (
              pendingRefunds.map((refund) => (
                <VendorRefundResponseForm
                  key={refund.id}
                  refund={refund}
                  onSuccess={handleRefresh}
                />
              ))
            )}
          </TabsContent>

          {/* Approved Tab */}
          <TabsContent value="approved" className="space-y-4">
            {approvedRefunds.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No approved refunds yet
                </CardContent>
              </Card>
            ) : (
              approvedRefunds.map((refund) => (
                <Card key={refund.id} className="border-green-200 bg-green-50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        Order #{refund.orderId} - Refund Approved
                      </CardTitle>
                      {getStatusBadge(refund.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-green-800">
                      You approved a ${refund.amount.toFixed(2)} refund for:{" "}
                      <strong>{refund.reason}</strong>
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Rejected Tab */}
          <TabsContent value="rejected" className="space-y-4">
            {rejectedRefunds.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No rejected refunds yet
                </CardContent>
              </Card>
            ) : (
              rejectedRefunds.map((refund) => (
                <Card key={refund.id} className="border-red-200 bg-red-50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        Order #{refund.orderId} - Refund Rejected
                      </CardTitle>
                      {getStatusBadge(refund.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-red-800">
                      You rejected a ${refund.amount.toFixed(2)} refund request
                      for: <strong>{refund.reason}</strong>
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Refunded Tab */}
          <TabsContent value="refunded" className="space-y-4">
            {refundedRefunds.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No refunded orders yet
                </CardContent>
              </Card>
            ) : (
              refundedRefunds.map((refund) => (
                <Card key={refund.id} className="border-blue-200 bg-blue-50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        Order #{refund.orderId} - Refunded
                      </CardTitle>
                      {getStatusBadge(refund.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-blue-800">
                      ${refund.amount.toFixed(2)} refund processed for:{" "}
                      <strong>{refund.reason}</strong>
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
