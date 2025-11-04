import React from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Trash2, CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface NotificationItemProps {
  notification: {
    id: number;
    title: string;
    message: string;
    type: string;
    read: boolean;
    actionUrl?: string | null;
    createdAt: Date;
  };
  onUpdated?: () => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onUpdated,
}) => {
  const markAsReadMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: onUpdated,
  });
  const deleteMutation = trpc.notifications.delete.useMutation({
    onSuccess: onUpdated,
  });

  const handleMarkAsRead = () => {
    if (!notification.read) {
      markAsReadMutation.mutate({ notificationId: notification.id });
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    deleteMutation.mutate({ notificationId: notification.id });
  };

  const timeAgo = (date: Date) => {
    const ms = Date.now() - new Date(date).getTime();
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "just now";
  };

  const content = (
    <div
      className={cn(
        "p-3 border-b last:border-b-0 flex gap-3 hover:bg-gray-50 transition-colors",
        !notification.read && "bg-blue-50"
      )}
      onClick={handleMarkAsRead}
    >
      <div className="flex-shrink-0 pt-1">
        {notification.read ? (
          <CheckCircle2 className="w-4 h-4 text-gray-400" />
        ) : (
          <Circle className="w-4 h-4 text-forest-600 fill-forest-600" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium", !notification.read && "text-forest-900")}>
          {notification.title}
        </p>
        <p className="text-xs text-gray-600 line-clamp-2">
          {notification.message}
        </p>
        <p className="text-xs text-gray-500 mt-1">{timeAgo(notification.createdAt)}</p>
      </div>
      <div className="flex gap-1 flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          className="p-1 h-auto"
        >
          <Trash2 className="w-3 h-3 text-red-600" />
        </Button>
      </div>
    </div>
  );

  if (notification.actionUrl) {
    return (
      <Link href={notification.actionUrl}>
        {content}
      </Link>
    );
  }

  return content;
};
