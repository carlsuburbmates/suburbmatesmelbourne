import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

const refundResponseSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  reason: z
    .string()
    .min(10, "Reason must be at least 10 characters")
    .max(500, "Reason must not exceed 500 characters"),
  notes: z.string().optional(),
});

type RefundResponseFormValues = z.infer<typeof refundResponseSchema>;

export interface RefundRequest {
  id: number;
  orderId: number;
  buyerId: number;
  amount: number;
  reason: string;
  status: "PENDING_VENDOR_RESPONSE" | "APPROVED" | "REJECTED" | "REFUNDED";
  requestedAt: string | Date;
  responseDeadline: string | Date;
  buyerNote?: string;
}

interface VendorRefundResponseFormProps {
  refund: RefundRequest;
  onSuccess: () => void;
  isLoading?: boolean;
}

export function VendorRefundResponseForm({
  refund,
  onSuccess,
  isLoading = false,
}: VendorRefundResponseFormProps) {
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<RefundResponseFormValues>({
    resolver: zodResolver(refundResponseSchema),
    defaultValues: {
      action: undefined,
      reason: "",
      notes: "",
    },
  });

  const onSubmit = async (values: RefundResponseFormValues) => {
    setSubmitting(true);
    try {
      // TODO: Call tRPC mutation once vendor router is created
      // await respondToRefundMutation.mutateAsync({
      //   refundId: refund.id,
      //   ...values,
      // })
      toast.success("Refund response submitted successfully");
      form.reset();
      onSuccess();
    } catch (error: any) {
      toast.error(error?.message || "Failed to submit refund response");
    } finally {
      setSubmitting(false);
    }
  };

  const daysRemaining = Math.ceil(
    (new Date(refund.responseDeadline).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24)
  );
  const isDeadlineApproaching = daysRemaining <= 3 && daysRemaining > 0;
  const isDeadlinePassed = daysRemaining <= 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            Refund Request #{refund.id}
          </CardTitle>
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
            Requires Response
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Refund Details */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded">
          <div>
            <p className="text-sm text-muted-foreground">Amount</p>
            <p className="text-2xl font-bold text-emerald-600">
              ${refund.amount.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Reason</p>
            <p className="font-semibold">{refund.reason}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Deadline</p>
            <p className={`font-semibold ${isDeadlinePassed ? "text-red-600" : isDeadlineApproaching ? "text-orange-600" : ""}`}>
              {daysRemaining > 0 ? `${daysRemaining} days left` : "OVERDUE"}
            </p>
          </div>
        </div>

        {/* Buyer's Message */}
        {refund.buyerNote && (
          <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
            <p className="text-sm text-blue-600 font-medium mb-2">
              Buyer's Message
            </p>
            <p className="text-sm text-blue-800">{refund.buyerNote}</p>
          </div>
        )}

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Action Selection */}
            <FormField
              control={form.control}
              name="action"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Response</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your response" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="APPROVE">
                        Approve Refund
                      </SelectItem>
                      <SelectItem value="REJECT">
                        Reject Refund
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose whether to approve or reject this refund request
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Reason */}
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Explain your decision in detail..."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {field.value.length}/500 characters
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Internal Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any internal notes for your records..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    These notes are only visible to you
                  </FormDescription>
                </FormItem>
              )}
            />

            {/* Submit */}
            <Button
              type="submit"
              disabled={submitting || isLoading}
              className="w-full"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Response"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
