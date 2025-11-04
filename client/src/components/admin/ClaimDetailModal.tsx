import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface ClaimDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  claim: {
    id: number;
    businessId: number;
    userId: number;
    status: "PENDING" | "APPROVED" | "REJECTED";
    createdAt: Date;
    decidedAt?: Date;
    note?: string;
    businessName?: string;
  };
  onSuccess?: () => void;
}

export function ClaimDetailModal({
  isOpen,
  onClose,
  claim,
  onSuccess,
}: ClaimDetailModalProps) {
  const [decisionNote, setDecisionNote] = useState("");
  const [deciding, setDeciding] = useState<"approve" | "reject" | null>(null);

  const approveMutation = trpc.claim.approve.useMutation({
    onSuccess: () => {
      toast.success("Claim approved!");
      setDecisionNote("");
      setDeciding(null);
      onSuccess?.();
      onClose();
    },
    onError: (error: any) => {
      toast.error(`Error: ${error?.message || "Unknown error"}`);
      setDeciding(null);
    },
  });

  const rejectMutation = trpc.claim.reject.useMutation({
    onSuccess: () => {
      toast.success("Claim rejected!");
      setDecisionNote("");
      setDeciding(null);
      onSuccess?.();
      onClose();
    },
    onError: (error: any) => {
      toast.error(`Error: ${error?.message || "Unknown error"}`);
      setDeciding(null);
    },
  });

  const handleDecision = async (decision: "approve" | "reject") => {
    if (!decisionNote.trim()) {
      toast.error("Please provide a decision note");
      return;
    }

    setDeciding(decision);
    try {
      if (decision === "approve") {
        await approveMutation.mutateAsync({ claimId: claim.id });
      } else {
        await rejectMutation.mutateAsync({ claimId: claim.id });
      }
    } catch (err) {
      // Error already handled by mutation callbacks
    }
  };

  const getStatusIcon = (status: string) => {
    if (status === "APPROVED")
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (status === "REJECTED")
      return <XCircle className="h-5 w-5 text-red-600" />;
    return <AlertCircle className="h-5 w-5 text-yellow-600" />;
  };

  const getStatusBadge = (status: string) => {
    if (status === "APPROVED")
      return <Badge className="bg-green-600">Approved</Badge>;
    if (status === "REJECTED")
      return <Badge variant="destructive">Rejected</Badge>;
    return <Badge variant="secondary">Pending</Badge>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Claim Details</DialogTitle>
            {getStatusIcon(claim.status)}
          </div>
          <DialogDescription>
            Business: {claim.businessName || `ID ${claim.businessId}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Claim Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Claim Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Claim ID</p>
                  <p className="font-mono">{claim.id}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">User ID</p>
                  <p className="font-mono">{claim.userId}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  {getStatusBadge(claim.status)}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Created</p>
                  <p className="text-sm">
                    {new Date(claim.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              {claim.note && (
                <div>
                  <p className="text-xs text-muted-foreground">Admin Note</p>
                  <p className="text-sm border-l-2 border-muted pl-2 py-1">
                    {claim.note}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Decision Form (only if pending) */}
          {claim.status === "PENDING" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Make a Decision</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Decision Note</label>
                  <Textarea
                    placeholder="Provide your decision note (verification details, findings, etc.)"
                    value={decisionNote}
                    onChange={e => setDecisionNote(e.target.value)}
                    className="mt-2"
                    rows={4}
                  />
                </div>

                <DialogFooter className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={onClose}
                    disabled={deciding !== null}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleDecision("reject")}
                    disabled={deciding !== null}
                  >
                    {deciding === "reject" ? "Rejecting..." : "Reject Claim"}
                  </Button>
                  <Button
                    onClick={() => handleDecision("approve")}
                    disabled={deciding !== null}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {deciding === "approve" ? "Approving..." : "Approve Claim"}
                  </Button>
                </DialogFooter>
              </CardContent>
            </Card>
          )}

          {claim.status !== "PENDING" && (
            <div className="text-center text-sm text-muted-foreground border rounded-lg p-4">
              This claim has already been decided.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
