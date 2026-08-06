import { Suspense } from "react";
import ProfileContainer from "@/components/profile/ProfileContainer";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfilePage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1080px] px-5 py-8 sm:px-8 sm:py-12">
        <Suspense
          fallback={
            <div className="space-y-6" aria-label="프로필을 불러오는 중">
              <Skeleton className="h-56 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-96 w-full rounded-xl" />
            </div>
          }
        >
          <ProfileContainer />
        </Suspense>
      </div>
    </main>
  );
}
