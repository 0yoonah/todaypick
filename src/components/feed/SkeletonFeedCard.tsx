import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

interface SkeletonFeedCardProps {
  showActions?: boolean;
}

export default function SkeletonFeedCard({
  showActions = true,
}: SkeletonFeedCardProps) {
  return (
    <Card className="relative h-full overflow-hidden border-0 bg-transparent py-0 shadow-none">
      {showActions && (
        <div className="absolute right-3 top-3 z-20 flex gap-2">
          <Skeleton className="size-11 rounded-full sm:size-9" />
          <Skeleton className="size-11 rounded-full sm:size-9" />
        </div>
      )}

      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg">
        <Skeleton className="h-full w-full" />
      </div>

      <CardHeader className="px-0 pt-4 pb-2">
        <div className="mb-2 flex items-center gap-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-1" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-3/4" />
        </div>
      </CardHeader>

      <CardContent className="px-0 pt-0">
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </CardContent>
    </Card>
  );
}
