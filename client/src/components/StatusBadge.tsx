import { Badge } from "@/components/ui/badge";

type StatusType =
  | "pending"
  | "completed"
  | "failed"
  | "refunded"
  | "disputed"
  | "ready"
  | "cancelled"
  | "approved"
  | "rejected";

interface StatusBadgeProps {
  status: StatusType;
  variant?: "default" | "compact";
}

export function StatusBadge({ status, variant = "default" }: StatusBadgeProps) {
  const getStatusColor = (
    status: StatusType
  ): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "completed":
      case "approved":
        return "default"; // green
      case "pending":
      case "ready":
        return "secondary"; // blue
      case "failed":
      case "cancelled":
      case "rejected":
        return "destructive"; // red
      case "refunded":
      case "disputed":
        return "outline"; // gray
      default:
        return "default";
    }
  };

  const getStatusLabel = (status: StatusType): string => {
    switch (status) {
      case "pending":
        return "Pending";
      case "completed":
        return "Completed";
      case "failed":
        return "Failed";
      case "refunded":
        return "Refunded";
      case "disputed":
        return "Disputed";
      case "ready":
        return "Ready";
      case "cancelled":
        return "Cancelled";
      case "approved":
        return "Approved";
      case "rejected":
        return "Rejected";
      default:
        return status;
    }
  };

  const label = getStatusLabel(status);
  const color = getStatusColor(status);

  if (variant === "compact") {
    return (
      <Badge variant={color} className="capitalize">
        {label}
      </Badge>
    );
  }

  return (
    <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold">
      <Badge variant={color}>{label}</Badge>
    </div>
  );
}
