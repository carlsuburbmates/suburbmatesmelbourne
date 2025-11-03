import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Marketplace Page - Browse all vendors
 * Public page for browsing and filtering vendors by region
 */
export function Marketplace() {
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [offset, setOffset] = useState(0);
  const limit = 20;

  // Fetch all regions
  const { data: regions = [] } = trpc.location.listRegions.useQuery();

  // Fetch vendors (filtered by region if selected)
  const { data: vendorResults = [], isLoading } = trpc.vendor.listAll.useQuery(
    {
      region: selectedRegion || undefined,
      limit,
      offset,
    },
    { enabled: true }
  );

  const handleRegionChange = (region: string) => {
    setSelectedRegion(region);
    setOffset(0); // Reset pagination
  };

  // Extract businesses from vendor results (handle join result)
  const vendors = Array.isArray(vendorResults)
    ? vendorResults.map((item: any) => item.businesses || item)
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-emerald-900 mb-2">Vendor Marketplace</h1>
          <p className="text-lg text-emerald-700">
            Discover local businesses and vendors in Melbourne
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <Select value={selectedRegion} onValueChange={handleRegionChange}>
              <SelectTrigger className="bg-white border-emerald-200">
                <SelectValue placeholder="Filter by region..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Regions</SelectItem>
                {regions
                  .filter((r): r is string => r !== null && r !== undefined)
                  .map(region => (
                    <SelectItem key={region} value={region}>
                      {region}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Vendor Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            // Loading skeletons
            Array.from({ length: limit }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader>
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))
          ) : vendors.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 text-lg">No vendors found</p>
            </div>
          ) : (
            vendors.map((vendor: any, index: number) => (
              <Card
                key={vendor.id || index}
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer bg-white border-emerald-200"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-emerald-900">{vendor.businessName}</CardTitle>
                      <CardDescription className="text-emerald-700">
                        {vendor.suburb}
                      </CardDescription>
                    </div>
                    {vendor.abnVerifiedStatus === "verified" && (
                      <Badge className="bg-emerald-600 hover:bg-emerald-700">Verified</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {vendor.about && (
                    <p className="text-sm text-gray-600 line-clamp-2">{vendor.about}</p>
                  )}
                  {vendor.phone && (
                    <p className="text-sm text-gray-600">📞 {vendor.phone}</p>
                  )}
                  {vendor.website && (
                    <a
                      href={vendor.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-600 hover:underline text-sm"
                    >
                      Visit Website →
                    </a>
                  )}
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                    View Profile
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Pagination */}
        {vendors.length > 0 && (
          <div className="mt-8 flex justify-center gap-4">
            <Button
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={offset === 0}
              variant="outline"
            >
              ← Previous
            </Button>
            <div className="flex items-center px-4 py-2 bg-white rounded border border-emerald-200">
              <span className="text-sm text-gray-600">
                Page {Math.floor(offset / limit) + 1}
              </span>
            </div>
            <Button
              onClick={() => setOffset(offset + limit)}
              disabled={vendors.length < limit}
              variant="outline"
            >
              Next →
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
