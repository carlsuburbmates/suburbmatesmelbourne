import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MapPin, Search, Star } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

export default function Directory() {
  const [, setLocation] = useLocation();
  const [suburb, setSuburb] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [region, setRegion] = useState("");

  const { data: businesses, isLoading } = trpc.business.list.useQuery({
    suburb: suburb || undefined,
    businessName: businessName || undefined,
    limit: 20,
    offset: 0,
  });

  const { data: suburbs } = trpc.business.getMelbournSuburbs.useQuery({
    limit: 50,
  });

  const { data: regions } = trpc.location.listRegions.useQuery();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 border-b border-border py-8">
        <div className="container">
          <h1 className="text-4xl font-bold mb-4">Business Directory</h1>
          <p className="text-lg text-muted-foreground">
            Discover verified local businesses in your Melbourne suburb
          </p>
        </div>
      </div>

      <div className="container py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Filters */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-20">
              <h2 className="text-lg font-semibold mb-4">Filters</h2>

              <div className="space-y-4">
                {/* Business Name Search */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Business Name
                  </label>
                  <Input
                    placeholder="Search businesses..."
                    value={businessName}
                    onChange={e => setBusinessName(e.target.value)}
                    className="w-full"
                  />
                </div>

                {/* Region Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Region
                  </label>
                  <select
                    value={region}
                    onChange={e => setRegion(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                  >
                    <option value="">All Regions</option>
                    {regions?.filter(r => r !== null).map(r => (
                      <option key={r} value={r ?? ""}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Suburb Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Suburb
                  </label>
                  <select
                    value={suburb}
                    onChange={e => setSuburb(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                  >
                    <option value="">All Suburbs</option>
                    {suburbs?.map(s => (
                      <option key={s.id} value={s.suburb}>
                        {s.suburb} ({s.postcode})
                      </option>
                    ))}
                  </select>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setSuburb("");
                    setBusinessName("");
                    setRegion("");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </Card>
          </div>

          {/* Main Content - Business Listings */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="p-6 animate-pulse">
                    <div className="h-8 bg-muted rounded mb-4" />
                    <div className="h-4 bg-muted rounded mb-2" />
                    <div className="h-4 bg-muted rounded w-3/4" />
                  </Card>
                ))}
              </div>
            ) : businesses && businesses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {businesses.map(business => (
                  <Card
                    key={business.id}
                    className="overflow-hidden hover-lift cursor-pointer"
                    onClick={() => setLocation(`/business/${business.id}`)}
                  >
                    {/* Business Image Placeholder */}
                    <div className="h-40 bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center border-b border-border">
                      <MapPin className="h-16 w-16 text-primary/30" />
                    </div>

                    {/* Business Info */}
                    <div className="p-6">
                      <h3 className="text-lg font-semibold mb-2">
                        {business.businessName}
                      </h3>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                        <MapPin className="h-4 w-4" />
                        <span>
                          {business.suburb}{" "}
                          {business.address && `• ${business.address}`}
                        </span>
                      </div>

                      {business.about && (
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {business.about}
                        </p>
                      )}

                      {/* Status Badge */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          {business.abnVerifiedStatus === "verified" && (
                            <div className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                              ✓ Verified
                            </div>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={e => {
                            e.stopPropagation();
                            setLocation(`/business/${business.id}`);
                          }}
                        >
                          View Profile
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No businesses found
                </h3>
                <p className="text-muted-foreground">
                  Try adjusting your filters or search terms
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
