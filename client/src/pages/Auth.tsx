import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Auth() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"email" | "token">("email");
  const [token, setToken] = useState("");

  const requestTokenMutation = trpc.emailVerification.requestToken.useMutation({
    onSuccess: () => {
      toast.success("Verification email sent!");
      setStep("token");
    },
    onError: error => {
      toast.error(error.message);
    },
  });

  const verifyTokenMutation = trpc.emailVerification.verifyToken.useMutation({
    onSuccess: () => {
      toast.success("Logged in successfully!");
      setLocation("/dashboard");
    },
    onError: error => {
      toast.error(error.message);
    },
  });

  const handleRequestToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email");
      return;
    }
    requestTokenMutation.mutate({ email });
  };

  const handleVerifyToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error("Please enter the verification token");
      return;
    }
    verifyTokenMutation.mutate({ token });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4">
      <Card className="w-full max-w-md p-8">
        <h1 className="text-3xl font-bold mb-2">Sign In</h1>
        <p className="text-muted-foreground mb-8">
          {step === "email"
            ? "Enter your email to get started"
            : "Enter the verification token"}
        </p>

        {step === "email" ? (
          <form onSubmit={handleRequestToken} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Email</label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={requestTokenMutation.isPending}
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={requestTokenMutation.isPending}
            >
              {requestTokenMutation.isPending
                ? "Sending..."
                : "Send Verification Link"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyToken} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Verification Token
              </label>
              <Input
                type="text"
                placeholder="Paste the token from your email"
                value={token}
                onChange={e => setToken(e.target.value)}
                disabled={verifyTokenMutation.isPending}
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={verifyTokenMutation.isPending}
            >
              {verifyTokenMutation.isPending
                ? "Verifying..."
                : "Verify & Sign In"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => {
                setStep("email");
                setToken("");
              }}
            >
              Back
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
