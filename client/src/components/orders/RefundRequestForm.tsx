import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { AlertCircle, CheckCircle } from "lucide-react";

const refundFormSchema = z.object({
  reason: z.string().min(1, "Please select a reason"),
  description: z.string().min(10, "Please provide at least 10 characters"),
});

type RefundFormValues = z.infer<typeof refundFormSchema>;

interface RefundRequestFormProps {
  orderId: number;
  hasExistingRefund?: boolean;
  onSuccess?: () => void;
}

export function RefundRequestForm({
  orderId,
  hasExistingRefund = false,
  onSuccess,
}: RefundRequestFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const requestMutation = trpc.refund.request.useMutation({
    onSuccess: () => {
      toast.success("Refund request submitted successfully!");
      form.reset();
      onSuccess?.();
    },
    onError: error => {
      toast.error(error.message || "Failed to submit refund request");
    },
  });

  const form = useForm<RefundFormValues>({
    resolver: zodResolver(refundFormSchema),
    defaultValues: {
      reason: "",
      description: "",
    },
  });

  const handleSubmit = async (values: RefundFormValues) => {
    setIsSubmitting(true);
    try {
      await requestMutation.mutateAsync({
        orderId,
        reason: values.reason,
        description: values.description,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (hasExistingRefund) {
    return (
      <Alert className="border-blue-200 bg-blue-50">
        <CheckCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <p className="font-semibold">Refund Request Already Submitted</p>
          <p className="text-sm mt-1">
            The vendor will review your refund request and contact you with a
            decision.
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <Alert className="border-amber-200 bg-amber-50">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          <p className="font-semibold">Vendor Makes the Final Decision</p>
          <p className="text-sm mt-1">
            Suburbmates doesn't issue refunds. The vendor you purchased from
            will review your request and decide whether to approve or deny it.
          </p>
        </AlertDescription>
      </Alert>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="reason"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reason for Refund</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isSubmitting}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a reason..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="damaged">Item Damaged</SelectItem>
                    <SelectItem value="not_received">Not Received</SelectItem>
                    <SelectItem value="not_as_described">
                      Not as Described
                    </SelectItem>
                    <SelectItem value="wrong_item">
                      Wrong Item Received
                    </SelectItem>
                    <SelectItem value="quality_issues">
                      Quality Issues
                    </SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Explain Your Request</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Tell the vendor why you're requesting a refund..."
                    {...field}
                    disabled={isSubmitting}
                    rows={5}
                  />
                </FormControl>
                <FormDescription>
                  Be specific and provide details to help the vendor understand
                  your situation.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Submitting..." : "Request Refund"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
