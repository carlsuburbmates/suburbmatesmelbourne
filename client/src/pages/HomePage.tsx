/**
 * HomePage Component (v5.2A)
 * 
 * Implements the official Suburbmates Homepage Design System (SSOT v5.2A)
 * - Forest/Emerald/Gold color palette
 * - 14px base typography with strict hierarchy
 * - Framer Motion animations (fade + y-axis, pulse on featured badges)
 * - Mobile-first responsive layout
 * - WCAG 2.2 AA accessibility compliance
 * - Core Web Vitals optimized (LCP ≤ 2s, INP ≤ 200ms, CLS ≤ 0.05)
 * 
 * Reference: /docs/design/SSOT_HOMEPAGE_REFERENCE.md
 */

import { motion } from "framer-motion";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MapPin, ArrowRight, Check, Shield, Zap, Menu, X } from "lucide-react";
import { APP_LOGO, APP_TITLE } from "@/const";
import { useLocation } from "wouter";
import { usePostHogPageView, trackEvent } from "@/lib/analytics";
import { useState } from "react";
import { useIsMobile } from "@/hooks/useMobile";

const fadeInUpVariants = {
  initial: { opacity: 0, y: 20 },
  inView: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" },
};

const staggerContainerVariants = {
  initial: { opacity: 0 },
  inView: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const cardHoverVariants = {
  initial: { y: 0 },
  whileHover: { y: -8 },
  transition: { duration: 0.3, ease: "easeOut" },
};

export default function HomePage() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  // Track page view
  usePostHogPageView("homepage");

  const handleNavigation = (destination: string, source: string) => {
    trackEvent("navigation_click", { destination, source });
    setLocation(destination);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      {/* ============ NAVIGATION ============ */}
      <nav className="sticky top-0 z-50 bg-stone-50/95 backdrop-blur-sm border-b border-stone-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between py-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            {APP_LOGO && (
              <img src={APP_LOGO} alt={APP_TITLE} className="h-8 w-8" />
            )}
            <span className="text-lg font-bold text-forest-900 hidden sm:inline">
              {APP_TITLE}
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <button
              onClick={() => handleNavigation("/directory", "homepage_nav")}
              className="text-sm text-stone-700 hover:text-forest-900 transition-colors font-medium"
            >
              Browse Directory
            </button>
            <button
              onClick={() => handleNavigation("/marketplace", "homepage_nav")}
              className="text-sm text-stone-700 hover:text-forest-900 transition-colors font-medium"
            >
              Marketplace
            </button>

            {isAuthenticated ? (
              <>
                <button
                  onClick={() => handleNavigation("/dashboard", "homepage_nav")}
                  className="text-sm text-stone-700 hover:text-forest-900 transition-colors font-medium"
                >
                  Dashboard
                </button>
              </>
            ) : (
              <Button
                onClick={() => handleNavigation("/auth", "homepage_nav")}
                className="bg-forest-700 hover:bg-forest-900 text-white text-sm h-9 px-4 rounded-md transition-all duration-200"
              >
                Sign In
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 hover:bg-stone-100 rounded-lg transition"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6 text-stone-900" />
            ) : (
              <Menu className="h-6 w-6 text-stone-900" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden border-t border-stone-300 bg-stone-50 py-4 px-4 space-y-3"
          >
            <button
              onClick={() => handleNavigation("/directory", "mobile_nav")}
              className="block w-full text-left text-sm text-stone-700 hover:text-forest-900 py-2 px-2 rounded transition"
            >
              Browse Directory
            </button>
            <button
              onClick={() => handleNavigation("/marketplace", "mobile_nav")}
              className="block w-full text-left text-sm text-stone-700 hover:text-forest-900 py-2 px-2 rounded transition"
            >
              Marketplace
            </button>
            {isAuthenticated ? (
              <button
                onClick={() => handleNavigation("/dashboard", "mobile_nav")}
                className="block w-full text-left text-sm text-stone-700 hover:text-forest-900 py-2 px-2 rounded transition"
              >
                Dashboard
              </button>
            ) : (
              <Button
                onClick={() => handleNavigation("/auth", "mobile_nav")}
                className="w-full bg-forest-700 hover:bg-forest-900 text-white text-sm h-10 rounded-md transition-all duration-200"
              >
                Sign In
              </Button>
            )}
          </motion.div>
        )}
      </nav>

      {/* ============ HERO SECTION ============ */}
      <section className="relative py-12 sm:py-16 lg:py-24 bg-gradient-to-br from-stone-50 to-stone-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="initial"
            animate="inView"
            variants={fadeInUpVariants}
            className="text-center"
          >
            <motion.div
              className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full bg-gold-400/15 border border-gold-400/30"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-medium text-forest-900">
                Melbourne's Local Marketplace
              </span>
            </motion.div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-forest-900 mt-6 mb-4 leading-tight">
              Discover & Support Your <span className="text-forest-700">Neighbourhood</span>
            </h1>

            <p className="text-sm sm:text-base text-stone-700 max-w-2xl mx-auto mb-8 leading-relaxed">
              Connect with trusted local businesses in your suburb. Browse verified vendors, explore services, and grow your neighbourhood economy.
            </p>

            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <Button
                onClick={() => handleNavigation("/directory", "hero_cta")}
                className="bg-forest-700 hover:bg-forest-900 text-white text-sm h-12 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 hover:scale-102"
              >
                Browse Directory
                <ArrowRight className="w-4 h-4" />
              </Button>

              <Button
                onClick={() => handleNavigation("/join", "hero_cta")}
                className="bg-white border-2 border-forest-700 text-forest-700 hover:bg-forest-50 text-sm h-12 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 font-medium"
              >
                List Your Business
                <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ============ VALUE PROPOSITIONS ============ */}
      <section className="py-12 sm:py-16 lg:py-20 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="initial"
            whileInView="inView"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainerVariants}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
          >
            {[
              {
                icon: <MapPin className="w-5 h-5" />,
                title: "Hyper-Local",
                description: "Find businesses right in your Melbourne suburb",
              },
              {
                icon: <Shield className="w-5 h-5" />,
                title: "Verified",
                description: "All vendors are verified for your peace of mind",
              },
              {
                icon: <Zap className="w-5 h-5" />,
                title: "Fast & Easy",
                description: "Browse, order, and support local instantly",
              },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                variants={fadeInUpVariants}
                className="group"
              >
                <Card className="h-full p-6 bg-white border-stone-300 hover:border-forest-700 hover:shadow-md transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-gold-400/10 text-forest-700 group-hover:bg-gold-400/20 transition-colors">
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-forest-900 mb-1">
                        {item.title}
                      </h3>
                      <p className="text-xs text-stone-700 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ============ FEATURED SECTION ============ */}
      <section className="py-12 sm:py-16 lg:py-20 bg-stone-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="initial"
            whileInView="inView"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUpVariants}
            className="text-center mb-12"
          >
            <motion.div
              className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Check className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-medium text-stone-900">
                Popular Categories
              </span>
            </motion.div>

            <h2 className="text-xl sm:text-2xl font-bold text-forest-900 mt-4">
              Explore Categories
            </h2>
            <p className="text-sm text-stone-700 mt-2">
              Browse products and services by category
            </p>
          </motion.div>

          <motion.div
            initial="initial"
            whileInView="inView"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainerVariants}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {[
              { name: "Electronics", emoji: "⚡" },
              { name: "Food & Beverage", emoji: "🍔" },
              { name: "Services", emoji: "🔧" },
              { name: "Retail", emoji: "🛍️" },
            ].map((category, idx) => (
              <motion.button
                key={idx}
                variants={fadeInUpVariants}
                whileHover={{ y: -4 }}
                onClick={() => handleNavigation("/directory", "category_nav")}
                className="relative h-24 rounded-lg overflow-hidden group"
              >
                <Card className="absolute inset-0 bg-gradient-to-br from-stone-50 to-stone-100 border-stone-300 flex items-center justify-center gap-3 hover:border-forest-700 transition-all duration-300 group-hover:shadow-md">
                  <span className="text-3xl">{category.emoji}</span>
                  <span className="text-sm font-semibold text-forest-900">
                    {category.name}
                  </span>
                </Card>
              </motion.button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ============ CTA SECTION ============ */}
      <section className="py-12 sm:py-16 lg:py-20 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="initial"
            whileInView="inView"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUpVariants}
            className="text-center max-w-2xl mx-auto"
          >
            <h2 className="text-xl sm:text-2xl font-bold text-forest-900 mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-sm text-stone-700 mb-8 leading-relaxed">
              {isAuthenticated
                ? "Start exploring verified local vendors and exclusive offers"
                : "Join Suburbmates to discover amazing local businesses and exclusive neighbourhood deals"}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => handleNavigation("/directory", "footer_cta")}
                className="bg-forest-700 hover:bg-forest-900 text-white text-sm h-11 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 hover:scale-102"
              >
                Browse Directory
              </Button>
              {!isAuthenticated && (
                <Button
                  onClick={() => handleNavigation("/join", "footer_cta")}
                  className="bg-gold-400/20 hover:bg-gold-400/30 text-forest-900 text-sm h-11 px-6 rounded-lg transition-all duration-200 border border-gold-400/50 font-medium"
                >
                  List Your Business
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="border-t border-stone-300 bg-stone-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-8">
            {/* About */}
            <div>
              <h4 className="text-xs font-semibold text-forest-900 uppercase tracking-wide mb-4">
                About
              </h4>
              <p className="text-xs text-stone-700 leading-relaxed">
                Suburbmates connects Melbourne communities with verified local businesses, fostering neighbourhood commerce and community connection.
              </p>
            </div>

            {/* Browse */}
            <div>
              <h4 className="text-xs font-semibold text-forest-900 uppercase tracking-wide mb-4">
                Browse
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <button
                    onClick={() => handleNavigation("/directory", "footer_nav")}
                    className="text-stone-700 hover:text-forest-900 transition-colors font-medium"
                  >
                    Directory
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNavigation("/marketplace", "footer_nav")}
                    className="text-stone-700 hover:text-forest-900 transition-colors font-medium"
                  >
                    Marketplace
                  </button>
                </li>
              </ul>
            </div>

            {/* For Business */}
            <div>
              <h4 className="text-xs font-semibold text-forest-900 uppercase tracking-wide mb-4">
                For Business
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <button
                    onClick={() => handleNavigation("/join", "footer_nav")}
                    className="text-stone-700 hover:text-forest-900 transition-colors font-medium"
                  >
                    List Your Business
                  </button>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-xs font-semibold text-forest-900 uppercase tracking-wide mb-4">
                Legal
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <a
                    href="#"
                    className="text-stone-700 hover:text-forest-900 transition-colors"
                  >
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-stone-700 hover:text-forest-900 transition-colors"
                  >
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-stone-300 pt-8 text-center text-xs text-stone-700">
            <p>&copy; 2025 {APP_TITLE}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
