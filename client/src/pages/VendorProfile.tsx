import { useMemo } from "react";
import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  MapPin,
  Star,
  ExternalLink,
  CheckCircle,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

/**
 * Vendor Profile Page - Public vendor details display
 * Shows business info + vendor metadata (Stripe, fulfilment terms, etc.)
 */
export function VendorProfile() {
  const [match, params] = useRoute("/vendor/:vendorId");

  const vendorId = useMemo(
    () => params?.vendorId ? parseInt(params.vendorId) : undefined,
    [params]
  );

  const { data: vendor, isLoading, error } = trpc.vendor.getDetails.useQuery(
    { vendorId: vendorId! },
    { enabled: !!vendorId }
  );

  if (!match) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-50 p-6">
        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <Skeleton className="h-40 bg-emerald-200" />
            <Skeleton className="h-64 bg-emerald-200" />
          </div>
          <Skeleton className="h-96 bg-emerald-200" />
        </div>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error?.message || "Vendor not found"}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const { businesses, vendors_meta } = vendor as any;
  const business = Array.isArray(businesses) ? businesses[0] : businesses;
  const vendorMeta = vendors_meta || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <a href="/marketplace/vendors" className="text-emerald-600 hover:text-emerald-700 mb-4 inline-block">
            ← Back to Vendors
          </a>
          <h1 className="text-4xl font-bold text-emerald-900 flex items-center gap-3">
            {business?.businessName}
            {vendorMeta?.stripeAccountId && (
              <Badge className="bg-blue-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Stripe Verified
              </Badge>
            )}
          </h1>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Business Info */}
            <Card className="bg-white border-emerald-200">
              <CardHeader>
                <CardTitle className="text-emerald-900">Business Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {business?.description && (
                  <div>
                    <h3 className="font-medium text-emerald-900 mb-2">About</h3>
                    <p className="text-gray-700">{business.description}</p>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-emerald-900 mb-1">Location</h3>
                    <div className="flex items-center gap-2 text-gray-700">
                      <MapPin className="h-4 w-4 text-emerald-600" />
                      {business?.suburb}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium text-emerald-900 mb-1">Verification</h3>
                    <Badge variant={business?.abnVerifiedStatus === "verified" ? "default" : "secondary"}>
                      {business?.abnVerifiedStatus === "verified"
                        ? "✓ ABN Verified"
                        : "Pending"}
                    </Badge>
                  </div>
                </div>

                {business?.abn && (
                  <div>
                    <h3 className="font-medium text-emerald-900 mb-1">ABN</h3>
                    <p className="text-gray-700 font-mono">{business.abn}</p>
                  </div>
                )}

                {business?.phone && (
                  <div>
                    <h3 className="font-medium text-emerald-900 mb-1">Contact</h3>
                    <a href={`tel:${business.phone}`} className="text-emerald-600 hover:underline">
                      {business.phone}
                    </a>
                  </div>
                )}

                {business?.website && (
                  <div>
                    <h3 className="font-medium text-emerald-900 mb-1">Website</h3>
                    <a
                      href={business.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-600 hover:underline flex items-center gap-1"
                    >
                      {business.website}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Vendor Details */}
            {vendorMeta?.stripeAccountId && (
              <Card className="bg-white border-emerald-200">
                <CardHeader>
                  <CardTitle className="text-emerald-900">Vendor Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {vendorMeta?.fulfilmentTerms && (
                    <div>
                      <h3 className="font-medium text-emerald-900 mb-2">
                        Fulfilment Terms
                      </h3>
                      <p className="text-gray-700">{vendorMeta.fulfilmentTerms}</p>
                    </div>
                  )}

                  {vendorMeta?.refundPolicyUrl && (
                    <div>
                      <h3 className="font-medium text-emerald-900 mb-2">
                        Refund Policy
                      </h3>
                      <a
                        href={vendorMeta.refundPolicyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-600 hover:underline flex items-center gap-1"
                      >
                        View Refund Policy
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}

                  <div className="bg-emerald-50 border border-emerald-200 rounded p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                      <p className="font-medium text-emerald-900">
                        Secure Stripe Payments
                      </p>
                    </div>
                    <p className="text-sm text-emerald-700">
                      This vendor processes payments through Stripe, ensuring secure
                      transactions.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Rating */}
            <Card className="bg-white border-emerald-200">
              <CardHeader>
                <CardTitle className="text-emerald-900 text-lg">Rating</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-5 w-5 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <p className="text-sm text-gray-600">No reviews yet</p>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-white border-emerald-200">
              <CardHeader>
                <CardTitle className="text-emerald-900 text-lg">Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {business?.phone && (
                  <Button
                    variant="outline"
                    className="w-full border-emerald-200 hover:bg-emerald-50"
                    asChild
                  >
                    <a href={`tel:${business.phone}`}>Call</a>
                  </Button>
                )}
                {business?.website && (
                  <Button
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    asChild
                  >
                    <a href={business.website} target="_blank" rel="noopener noreferrer">
                      Visit Website
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* About Vendor */}
            <Card className="bg-emerald-50 border-emerald-200">
              <CardHeader>
                <CardTitle className="text-emerald-900 text-sm">
                  About Vendors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-emerald-700">
                  Verified vendors on Suburbmates have completed Stripe setup and
                  agree to our community standards and refund policies.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
