import Link from "next/link";
import { ROUTE_PATH } from "@/config/constants";
import { LoginForm } from "@/components/auth/LoginForm";
import { Separator } from "@/components/ui/separator";

export default function LoginPage() {
  return (
    <main className="min-h-[calc(100dvh-4.25rem)] bg-background">
      <div className="mx-auto grid min-h-[calc(100dvh-4.25rem)] max-w-6xl items-start gap-12 px-4 pt-8 pb-[calc(2rem+env(safe-area-inset-bottom))] sm:px-6 lg:grid-cols-[1fr_28rem] lg:items-center lg:px-8 lg:py-10">
        <div className="hidden max-w-xl lg:block">
          <p className="mb-4 text-sm font-semibold text-primary">다시 만나 반가워요</p>
          <h1 className="text-5xl font-bold leading-tight tracking-[-0.045em]">
            오늘의 10분이
            <br />
            내일의 차이를 만듭니다.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            읽은 피드와 퀴즈 기록, 학습 흐름을 이어서 확인하세요.
          </p>
        </div>

        <section className="border-0 bg-transparent p-0 shadow-none sm:rounded-2xl sm:border sm:border-border/80 sm:bg-card sm:p-8 sm:shadow-xs">
          <div className="mb-6 sm:mb-7">
            <p className="text-sm font-semibold text-primary lg:hidden">TodayPick</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight">로그인</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              학습 기록을 이어서 쌓아보세요.
            </p>
          </div>

          <LoginForm />

          <div className="relative my-6 flex items-center">
            <Separator className="flex-1" />
            <span className="px-4 text-xs text-muted-foreground">또는</span>
            <Separator className="flex-1" />
          </div>

          <p className="text-center text-sm text-muted-foreground">
            계정이 없으신가요?{" "}
            <Link href={ROUTE_PATH.SIGNUP} className="font-semibold text-primary hover:underline">
              회원가입
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
