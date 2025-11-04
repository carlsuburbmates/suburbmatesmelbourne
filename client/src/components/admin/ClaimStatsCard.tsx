import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface ClaimStats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

interface ClaimStatsCardProps {
  stats: ClaimStats;
}

export function ClaimStatsCard({ stats }: ClaimStatsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Claims Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total Claims</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              Pending
              <Badge variant="secondary" className="text-xs">
                {stats.pending}
              </Badge>
            </p>
            <div className="h-2 bg-yellow-200 rounded-full" />
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              Approved
              <Badge variant="default" className="text-xs bg-green-600">
                {stats.approved}
              </Badge>
            </p>
            <div className="h-2 bg-green-200 rounded-full" />
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              Rejected
              <Badge variant="destructive" className="text-xs">
                {stats.rejected}
              </Badge>
            </p>
            <div className="h-2 bg-red-200 rounded-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
