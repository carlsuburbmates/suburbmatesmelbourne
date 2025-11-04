import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import { NotificationItem } from "@/components/NotificationItem";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Bell } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const NotificationCenter: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const notificationsQuery = trpc.notifications.getMine.useQuery({
    limit: 50,
    offset: 0,
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Sign in to view notifications</h1>
          <p className="text-gray-600 mb-6">
            Please sign in to see your notifications
          </p>
          <Link href="/">
            <Button className="bg-forest-600 hover:bg-forest-700">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const notifications = notificationsQuery.data?.notifications || [];

  const filtered = notifications.filter((n) => {
    if (typeFilter !== "all" && n.type !== typeFilter) return false;
    if (statusFilter === "unread" && n.read) return false;
    if (statusFilter === "read" && !n.read) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Notifications</h1>
          <p className="text-gray-600">
            {notifications.length} total notifications
          </p>
        </div>

        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 block mb-2">
                Filter by Type
              </label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="order_created">Order Created</SelectItem>
                  <SelectItem value="order_confirmed">Order Confirmed</SelectItem>
                  <SelectItem value="order_completed">Order Completed</SelectItem>
                  <SelectItem value="refund_requested">Refund Requested</SelectItem>
                  <SelectItem value="refund_processed">Refund Processed</SelectItem>
                  <SelectItem value="claim_submitted">Claim Submitted</SelectItem>
                  <SelectItem value="claim_approved">Claim Approved</SelectItem>
                  <SelectItem value="dispute_opened">Dispute Opened</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 block mb-2">
                Filter by Status
              </label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {notifications.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No notifications yet</h2>
            <p className="text-gray-600">
              We'll notify you when something important happens
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-600">No notifications match your filters</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {filtered.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onUpdated={() => notificationsQuery.refetch()}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
