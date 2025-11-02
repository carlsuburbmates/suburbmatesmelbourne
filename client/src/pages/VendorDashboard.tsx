import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import {
  usePostHogPageView,
  trackBusinessAction,
  trackAIEvent,
  trackEvent,
} from "@/lib/analytics";

export default function VendorDashboard() {
  const { user } = useAuth();

  // Track page view
  usePostHogPageView("vendor_dashboard");
  const [formData, setFormData] = useState({
    businessName: "",
    abn: "",
    suburb: "",
    phone: "",
    website: "",
    about: "",
  });

  const createBusinessMutation = trpc.business.create.useMutation({
    onSuccess: data => {
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
    onError: error => {
      toast.error(error.message);
      trackEvent("business_creation_failed", { error: error.message });
    },
  });

  const generateDescriptionMutation =
    trpc.llm.generateBusinessDescription.useMutation({
      onSuccess: response => {
        if (response.success) {
          setFormData({ ...formData, about: response.description });
          toast.success("Description generated successfully!");
          trackAIEvent("description_generated", {
            business_name: formData.businessName,
            category: "General Business",
            success: true,
          });
        } else {
          toast.error("Failed to generate description");
          trackAIEvent("description_generated", { success: false });
        }
      },
      onError: error => {
        toast.error(error.message || "Failed to generate description");
        trackAIEvent("description_generated", {
          success: false,
          error: error.message,
        });
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

    // Track AI button click
    trackAIEvent("description_button_clicked", {
      business_name: formData.businessName,
    });

    // For category, we'll use a simple classification based on business name
    // or default to "General Business" - this could be enhanced with a category selector
    generateDescriptionMutation.mutate({
      name: formData.businessName,
      category: "General Business", // Could be enhanced to detect or let user select category
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-12">
        <h1 className="text-4xl font-bold mb-8">Create Your Business</h1>

        <Card className="max-w-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Business Name *
              </label>
              <Input
                required
                placeholder="Your business name"
                value={formData.businessName}
                onChange={e =>
                  setFormData({ ...formData, businessName: e.target.value })
                }
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                ABN (11 digits)
              </label>
              <Input
                placeholder="12345678901"
                value={formData.abn}
                onChange={e =>
                  setFormData({ ...formData, abn: e.target.value })
                }
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Suburb</label>
              <Input
                placeholder="e.g., Melbourne, Fitzroy"
                value={formData.suburb}
                onChange={e =>
                  setFormData({ ...formData, suburb: e.target.value })
                }
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Phone</label>
              <Input
                type="tel"
                placeholder="(03) 1234 5678"
                value={formData.phone}
                onChange={e =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Website</label>
              <Input
                type="url"
                placeholder="https://example.com"
                value={formData.website}
                onChange={e =>
                  setFormData({ ...formData, website: e.target.value })
                }
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
                      Generate Description with AI
                    </>
                  )}
                </Button>
              </div>
              <textarea
                placeholder="Tell us about your business..."
                value={formData.about}
                onChange={e =>
                  setFormData({ ...formData, about: e.target.value })
                }
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                rows={4}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={createBusinessMutation.isPending}
            >
              {createBusinessMutation.isPending
                ? "Creating..."
                : "Create Business"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
