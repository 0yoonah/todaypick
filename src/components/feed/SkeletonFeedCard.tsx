import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export default function SkeletonFeedCard() {
  return (
    <Card className="h-full overflow-hidden border bg-card shadow-sm">
      {/* 스크랩 버튼 스켈레톤 - 우측 상단 */}
      <Skeleton className="absolute top-3 right-3 w-10 h-10 rounded-full z-20" />

      {/* 이미지 스켈레톤 */}
      <div className="relative aspect-[16/10] w-full overflow-hidden">
        <Skeleton className="w-full h-full" />
      </div>

      <CardHeader className="pb-3">
        <Skeleton className="h-6 w-3/4 mb-2" />
        <div className="flex items-center space-x-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-1" />
          <Skeleton className="h-4 w-20" />
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-2 mb-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>
        <Skeleton className="h-3 w-24" />
      </CardContent>
    </Card>
  );
}
