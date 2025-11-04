import React from "react";
import { Bell } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface NotificationBellProps {
  className?: string;
  onClick?: () => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  className,
  onClick,
}) => {
  const { data: unreadCountData } = trpc.notifications.getUnreadCount.useQuery();
  const unreadCount = typeof unreadCountData === 'number' ? unreadCountData : (unreadCountData?.unreadCount ?? 0);

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative inline-flex items-center justify-center p-2 text-forest-700 hover:text-forest-900 transition-colors",
        className
      )}
      aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ""}`}
    >
      <Bell className="w-6 h-6" />
      {unreadCount > 0 && (
        <Badge
          variant="destructive"
          className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </Badge>
      )}
    </button>
  );
};
