import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ClaimStatsCard,
  type ClaimStats,
} from "@/components/admin/ClaimStatsCard";
import { ClaimDetailModal } from "@/components/admin/ClaimDetailModal";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { AlertCircle } from "lucide-react";

type ClaimRecord = {
  id: number;
  businessId: number;
  userId: number;
  status: string;
  createdAt: Date | string;
  note?: string;
};

export default function AdminClaimsPage() {
  const { user } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedClaim, setSelectedClaim] = useState<ClaimRecord | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [mockClaims] = useState<ClaimRecord[]>([
    {
      id: 1,
      businessId: 1,
      userId: 2,
      status: "PENDING",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      id: 2,
      businessId: 2,
      userId: 3,
      status: "APPROVED",
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      note: "Verified ABN and business documents",
    },
    {
      id: 3,
      businessId: 3,
      userId: 4,
      status: "REJECTED",
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      note: "ABN verification failed",
    },
  ]);

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

  const allClaims = mockClaims;
  const claimsLoading = false;

  // Calculate stats
  const stats: ClaimStats = {
    total: allClaims.length,
    pending: allClaims.filter((c: ClaimRecord) => c.status === "PENDING")
      .length,
    approved: allClaims.filter((c: ClaimRecord) => c.status === "APPROVED")
      .length,
    rejected: allClaims.filter((c: ClaimRecord) => c.status === "REJECTED")
      .length,
  };

  // Filter claims by status
  const filteredClaims =
    selectedStatus === "all"
      ? allClaims
      : allClaims.filter(
          (c: ClaimRecord) =>
            c.status.toLowerCase() === selectedStatus.toLowerCase()
        );

  const getStatusBadge = (status: string) => {
    if (status.toLowerCase() === "approved")
      return <Badge className="bg-green-600">Approved</Badge>;
    if (status.toLowerCase() === "rejected")
      return <Badge variant="destructive">Rejected</Badge>;
    return <Badge variant="secondary">Pending</Badge>;
  };

  const handleDetailOpen = (claim: ClaimRecord) => {
    setSelectedClaim(claim);
    setIsDetailOpen(true);
  };

  const handleDetailClose = () => {
    setIsDetailOpen(false);
    setSelectedClaim(null);
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
          <h1 className="text-3xl font-bold">Business Claims</h1>
          <p className="text-muted-foreground">
            Manage and verify business ownership claims
          </p>
        </div>

        {/* Stats */}
        {claimsLoading ? (
          <Card>
            <CardHeader>
              <CardTitle>Claims Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <Skeleton key={i} className="h-20" />
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <ClaimStatsCard stats={stats} />
        )}

        {/* Filter */}
        <div className="flex gap-3">
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Claims</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => handleRefresh()}
            disabled={claimsLoading}
          >
            Refresh
          </Button>
        </div>

        {/* Claims Table */}
        <Card>
          <CardHeader>
            <CardTitle>Claims ({filteredClaims.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {claimsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : filteredClaims.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No claims found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Claim ID</TableHead>
                      <TableHead>Business ID</TableHead>
                      <TableHead>User ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClaims.map(claim => (
                      <TableRow key={claim.id}>
                        <TableCell className="font-mono text-sm">
                          #{claim.id}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {claim.businessId}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {claim.userId}
                        </TableCell>
                        <TableCell>{getStatusBadge(claim.status)}</TableCell>
                        <TableCell className="text-sm">
                          {new Date(claim.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDetailOpen(claim)}
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
      </div>

      {/* Detail Modal */}
      {selectedClaim && (
        <ClaimDetailModal
          isOpen={isDetailOpen}
          onClose={handleDetailClose}
          claim={selectedClaim as any}
          onSuccess={() => handleRefresh()}
        />
      )}
    </DashboardLayout>
  );
}
