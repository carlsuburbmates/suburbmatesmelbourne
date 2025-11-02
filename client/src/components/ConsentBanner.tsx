import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { trackEvent } from "@/lib/analytics";

/**
 * Simple consent banner for privacy compliance
 * Logs immutable consent records when user accepts
 */
export function ConsentBanner() {
  const { isAuthenticated, user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const logConsentMutation = trpc.consent.log.useMutation({
    onSuccess: () => {
      // Track analytics consent acceptance
      trackEvent("consent_accepted", {
        consent_action: "privacy_policy_accepted",
        user_id: user?.id,
      });
      setDismissed(true);
      localStorage.setItem("consent_accepted", "true");
    },
    onError: (error) => {
      console.error("Failed to log consent:", error);
    },
  });

  useEffect(() => {
    // Only show for authenticated users who haven't accepted yet
    const hasAccepted = localStorage.getItem("consent_accepted") === "true";
    if (isAuthenticated && !hasAccepted && !dismissed) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [isAuthenticated, dismissed]);

  const handleAccept = () => {
    logConsentMutation.mutate({ action: "privacy_policy_accepted" });
  };

  const handleDismiss = () => {
    setVisible(false);
    // Don't permanently dismiss without accepting - will show again on next visit
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-slide-up">
      <Card className="mx-auto max-w-4xl p-6 shadow-xl border-2">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-2">Privacy & Consent</h3>
            <p className="text-sm text-muted-foreground">
              We use cookies and collect data to improve your experience. By continuing to use
              Suburbmates, you agree to our{" "}
              <a href="/privacy" className="underline hover:text-primary">
                Privacy Policy
              </a>{" "}
              and consent to data processing. Your consent is logged with cryptographic integrity
              for compliance.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              variant="outline"
              onClick={handleDismiss}
              disabled={logConsentMutation.isPending}
            >
              Dismiss
            </Button>
            <Button
              onClick={handleAccept}
              disabled={logConsentMutation.isPending}
              className="min-w-[120px]"
            >
              {logConsentMutation.isPending ? "Logging..." : "Accept"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
