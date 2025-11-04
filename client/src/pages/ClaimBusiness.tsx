import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { ClaimForm } from "@/components/claims/ClaimForm";

export default function ClaimBusiness() {
  const [match, params] = useRoute("/claim/:businessId");
  const [, navigate] = useLocation();
  const businessId = params?.businessId ? parseInt(params.businessId) : null;

  const { data: business, isLoading: businessLoading } =
    trpc.business.getById.useQuery(
      { id: businessId! },
      { enabled: !!businessId }
    );

  const { data: claimStatus, isLoading: claimLoading } =
    trpc.claim.getStatus.useQuery(
      { businessId: businessId! },
      { enabled: !!businessId }
    );

  if (!businessId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Invalid Business ID</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Please provide a valid business ID to claim.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (businessLoading || claimLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Business Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              The business you're looking for doesn't exist.
            </p>
            <Button
              variant="outline"
              className="mt-4 w-full"
              onClick={() => navigate("/directory")}
            >
              Back to Directory
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const claimExists = claimStatus !== null;
  const claimApproved = claimStatus?.status === "approved";
  const claimPending = claimStatus?.status === "pending";
  const claimRejected = claimStatus?.status === "rejected";

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container max-w-2xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Claim This Business</h1>
          <p className="text-lg text-muted-foreground">
            Verify your ownership of "{business.businessName}"
          </p>
        </div>

        <div className="grid gap-6">
          {/* Business Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Business Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Business Name
                </p>
                <p className="text-lg">{business.businessName}</p>
              </div>

              {business.suburb && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Suburb
                  </p>
                  <p className="text-lg">{business.suburb}</p>
                </div>
              )}

              {business.abnVerifiedStatus && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    ABN Status
                  </p>
                  <Badge
                    variant={
                      business.abnVerifiedStatus === "verified"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {business.abnVerifiedStatus}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status Messages */}
          {claimApproved && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <p className="font-semibold">Claim Approved! 🎉</p>
                <p className="text-sm mt-1">
                  Your business ownership has been verified. You can now manage
                  this business listing.
                </p>
              </AlertDescription>
            </Alert>
          )}

          {claimPending && (
            <Alert className="border-blue-200 bg-blue-50">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <p className="font-semibold">Claim Pending Review</p>
                <p className="text-sm mt-1">
                  We're reviewing your claim. This usually takes 1-2 business
                  days. We'll contact you at the email you provided with an
                  update.
                </p>
              </AlertDescription>
            </Alert>
          )}

          {claimRejected && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <p className="font-semibold">Claim Rejected</p>
                <p className="text-sm mt-1">
                  Unfortunately, we couldn't verify your claim. Please ensure
                  you're providing accurate information and try again.
                </p>
              </AlertDescription>
            </Alert>
          )}

          {/* About Section */}
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="text-base">
                What does claiming mean?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-amber-900">
              <p>
                When you claim this business, you're verifying that you own or
                operate it. Suburbmates will:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Verify your identity and business ownership</li>
                <li>
                  Give you access to manage this business listing and products
                </li>
                <li>
                  NOT take responsibility for fulfilling orders or handling
                  refunds
                </li>
              </ul>
              <p className="pt-2 font-semibold">
                You remain responsible for all customer interactions, orders,
                and refunds.
              </p>
            </CardContent>
          </Card>

          {/* Claim Form or Status */}
          {!claimExists ? (
            <Card>
              <CardHeader>
                <CardTitle>Submit Your Claim</CardTitle>
              </CardHeader>
              <CardContent>
                <ClaimForm businessId={businessId} />
              </CardContent>
            </Card>
          ) : claimApproved ? (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-700">
                  Ready to Manage Your Business
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => navigate("/vendor/dashboard")}
                  className="w-full"
                >
                  Go to Dashboard
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle>Claim Status: {claimStatus?.status}</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                <p>
                  You already have a {claimStatus?.status} claim for this
                  business. Check back soon for an update.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
