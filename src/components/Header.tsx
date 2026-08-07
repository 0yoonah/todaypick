"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useActionState, useCallback, useEffect, startTransition } from "react";
import { FiLogOut, FiUser } from "react-icons/fi";
import { logout } from "@/app/login/action";
import { ROUTE_PATH } from "@/config/constants";
import { useAuthStore } from "@/stores/authStore";
import { formatAuthError } from "@/utils/authUtils";
import { getInitials } from "@/utils/profileUtils";
import { useProfileQuery } from "@/hooks/useProfileQuery";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Header() {
  const pathname = usePathname();
  const { user, setUser } = useAuthStore();
  const { data: userProfile } = useProfileQuery();
  const [state, formAction, isPending] = useActionState(logout, { error: "" });

  useEffect(() => {
    if (!isPending && !state.error) {
      setUser(null);
    }

    if (state.error) {
      alert(formatAuthError("Failed to logout"));
    }
  }, [isPending, state, setUser]);

  const handleLogOut = useCallback(() => {
    startTransition(() => {
      formAction();
    });
  }, [formAction]);

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-[68px] max-w-[1080px] items-center gap-4 px-5 sm:gap-10 sm:px-8">
        <Link
          href={ROUTE_PATH.HOME}
          className="shrink-0"
          aria-label="TodayPick 홈"
        >
          <Image
            src="/todaypick-logo.svg"
            alt="TodayPick"
            width={156}
            height={36}
            priority
            className="h-8 w-auto sm:h-9"
          />
        </Link>

        <nav className="hidden items-center gap-6 sm:flex" aria-label="주요 메뉴">
          <Link
            href={ROUTE_PATH.HOME}
            aria-current={
              pathname === ROUTE_PATH.HOME ? "page" : undefined
            }
            className={cn(
              "text-base transition-colors",
              pathname === ROUTE_PATH.HOME
                ? "font-bold text-primary"
                : "font-semibold text-muted-foreground hover:text-foreground"
            )}
          >
            오늘의 학습
          </Link>
          <Link
            href={ROUTE_PATH.FEEDS}
            aria-current={
              pathname === ROUTE_PATH.FEEDS ? "page" : undefined
            }
            className={cn(
              "text-base transition-colors",
              pathname === ROUTE_PATH.FEEDS
                ? "font-bold text-primary"
                : "font-semibold text-muted-foreground hover:text-foreground"
            )}
          >
            피드
          </Link>
          <Link
            href={ROUTE_PATH.CS}
            aria-current={
              pathname === ROUTE_PATH.CS ? "page" : undefined
            }
            className={cn(
              "text-base transition-colors",
              pathname === ROUTE_PATH.CS
                ? "font-bold text-primary"
                : "font-semibold text-muted-foreground hover:text-foreground"
            )}
          >
            CS 지식
          </Link>
          <Link
            href={ROUTE_PATH.GLOSSARY}
            aria-current={
              pathname === ROUTE_PATH.GLOSSARY ? "page" : undefined
            }
            className={cn(
              "text-base transition-colors",
              pathname === ROUTE_PATH.GLOSSARY
                ? "font-bold text-primary"
                : "font-semibold text-muted-foreground hover:text-foreground"
            )}
          >
            용어사전
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full cursor-pointer"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={userProfile?.avatar_url || undefined}
                      alt="프로필"
                    />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {getInitials(userProfile?.nickname || "")}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-56 border bg-popover shadow-md"
                align="end"
                forceMount
              >
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {userProfile?.nickname || "사용자"}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {userProfile?.email || user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link
                    href={ROUTE_PATH.PROFILE}
                    className="flex items-center cursor-pointer"
                  >
                    <FiUser className="mr-2 h-4 w-4" />
                    <span>내 프로필</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogOut}
                  className="text-destructive cursor-pointer"
                  disabled={isPending}
                >
                  <FiLogOut className="mr-2 h-4 w-4" />
                  <span>{isPending ? "로그아웃 중" : "로그아웃"}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="h-11 sm:hidden">
                <Link href={ROUTE_PATH.LOGIN}>로그인</Link>
              </Button>
              <div className="hidden items-center gap-2 sm:flex">
                <Button asChild variant="ghost">
                  <Link href={ROUTE_PATH.LOGIN}>
                    로그인
                  </Link>
                </Button>
                <Button asChild>
                  <Link href={ROUTE_PATH.SIGNUP}>
                    회원가입
                  </Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
