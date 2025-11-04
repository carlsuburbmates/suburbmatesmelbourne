import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type OrderStatus = "pending" | "completed" | "failed" | "refunded" | "disputed";
type ClaimStatus = "pending" | "approved" | "rejected" | "claimed";
type FulfillmentStatus = "pending" | "ready" | "completed" | "cancelled";
type RefundStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "processing"
  | "completed";

type StatusType = OrderStatus | ClaimStatus | FulfillmentStatus | RefundStatus;

interface StatusBadgeProps {
  status: StatusType;
  variant?: "default" | "order" | "claim" | "fulfillment" | "refund";
}

const statusColorMap: Record<StatusType, string> = {
  // Order statuses
  pending: "bg-amber-100 text-amber-800",
  completed: "bg-emerald-100 text-emerald-800",
  failed: "bg-red-100 text-red-800",
  refunded: "bg-blue-100 text-blue-800",
  disputed: "bg-red-100 text-red-800",

  // Claim statuses
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
  claimed: "bg-emerald-100 text-emerald-800",

  // Fulfillment statuses
  ready: "bg-blue-100 text-blue-800",
  cancelled: "bg-gray-100 text-gray-800",

  // Refund statuses
  processing: "bg-blue-100 text-blue-800",
};

const statusLabelMap: Record<StatusType, string> = {
  pending: "Pending",
  completed: "Completed",
  failed: "Failed",
  refunded: "Refunded",
  disputed: "Disputed",
  approved: "Approved",
  rejected: "Rejected",
  claimed: "Claimed",
  ready: "Ready for Pickup",
  cancelled: "Cancelled",
  processing: "Processing",
};

export function StatusBadge({ status, variant = "default" }: StatusBadgeProps) {
  const colorClass = statusColorMap[status];
  const label = statusLabelMap[status];

  return (
    <Badge className={cn("font-medium", colorClass)} variant="outline">
      {label}
    </Badge>
  );
}
