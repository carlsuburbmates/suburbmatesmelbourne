import React from "react";
import { trpc } from "@/lib/trpc";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { NotificationBell } from "./NotificationBell";
import { NotificationItem } from "./NotificationItem";
import { Trash2 } from "lucide-react";

export const NotificationDropdown: React.FC = () => {
  const notificationsQuery = trpc.notifications.getMine.useQuery({
    limit: 5,
    offset: 0,
  });
  const markAllAsReadMutation = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => notificationsQuery.refetch(),
  });
  const deleteAllMutation = trpc.notifications.deleteAll.useMutation({
    onSuccess: () => notificationsQuery.refetch(),
  });

  const notifications = notificationsQuery.data?.notifications || [];
  const total = notificationsQuery.data?.total || 0;
  const hasMore = total > 5;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <NotificationBell />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-96" align="end">
        <div className="p-3 flex justify-between items-center border-b">
          <h3 className="font-semibold">Notifications</h3>
          {notifications.length > 0 && (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllAsReadMutation.mutate()}
                className="text-xs"
              >
                Mark all read
              </Button>
            </div>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No notifications yet
          </div>
        ) : (
          <>
            <div className="max-h-96 overflow-y-auto">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onUpdated={() => notificationsQuery.refetch()}
                />
              ))}
            </div>
            {hasMore && (
              <>
                <DropdownMenuSeparator />
                <div className="p-2">
                  <Link href="/notifications">
                    <Button variant="outline" className="w-full text-xs">
                      View All
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </>
        )}

        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteAllMutation.mutate()}
                className="w-full text-red-600 hover:text-red-700 text-xs"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Clear all
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
