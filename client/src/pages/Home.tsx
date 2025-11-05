import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MapPin, Search, Shield, Zap, Menu, X } from "lucide-react";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { usePostHogPageView, trackEvent } from "@/lib/analytics";
import { useState } from "react";
import { useIsMobile } from "@/hooks/useMobile";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();

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
            <span className="text-lg md:text-xl font-bold text-primary hidden sm:inline">{APP_TITLE}</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                trackEvent("navigation_click", {
                  destination: "marketplace",
                  source: "homepage_nav",
                });
                setLocation("/marketplace/vendors");
              }}
            >
              Marketplace
            </Button>
            {isAuthenticated ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocation("/cart")}
                  className="relative"
                >
                  Cart
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setLocation("/dashboard")}
                >
                  Dashboard
                </Button>
              </>
            ) : (
              <Button variant="default" size="sm" onClick={() => setLocation("/auth")}>
                Sign In
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 hover:bg-secondary rounded-lg transition"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background">
            <div className="container py-4 space-y-3 flex flex-col">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  trackEvent("navigation_click", {
                    destination: "directory",
                    source: "homepage_nav_mobile",
                  });
                  setLocation("/directory");
                  setMobileMenuOpen(false);
                }}
              >
                Browse Directory
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  trackEvent("navigation_click", {
                    destination: "marketplace",
                    source: "homepage_nav_mobile",
                  });
                  setLocation("/marketplace/vendors");
                  setMobileMenuOpen(false);
                }}
              >
                Marketplace
              </Button>
              {isAuthenticated ? (
                <>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => {
                      setLocation("/cart");
                      setMobileMenuOpen(false);
                    }}
                  >
                    Cart
                  </Button>
                  <Button
                    variant="default"
                    className="w-full justify-start"
                    onClick={() => {
                      setLocation("/dashboard");
                      setMobileMenuOpen(false);
                    }}
                  >
                    Dashboard
                  </Button>
                </>
              ) : (
                <Button
                  variant="default"
                  className="w-full justify-start"
                  onClick={() => {
                    setLocation("/auth");
                    setMobileMenuOpen(false);
                  }}
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-12 md:py-32">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="space-y-6 md:space-y-8">
              <div className="space-y-3 md:space-y-4">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-foreground">
                  Discover Your Local Business Community
                </h1>
                <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed">
                  Connect with verified businesses in your Melbourne suburb.
                  Browse services, check reviews, and support local.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90"
                  onClick={() => setLocation("/directory")}
                >
                  Explore Directory
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={() => setLocation("/marketplace/vendors")}
                >
                  Browse Marketplace
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
            <div className="relative h-64 sm:h-80 md:h-96 md:h-full md:min-h-96 bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl border border-border flex items-center justify-center">
              <div className="text-center px-4">
                <MapPin className="h-16 sm:h-20 md:h-24 w-16 sm:w-20 md:w-24 text-primary/30 mx-auto mb-3 md:mb-4" />
                <p className="text-sm sm:text-base text-muted-foreground">
                  Melbourne Local Marketplace
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 md:py-20 bg-secondary/30">
        <div className="container">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-3 md:mb-4">Why Choose Suburbmates?</h2>
            <p className="text-sm md:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
              A hyper-local marketplace designed for Melbourne communities with
              modern technology and genuine connections.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
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
              <Card key={idx} className="p-4 md:p-6 hover-lift">
                <feature.icon className="h-10 md:h-12 w-10 md:w-12 text-primary mb-3 md:mb-4" />
                <h3 className="text-base md:text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-xs md:text-sm leading-relaxed">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-20">
        <div className="container">
          <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-8 md:p-12 text-center text-white">
            <h2 className="text-2xl md:text-4xl font-bold mb-3 md:mb-4">Ready to Join?</h2>
            <p className="text-sm md:text-lg mb-6 md:mb-8 opacity-90 px-4">
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
                  <button 
                    onClick={() => setLocation("/directory")}
                    className="hover:text-foreground transition"
                  >
                    Directory
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setLocation("/marketplace/vendors")}
                    className="hover:text-foreground transition"
                  >
                    Marketplace
                  </button>
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
