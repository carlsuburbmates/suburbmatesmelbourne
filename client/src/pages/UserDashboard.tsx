import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

export default function UserDashboard() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  const { data: myBusinesses } = trpc.business.myBusinesses.useQuery();

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Welcome, {user?.name || user?.email}</p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              logout();
              setLocation("/");
            }}
          >
            Sign Out
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* My Businesses */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">My Businesses</h2>
            {myBusinesses && myBusinesses.length > 0 ? (
              <div className="space-y-2">
                {myBusinesses.map((business) => (
                  <div
                    key={business.id}
                    className="p-4 border border-border rounded-lg hover:bg-secondary/50 cursor-pointer transition"
                    onClick={() => setLocation(`/business/${business.id}`)}
                  >
                    <h3 className="font-semibold">{business.businessName}</h3>
                    <p className="text-sm text-muted-foreground">{business.suburb}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground mb-4">No businesses yet</p>
            )}
            <Button className="w-full mt-4" onClick={() => setLocation("/vendor/dashboard")}>
              Create Business
            </Button>
          </Card>

          {/* Profile Settings */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">Profile Settings</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-semibold">{user?.name || "Not set"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-semibold">{user?.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Role</p>
                <p className="font-semibold capitalize">{user?.role}</p>
              </div>
              <Button variant="outline" className="w-full">
                Edit Profile
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
