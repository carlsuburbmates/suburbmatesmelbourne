import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Globe, Clock, CheckCircle, ShieldCheck } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function BusinessProfile() {
  const [match, params] = useRoute("/business/:id");
  const [, navigate] = useLocation();
  const businessId = params?.id ? parseInt(params.id) : null;

  const { data: business, isLoading } = trpc.business.getById.useQuery(
    { id: businessId! },
    { enabled: !!businessId }
  );

  const { data: vendorMeta } = trpc.vendor.getVendorMeta.useQuery(
    { businessId: businessId! },
    { enabled: !!businessId }
  );

  if (!businessId) return <div>Invalid business ID</div>;
  if (isLoading) return <div>Loading...</div>;
  if (!business) return <div>Business not found</div>;

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Business Header */}
            <Card className="p-8 mb-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-4xl font-bold mb-2">
                    {business.businessName}
                  </h1>
                  <div className="flex items-center gap-2">
                    {business.abnVerifiedStatus === "verified" && (
                      <Badge className="bg-primary/10 text-primary">
                        ✓ ABN Verified
                      </Badge>
                    )}
                    {vendorMeta?.stripeAccountId && (
                      <Badge className="bg-blue-600 text-white">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Stripe Verified
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {business.about && (
                <p className="text-lg text-muted-foreground mb-6">
                  {business.about}
                </p>
              )}

              {/* Contact Information */}
              <div className="space-y-3">
                {business.address && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-primary" />
                    <span>
                      {business.address}, {business.suburb}
                    </span>
                  </div>
                )}
                {business.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-primary" />
                    <a
                      href={`tel:${business.phone}`}
                      className="hover:underline"
                    >
                      {business.phone}
                    </a>
                  </div>
                )}
                {business.website && (
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-primary" />
                    <a
                      href={business.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {business.website}
                    </a>
                  </div>
                )}
              </div>
            </Card>

            {/* Services */}
            {business.services && (
              <Card className="p-8 mb-8">
                <h2 className="text-2xl font-bold mb-4">Services</h2>
                <p className="text-muted-foreground">{business.services}</p>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div>
            <Card className="p-6 sticky top-20">
              <h3 className="text-lg font-semibold mb-4">Business Info</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-semibold capitalize">{business.status}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ABN Status</p>
                  <p className="font-semibold capitalize">
                    {business.abnVerifiedStatus}
                  </p>
                </div>
                <Button className="w-full">Contact Business</Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate(`/claim/${businessId}`)}
                >
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Claim This Business
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
