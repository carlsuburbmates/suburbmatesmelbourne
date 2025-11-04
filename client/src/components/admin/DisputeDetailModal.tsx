import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export interface Dispute {
  id: number;
  orderId: number;
  buyerId: number;
  vendorId: number;
  reason: string;
  description: string;
  status: "PENDING" | "RESOLVED" | "ESCALATED";
  evidenceUrl?: string;
  createdAt: string | Date;
  resolvedAt?: string | Date;
  resolution?: string;
}

interface DisputeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  dispute: Dispute;
  onSuccess: () => void;
}

export function DisputeDetailModal({
  isOpen,
  onClose,
  dispute,
  onSuccess,
}: DisputeDetailModalProps) {
  const { user } = useAuth();
  const [deciding, setDeciding] = useState<null | "resolve" | "escalate">(null);
  const [resolution, setResolution] = useState("");

  const getStatusBadge = () => {
    switch (dispute.status) {
      case "ESCALATED":
        return <Badge variant="destructive">Escalated</Badge>;
      case "RESOLVED":
        return <Badge variant="default" className="bg-green-600">Resolved</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const handleResolve = async () => {
    if (!resolution.trim()) {
      toast.error("Please provide a resolution");
      return;
    }

    setDeciding("resolve");
    try {
      // TODO: Call tRPC mutation once admin router is created
      // await resolveMutation.mutateAsync({ disputeId: dispute.id, resolution })
      toast.success("Dispute resolved successfully");
      setResolution("");
      setDeciding(null);
      onSuccess();
    } catch (error: any) {
      toast.error(error?.message || "Failed to resolve dispute");
      setDeciding(null);
    }
  };

  const handleEscalate = async () => {
    setDeciding("escalate");
    try {
      // TODO: Call tRPC mutation once admin router is created
      // await escalateMutation.mutateAsync({ disputeId: dispute.id })
      toast.success("Dispute escalated successfully");
      setDeciding(null);
      onSuccess();
    } catch (error: any) {
      toast.error(error?.message || "Failed to escalate dispute");
      setDeciding(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Dispute Details</DialogTitle>
          <DialogDescription>
            Review and manage this dispute case
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Dispute Info Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Case #{dispute.id}</CardTitle>
                {getStatusBadge()}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Order ID</p>
                  <p className="font-mono font-semibold">#{dispute.orderId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Reason</p>
                  <p className="font-semibold">{dispute.reason}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Buyer ID</p>
                  <p className="font-mono font-semibold">#{dispute.buyerId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Vendor ID</p>
                  <p className="font-mono font-semibold">#{dispute.vendorId}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Description
                </p>
                <p className="text-sm bg-muted p-3 rounded">
                  {dispute.description}
                </p>
              </div>

              {dispute.evidenceUrl && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Evidence
                  </p>
                  <a
                    href={dispute.evidenceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    View evidence →
                  </a>
                </div>
              )}

              <div className="text-xs text-muted-foreground pt-2 border-t">
                Created{" "}
                {new Date(dispute.createdAt).toLocaleDateString()} at{" "}
                {new Date(dispute.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </CardContent>
          </Card>

          {/* Previous Resolution */}
          {dispute.resolution && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-base text-green-900">
                  Resolution
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-green-800">
                {dispute.resolution}
              </CardContent>
            </Card>
          )}

          {/* Decision Form (only show if pending) */}
          {dispute.status === "PENDING" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Take Action</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">
                    Resolution Notes
                  </label>
                  <Textarea
                    placeholder="Explain the resolution or reason for escalation..."
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    className="mt-2"
                    rows={4}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleResolve}
                    disabled={deciding !== null}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {deciding === "resolve" ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Resolving...
                      </>
                    ) : (
                      "Resolve Dispute"
                    )}
                  </Button>
                  <Button
                    onClick={handleEscalate}
                    disabled={deciding !== null}
                    variant="outline"
                    className="flex-1 border-orange-200 text-orange-700 hover:bg-orange-50"
                  >
                    {deciding === "escalate" ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Escalating...
                      </>
                    ) : (
                      <>
                        <AlertCircle className="mr-2 h-4 w-4" />
                        Escalate
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
