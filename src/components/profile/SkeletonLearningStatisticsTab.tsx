import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function SkeletonLearningStatisticsTab() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-72 w-full rounded-xl" />
      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        {Array.from({ length: 2 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="p-4 sm:p-6">
              <Skeleton className="h-8 w-8 rounded mb-2" />
              <Skeleton className="h-6 w-16 mb-1" />
              <Skeleton className="h-4 w-12" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
