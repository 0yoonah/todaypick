import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface SkeletonQuoteCardProps {
  compact?: boolean;
}

export default function SkeletonQuoteCard({
  compact = false,
}: SkeletonQuoteCardProps) {
  return (
    <Card className="relative mx-auto w-full overflow-hidden border bg-card shadow-sm">
      <div className={compact ? "absolute right-4 top-4 z-10" : "absolute right-6 top-6 z-10"}>
        <Skeleton className={compact ? "size-8 rounded-full" : "size-10 rounded-full"} />
      </div>

      <CardContent className="relative p-5 sm:p-6">
        <div
          className={
            compact
              ? "flex flex-col justify-center pr-10"
              : "flex min-h-40 flex-col justify-center sm:min-h-56"
          }
        >
          <div className={compact ? "space-y-3" : "mb-8 space-y-3"}>
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-3/4 mx-auto" />
            {!compact && <Skeleton className="h-6 w-1/2 mx-auto" />}
          </div>

          {!compact && (
            <div className="flex items-center justify-center space-x-3">
              <Skeleton className="size-10 rounded-full" />
              <Skeleton className="h-5 w-32" />
            </div>
          )}
        </div>

        {!compact && <div className="absolute bottom-6 right-6">
          <Skeleton className="h-10 w-24 rounded-lg" />
        </div>}
      </CardContent>
    </Card>
  );
}
