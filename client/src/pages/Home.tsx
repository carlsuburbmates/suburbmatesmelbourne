import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MapPin, Search, Shield, Zap } from "lucide-react";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { usePostHogPageView, trackEvent } from "@/lib/analytics";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  // Track page view
  usePostHogPageView("homepage");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-2">
            {APP_LOGO && (
              <img src={APP_LOGO} alt={APP_TITLE} className="h-8 w-8" />
            )}
            <span className="text-xl font-bold text-primary">{APP_TITLE}</span>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => {
                trackEvent("navigation_click", {
                  destination: "directory",
                  source: "homepage_nav",
                });
                setLocation("/directory");
              }}
            >
              Browse Directory
            </Button>
            {isAuthenticated ? (
              <Button
                variant="default"
                onClick={() => setLocation("/dashboard")}
              >
                Dashboard
              </Button>
            ) : (
              <Button variant="default" onClick={() => setLocation("/auth")}>
                Sign In
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-5xl md:text-6xl font-bold leading-tight text-foreground">
                  Discover Your Local Business Community
                </h1>
                <p className="text-xl text-muted-foreground">
                  Connect with verified businesses in your Melbourne suburb.
                  Browse services, check reviews, and support local.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90"
                  onClick={() => setLocation("/directory")}
                >
                  Explore Directory
                </Button>
                {!isAuthenticated && (
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => setLocation("/auth")}
                  >
                    Get Started
                  </Button>
                )}
              </div>
            </div>

            {/* Hero Image Placeholder */}
            <div className="relative h-96 md:h-full min-h-96 bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl border border-border flex items-center justify-center">
              <div className="text-center">
                <MapPin className="h-24 w-24 text-primary/30 mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Melbourne Local Marketplace
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-secondary/30">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why Choose Suburbmates?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A hyper-local marketplace designed for Melbourne communities with
              modern technology and genuine connections.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: MapPin,
                title: "Hyper-Local",
                description:
                  "Find businesses in your suburb with precise geofencing",
              },
              {
                icon: Shield,
                title: "Verified Businesses",
                description: "All businesses verified with ABN registration",
              },
              {
                icon: Search,
                title: "Easy Discovery",
                description: "Advanced search and filtering for what you need",
              },
              {
                icon: Zap,
                title: "Fast & Modern",
                description:
                  "Built with cutting-edge technology for smooth experience",
              },
            ].map((feature, idx) => (
              <Card key={idx} className="p-6 hover-lift">
                <feature.icon className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container">
          <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-12 text-center text-white">
            <h2 className="text-4xl font-bold mb-4">Ready to Join?</h2>
            <p className="text-lg mb-8 opacity-90">
              {isAuthenticated
                ? "Visit your dashboard to manage your profile and explore businesses"
                : "Sign up now to start discovering local businesses"}
            </p>
            <Button
              size="lg"
              variant="secondary"
              onClick={() =>
                setLocation(isAuthenticated ? "/dashboard" : "/auth")
              }
            >
              {isAuthenticated ? "Go to Dashboard" : "Sign Up Now"}
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-secondary/20 py-12">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-semibold mb-4">About</h4>
              <p className="text-sm text-muted-foreground">
                Suburbmates connects Melbourne communities with verified local
                businesses.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Browse</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition">
                    Directory
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition">
                    Categories
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition">
                    Suburbs
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">For Business</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition">
                    List Your Business
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition">
                    Features
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2025 {APP_TITLE}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
