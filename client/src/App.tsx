import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ConsentBanner } from "./components/ConsentBanner";
import { ThemeProvider } from "./contexts/ThemeContext";
import { CartProvider } from "./_core/contexts/CartContext";
import HomePage from "./pages/HomePage";
import Directory from "./pages/Directory";
import BusinessProfile from "./pages/BusinessProfile";
import Auth from "./pages/Auth";
import UserDashboard from "./pages/UserDashboard";
import VendorDashboard from "./pages/VendorDashboard";
import { Marketplace } from "./pages/Marketplace";
import { VendorSetup } from "./pages/VendorSetup";
import { VendorProfile } from "./pages/VendorProfile";
import { StripeTest } from "./pages/StripeTest";
import CheckoutEntry from "./pages/Checkout";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import CheckoutCancel from "./pages/CheckoutCancel";
import Orders from "./pages/Orders";
import ClaimBusiness from "./pages/ClaimBusiness";
import OrderDetail from "./pages/OrderDetail";
import AdminClaimsPage from "./pages/admin/AdminClaimsPage";
import AdminDisputesPage from "./pages/admin/AdminDisputesPage";
import VendorRefundResponsePage from "./pages/vendor/VendorRefundResponsePage";
import { CartPage } from "./pages/CartPage";
import { NotificationCenter } from "./pages/NotificationCenter";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={HomePage} />
      <Route path={"/directory"} component={Directory} />
      <Route path={"/business/:id"} component={BusinessProfile} />
      <Route path={"/claim/:businessId"} component={ClaimBusiness} />
      <Route path={"/auth"} component={Auth} />
      <Route path={"/cart"} component={CartPage} />
      <Route path={"/notifications"} component={NotificationCenter} />
      <Route path={"/dashboard"} component={UserDashboard} />
      <Route path={"/vendor/dashboard"} component={VendorDashboard} />
      <Route path={"/marketplace"} component={Marketplace} />
      <Route path={"/marketplace/vendors"} component={Marketplace} />
      <Route path={"/dashboard/vendor/setup"} component={VendorSetup} />
      <Route path={"/vendor/:vendorId"} component={VendorProfile} />
      <Route path={"/stripe-test"} component={StripeTest} />
      <Route path={"/checkout/:orderId"} component={CheckoutEntry} />
      <Route path={"/checkout/success"} component={CheckoutSuccess} />
      <Route path={"/checkout/cancel"} component={CheckoutCancel} />
      <Route path={"/orders"} component={Orders} />
      <Route path={"/orders/:orderId"} component={OrderDetail} />
      <Route path={"/admin/claims"} component={AdminClaimsPage} />
      <Route path={"/admin/disputes"} component={AdminDisputesPage} />
      <Route path={"/vendor/refunds"} component={VendorRefundResponsePage} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <CartProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
            <ConsentBanner />
          </TooltipProvider>
        </CartProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
