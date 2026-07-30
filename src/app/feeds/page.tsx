import { Suspense } from "react";
import CategoryByFeed from "@/components/feed/CategoryByFeed";

export default function FeedsPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1080px] px-5 py-8 sm:px-8 sm:py-12">
        <Suspense>
          <CategoryByFeed />
        </Suspense>
      </div>
    </main>
  );
}
