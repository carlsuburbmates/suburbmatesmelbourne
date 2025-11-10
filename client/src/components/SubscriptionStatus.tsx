import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, Calendar, CreditCard, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface BillingInfo {
  invoices: Array<{
    id: string;
    number: string | null;
    amount: number;
    currency: string;
    status: string | null;
    paidAt: Date | null;
    dueDate: Date | null;
    pdf: string | null;
  }>;
  upcomingInvoice: {
    amount: number;
    dueDate: Date | null;
  } | null;
}

interface SubscriptionStatusProps {
  tier: "none" | "basic" | "featured";
  subscriptionStatus: string;
  renewsAt?: Date;
  billingInfo?: BillingInfo;
  onManagePayment?: () => void;
  isLoading?: boolean;
}

/**
 * SubscriptionStatus Component
 * Displays subscription details and billing history
 * Shows invoices, upcoming payments, and renewal dates
 * Uses v5.2 design tokens
 */
export const SubscriptionStatus: React.FC<SubscriptionStatusProps> = ({
  tier,
  subscriptionStatus,
  renewsAt,
  billingInfo,
  onManagePayment,
  isLoading = false,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "featured_active":
      case "basic_active":
        return "bg-emerald-100 text-emerald-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-stone-100 text-stone-700";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "featured_active":
        return "Featured - Active";
      case "basic_active":
        return "Basic - Active";
      case "cancelled":
        return "Cancelled";
      default:
        return "Inactive";
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const daysUntilRenewal = renewsAt
    ? Math.ceil(
        (new Date(renewsAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      )
    : null;

  return (
    <div className="space-y-4">
      {/* Subscription Overview */}
      <Card className="border-2 border-stone-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-bold text-forest-900">
                Subscription Status
              </CardTitle>
              <CardDescription className="mt-1 text-sm text-stone-600">
                Current plan and renewal information
              </CardDescription>
            </div>
            <Badge className={cn("text-xs font-semibold", getStatusColor(subscriptionStatus))}>
              {getStatusLabel(subscriptionStatus)}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Renewal Info */}
          {renewsAt && (subscriptionStatus === "featured_active" || subscriptionStatus === "basic_active") && (
            <div className="flex items-start gap-3 rounded-lg bg-emerald-50 p-4 border border-emerald-200">
              <Calendar className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-emerald-900">Next Renewal</p>
                <p className="text-sm text-emerald-800 mt-1">
                  {new Date(renewsAt).toLocaleDateString("en-AU", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
                {daysUntilRenewal && (
                  <p className="text-xs text-emerald-700 mt-1">
                    {daysUntilRenewal > 0
                      ? `${daysUntilRenewal} days from now`
                      : "Renews today"}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Upcoming Invoice */}
          {billingInfo?.upcomingInvoice && (
            <div className="flex items-start gap-3 rounded-lg bg-amber-50 p-4 border border-amber-200">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-900">Upcoming Invoice</p>
                <p className="text-sm font-bold text-amber-800 mt-1">
                  {formatCurrency(billingInfo.upcomingInvoice.amount, "aud")}
                </p>
                {billingInfo.upcomingInvoice.dueDate && (
                  <p className="text-xs text-amber-700 mt-1">
                    Due on{" "}
                    {new Date(billingInfo.upcomingInvoice.dueDate).toLocaleDateString("en-AU", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Payment Method */}
          <div className="rounded-lg bg-stone-50 p-4 border border-stone-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-stone-600" />
                <div>
                  <p className="text-sm font-semibold text-stone-900">Payment Method</p>
                  <p className="text-xs text-stone-600 mt-0.5">Managed in Stripe Customer Portal</p>
                </div>
              </div>
              {onManagePayment && (
                <Button
                  onClick={onManagePayment}
                  disabled={isLoading}
                  variant="outline"
                  size="sm"
                  className="border-stone-300 text-forest-900 hover:bg-stone-100 text-xs"
                >
                  Manage
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Billing History */}
      {billingInfo?.invoices && billingInfo.invoices.length > 0 && (
        <Card className="border-2 border-stone-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-forest-900">
              Billing History
            </CardTitle>
            <CardDescription className="text-sm text-stone-600 mt-1">
              Recent invoices and payments
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-200">
                    <th className="text-left py-2 px-3 font-semibold text-stone-700">Date</th>
                    <th className="text-left py-2 px-3 font-semibold text-stone-700">Invoice</th>
                    <th className="text-left py-2 px-3 font-semibold text-stone-700">Amount</th>
                    <th className="text-left py-2 px-3 font-semibold text-stone-700">Status</th>
                    <th className="text-center py-2 px-3 font-semibold text-stone-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {billingInfo.invoices.map((invoice) => (
                    <tr
                      key={invoice.id}
                      className="border-b border-stone-100 hover:bg-stone-50 transition-colors"
                    >
                      <td className="py-3 px-3">
                        {invoice.paidAt
                          ? new Date(invoice.paidAt).toLocaleDateString("en-AU", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : invoice.dueDate
                            ? new Date(invoice.dueDate).toLocaleDateString("en-AU", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : "-"}
                      </td>
                      <td className="py-3 px-3 font-medium text-forest-900">
                        {invoice.number || invoice.id.slice(-8)}
                      </td>
                      <td className="py-3 px-3 font-semibold text-forest-900">
                        {formatCurrency(invoice.amount, invoice.currency)}
                      </td>
                      <td className="py-3 px-3">
                        <Badge
                          variant={invoice.status === "paid" ? "default" : "secondary"}
                          className={cn(
                            "text-xs font-medium",
                            invoice.status === "paid"
                              ? "bg-emerald-100 text-emerald-700"
                              : invoice.status === "open"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-stone-100 text-stone-700"
                          )}
                        >
                          {invoice.status === "paid" && (
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                          )}
                          {invoice.status
                            ? invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)
                            : "Unknown"}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {invoice.pdf && (
                          <a
                            href={invoice.pdf}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-emerald-600 hover:text-emerald-700 font-medium underline"
                          >
                            Download
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {(!billingInfo?.invoices || billingInfo.invoices.length === 0) &&
        (subscriptionStatus === "featured_active" || subscriptionStatus === "basic_active") && (
          <Card className="border-2 border-stone-200">
            <CardContent className="py-8">
              <div className="text-center">
                <p className="text-sm font-medium text-stone-600">
                  No billing history yet
                </p>
                <p className="text-xs text-stone-500 mt-1">
                  Your first invoice will appear after your first billing cycle
                </p>
              </div>
            </CardContent>
          </Card>
        )}
    </div>
  );
};

export default SubscriptionStatus;
