import DashboardLayout from "@/components/DashboardLayout";
import { DisputeStatsCard, DisputeStats } from "@/components/admin/DisputeStatsCard";
import {
  DisputeDetailModal,
  Dispute,
} from "@/components/admin/DisputeDetailModal";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";

type DisputeRecord = {
  id: number;
  orderId: number;
  buyerId: number;
  vendorId: number;
  reason: string;
  description: string;
  status: "PENDING" | "RESOLVED" | "ESCALATED";
  evidenceUrl?: string;
  createdAt: Date | string;
  resolvedAt?: Date | string;
  resolution?: string;
};

export default function AdminDisputesPage() {
  const { user, loading } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState<DisputeRecord | null>(
    null
  );

  const [mockDisputes] = useState<DisputeRecord[]>([
    {
      id: 1,
      orderId: 101,
      buyerId: 201,
      vendorId: 301,
      reason: "Product not as described",
      description:
        "Received item that does not match the listing description. Color and size differ from what was advertised.",
      status: "PENDING",
      evidenceUrl: "https://example.com/evidence/photo.jpg",
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
    {
      id: 2,
      orderId: 102,
      buyerId: 202,
      vendorId: 302,
      reason: "Non-delivery",
      description: "Package was not delivered within the promised timeframe.",
      status: "RESOLVED",
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      resolution: "Full refund issued. Vendor to provide tracking update.",
    },
    {
      id: 3,
      orderId: 103,
      buyerId: 203,
      vendorId: 303,
      reason: "Quality issue",
      description:
        "Product arrived damaged. Multiple defects observed upon receipt.",
      status: "ESCALATED",
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      resolution:
        "Escalated to senior review team. Awaiting vendor response on replacement.",
    },
  ]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="container max-w-6xl mx-auto py-8 space-y-6">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-32" />
          <Skeleton className="h-96" />
        </div>
      </DashboardLayout>
    );
  }

  // Redirect if not admin
  if (user && user.role !== "admin") {
    return (
      <DashboardLayout>
        <div className="container max-w-4xl mx-auto py-8">
          <div className="flex gap-3 border-l-4 border-red-500 bg-red-50 p-4 rounded">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900">Access Denied</p>
              <p className="text-sm text-red-800">
                Only administrators can access this page.
              </p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const allDisputes = mockDisputes;
  const disputesLoading = false;

  // Calculate stats
  const stats: DisputeStats = {
    total: allDisputes.length,
    pending: allDisputes.filter((d: DisputeRecord) => d.status === "PENDING")
      .length,
    resolved: allDisputes.filter((d: DisputeRecord) => d.status === "RESOLVED")
      .length,
    escalated: allDisputes.filter((d: DisputeRecord) => d.status === "ESCALATED")
      .length,
  };

  // Filter disputes by status
  const filteredDisputes =
    selectedStatus === "all"
      ? allDisputes
      : allDisputes.filter(
          (d: DisputeRecord) => d.status.toLowerCase() === selectedStatus.toLowerCase()
        );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ESCALATED":
        return <Badge variant="destructive">Escalated</Badge>;
      case "RESOLVED":
        return <Badge variant="default" className="bg-green-600">Resolved</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const getReasonBadge = (reason: string) => {
    const colors: Record<string, string> = {
      "Product not as described": "bg-blue-100 text-blue-800",
      "Non-delivery": "bg-purple-100 text-purple-800",
      "Quality issue": "bg-amber-100 text-amber-800",
    };
    return (
      <Badge
        variant="outline"
        className={colors[reason] || "bg-gray-100 text-gray-800"}
      >
        {reason}
      </Badge>
    );
  };

  const handleDetailOpen = (dispute: DisputeRecord) => {
    setSelectedDispute(dispute);
    setIsDetailOpen(true);
  };

  const handleDetailClose = () => {
    setIsDetailOpen(false);
    setSelectedDispute(null);
  };

  const handleRefresh = () => {
    // Mock refresh - in real app this would refetch from tRPC
    window.location.reload();
  };

  return (
    <DashboardLayout>
      <div className="container max-w-6xl mx-auto py-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Disputes & Refunds</h1>
          <p className="text-muted-foreground">
            Manage and resolve customer disputes
          </p>
        </div>

        {/* Stats */}
        {!disputesLoading && allDisputes.length > 0 ? (
          <DisputeStatsCard stats={stats} />
        ) : (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">
                No disputes to display. Stats will appear here.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Filter */}
        <div className="flex gap-3">
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Disputes</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="escalated">Escalated</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => handleRefresh()}
            disabled={disputesLoading}
          >
            Refresh
          </Button>
        </div>

        {/* Disputes Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              Disputes ({filteredDisputes.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {disputesLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : filteredDisputes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No disputes found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Order</TableHead>
                      <TableHead>Buyer</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDisputes.map((dispute: DisputeRecord) => (
                      <TableRow key={dispute.id}>
                        <TableCell className="font-mono text-sm">
                          #{dispute.id}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          #{dispute.orderId}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          #{dispute.buyerId}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          #{dispute.vendorId}
                        </TableCell>
                        <TableCell>
                          {getReasonBadge(dispute.reason)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(dispute.status)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(dispute.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDetailOpen(dispute)}
                          >
                            Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detail Modal */}
        {selectedDispute && (
          <DisputeDetailModal
            isOpen={isDetailOpen}
            onClose={handleDetailClose}
            dispute={selectedDispute as any}
            onSuccess={() => handleRefresh()}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
