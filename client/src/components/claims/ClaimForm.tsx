import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";

interface ClaimFormProps {
  businessId: number;
  onSuccess?: () => void;
}

export function ClaimForm({ businessId, onSuccess }: ClaimFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const requestMutation = trpc.claim.request.useMutation({
    onSuccess: () => {
      toast.success(
        "Claim submitted successfully! We'll review it shortly."
      );
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit claim");
    },
  });

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await requestMutation.mutateAsync({
        businessId,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Alert className="border-blue-200 bg-blue-50">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <p className="font-semibold">Verification Required</p>
          <p className="text-sm mt-1">
            After submitting your claim, our team will contact you to verify your
            ownership of this business.
          </p>
        </AlertDescription>
      </Alert>

      <p className="text-sm text-muted-foreground">
        Submit your claim to begin the verification process. We'll contact you at
        the email associated with your account.
      </p>

      <Button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="w-full"
        size="lg"
      >
        {isSubmitting ? "Submitting..." : "Submit Claim"}
      </Button>
    </div>
  );
}
