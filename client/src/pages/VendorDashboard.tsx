import { useAuth } from "@/_core/hooks/useAuth";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import DashboardLayout from "@/components/DashboardLayout";
import { ProductsList } from "@/components/products/ProductsList";
import { ProductForm } from "@/components/products/ProductForm";
import { TierLimitIndicator } from "@/components/products/TierLimitIndicator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Package } from "lucide-react";
import {
  usePostHogPageView,
  trackBusinessAction,
  trackEvent,
} from "@/lib/analytics";

export default function VendorDashboard() {
  const { user } = useAuth();
  usePostHogPageView("vendor_dashboard");

  const [activeTab, setActiveTab] = useState<"products" | "business">("products");
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);

  // For now, products tab is the primary focus
  // Business creation form is moved to a separate section

  if (!user) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
          <p className="text-slate-600">Please log in to access your vendor dashboard</p>
        </div>
      </DashboardLayout>
    );
  }

  const handleEditProduct = (productId: number) => {
    setEditingProductId(productId);
    setProductFormOpen(true);
    trackEvent("vendor_edit_product_click", { productId });
  };

  const handleCreateProduct = () => {
    setEditingProductId(null);
    setProductFormOpen(true);
    trackEvent("vendor_create_product_click");
  };

  const handleProductFormClose = () => {
    setProductFormOpen(false);
    setEditingProductId(null);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Vendor Dashboard</h1>

        {/* Tier Limit Indicator */}
        <TierLimitIndicator onCreateClick={handleCreateProduct} />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "products" | "business")}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="products" className="gap-2">
              <Package className="h-4 w-4" />
              Products
            </TabsTrigger>
            <TabsTrigger value="business" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Business
            </TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">My Products</h2>
                <p className="text-slate-600">Manage your product catalog</p>
              </div>
              <Button onClick={handleCreateProduct} className="gap-2">
                <Package className="h-4 w-4" />
                New Product
              </Button>
            </div>

            <ProductsList
              vendorId={String(user.id)}
              onEditClick={handleEditProduct}
              onCreateClick={handleCreateProduct}
            />

            {/* Product Form Modal */}
            <ProductForm
              vendorId={String(user.id)}
              open={productFormOpen}
              onOpenChange={setProductFormOpen}
              onCancel={handleProductFormClose}
              onSuccess={() => {
                setProductFormOpen(false);
                setEditingProductId(null);
              }}
            />
          </TabsContent>

          {/* Business Tab */}
          <TabsContent value="business" className="space-y-6">
            <BusinessManagement />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

/**
 * Business Management Section
 * Moved from main dashboard for cleaner UI organization
 */
function BusinessManagement() {
  const [formData, setFormData] = useState({
    businessName: "",
    abn: "",
    suburb: "",
    phone: "",
    website: "",
    about: "",
  });

  const createBusinessMutation = trpc.business.create.useMutation({
    onSuccess: (data) => {
      toast.success("Business created successfully!");
      trackBusinessAction("created", {
        businessId: data.businessId,
        businessName: formData.businessName,
        suburb: formData.suburb,
      });
      setFormData({
        businessName: "",
        abn: "",
        suburb: "",
        phone: "",
        website: "",
        about: "",
      });
    },
    onError: (error) => {
      toast.error(error.message);
      trackEvent("business_creation_failed", { error: error.message });
    },
  });

  const generateDescriptionMutation =
    trpc.llm.generateBusinessDescription.useMutation({
      onSuccess: (response) => {
        if (response.success) {
          setFormData({ ...formData, about: response.description });
          toast.success("Description generated successfully!");
          trackEvent("business_description_generated", {
            success: true,
          });
        } else {
          toast.error("Failed to generate description");
        }
      },
      onError: (error) => {
        toast.error(error.message || "Failed to generate description");
      },
    });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createBusinessMutation.mutate(formData);
  };

  const handleGenerateDescription = () => {
    if (!formData.businessName.trim()) {
      toast.error("Please enter a business name first");
      return;
    }
    generateDescriptionMutation.mutate({
      name: formData.businessName,
      category: "General Business",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Business Information</CardTitle>
        <CardDescription>
          Create and manage your business profile
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Business Name *
            </label>
            <input
              required
              placeholder="Your business name"
              value={formData.businessName}
              onChange={(e) =>
                setFormData({ ...formData, businessName: e.target.value })
              }
              className="w-full px-3 py-2 border border-border rounded-md bg-background"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              ABN (11 digits)
            </label>
            <input
              placeholder="12345678901"
              value={formData.abn}
              onChange={(e) =>
                setFormData({ ...formData, abn: e.target.value })
              }
              className="w-full px-3 py-2 border border-border rounded-md bg-background"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Suburb</label>
            <input
              placeholder="e.g., Melbourne, Fitzroy"
              value={formData.suburb}
              onChange={(e) =>
                setFormData({ ...formData, suburb: e.target.value })
              }
              className="w-full px-3 py-2 border border-border rounded-md bg-background"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Phone</label>
            <input
              type="tel"
              placeholder="(03) 1234 5678"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              className="w-full px-3 py-2 border border-border rounded-md bg-background"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Website</label>
            <input
              type="url"
              placeholder="https://example.com"
              value={formData.website}
              onChange={(e) =>
                setFormData({ ...formData, website: e.target.value })
              }
              className="w-full px-3 py-2 border border-border rounded-md bg-background"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">About</label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateDescription}
                disabled={
                  generateDescriptionMutation.isPending ||
                  !formData.businessName.trim()
                }
                className="text-xs"
              >
                {generateDescriptionMutation.isPending ? (
                  <>Generating...</>
                ) : (
                  <>
                    <Sparkles className="h-3 w-3 mr-1" />
                    Generate with AI
                  </>
                )}
              </Button>
            </div>
            <textarea
              placeholder="Tell us about your business..."
              value={formData.about}
              onChange={(e) =>
                setFormData({ ...formData, about: e.target.value })
              }
              className="w-full px-3 py-2 border border-border rounded-md bg-background"
              rows={4}
            />
          </div>

          <Button
            type="submit"
            disabled={createBusinessMutation.isPending}
          >
            {createBusinessMutation.isPending
              ? "Creating..."
              : "Create Business"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
