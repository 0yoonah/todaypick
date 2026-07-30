import Link from "next/link";
import { ROUTE_PATH } from "@/config/constants";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { Separator } from "@/components/ui/separator";

export default function SignUpPage() {
  return (
    <main className="min-h-[calc(100vh-4.25rem)] bg-background">
      <div className="mx-auto grid min-h-[calc(100vh-4.25rem)] max-w-6xl items-center gap-12 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_28rem] lg:px-8">
        <div className="hidden max-w-xl lg:block">
          <p className="mb-4 text-sm font-semibold text-primary">오늘부터 시작해요</p>
          <h1 className="text-5xl font-bold leading-tight tracking-[-0.045em]">
            많이보다 꾸준히,
            <br />
            매일 하나씩.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            관심 있는 IT 소식과 짧은 학습을 나만의 기록으로 남겨보세요.
          </p>
        </div>

        <section className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs sm:p-8">
          <div className="mb-7">
            <p className="text-sm font-semibold text-primary lg:hidden">TodayPick</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight">회원가입</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              하루 10분 학습을 기록할 계정을 만드세요.
            </p>
          </div>

          <SignUpForm />

          <div className="relative my-6 flex items-center">
            <Separator className="flex-1" />
            <span className="px-4 text-xs text-muted-foreground">또는</span>
            <Separator className="flex-1" />
          </div>

          <p className="text-center text-sm text-muted-foreground">
          이미 계정이 있으신가요?{" "}
          <Link href={ROUTE_PATH.LOGIN} className="font-semibold text-primary hover:underline">
            로그인
          </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
