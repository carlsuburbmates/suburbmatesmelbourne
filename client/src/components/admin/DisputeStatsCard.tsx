import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export interface DisputeStats {
  pending: number;
  resolved: number;
  escalated: number;
  total: number;
}

interface DisputeStatsCardProps {
  stats: DisputeStats;
}

export function DisputeStatsCard({ stats }: DisputeStatsCardProps) {
  const pendingPercentage = (stats.pending / Math.max(stats.total, 1)) * 100;
  const resolvedPercentage = (stats.resolved / Math.max(stats.total, 1)) * 100;
  const escalatedPercentage = (stats.escalated / Math.max(stats.total, 1)) * 100;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Pending */}
      <Card className="border-l-4 border-l-yellow-500">
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Pending
              </span>
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                {stats.pending}
              </Badge>
            </div>
            <Progress value={pendingPercentage} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {((stats.pending / Math.max(stats.total, 1)) * 100).toFixed(0)}% of total
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Resolved */}
      <Card className="border-l-4 border-l-green-500">
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Resolved
              </span>
              <Badge variant="outline" className="bg-green-50 text-green-700">
                {stats.resolved}
              </Badge>
            </div>
            <Progress value={resolvedPercentage} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {((stats.resolved / Math.max(stats.total, 1)) * 100).toFixed(0)}% of total
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Escalated */}
      <Card className="border-l-4 border-l-red-500">
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Escalated
              </span>
              <Badge variant="outline" className="bg-red-50 text-red-700">
                {stats.escalated}
              </Badge>
            </div>
            <Progress value={escalatedPercentage} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {((stats.escalated / Math.max(stats.total, 1)) * 100).toFixed(0)}% of total
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Total */}
      <Card className="border-l-4 border-l-emerald-500">
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Total
              </span>
              <Badge
                variant="outline"
                className="bg-emerald-50 text-emerald-700"
              >
                {stats.total}
              </Badge>
            </div>
            <Progress value={100} className="h-2" />
            <p className="text-xs text-muted-foreground">
              All disputes tracked
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
