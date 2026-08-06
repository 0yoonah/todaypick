"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiBookOpen, FiHelpCircle, FiHome, FiUser } from "react-icons/fi";
import { ROUTE_PATH } from "@/config/constants";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";

const HIDDEN_PATHS: string[] = [ROUTE_PATH.LOGIN, ROUTE_PATH.SIGNUP];

export default function MobileBottomNavigation() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  if (HIDDEN_PATHS.includes(pathname)) return null;

  const items = [
    {
      label: "오늘",
      href: ROUTE_PATH.HOME,
      icon: FiHome,
      isActive: pathname === ROUTE_PATH.HOME,
    },
    {
      label: "피드",
      href: ROUTE_PATH.FEEDS,
      icon: FiBookOpen,
      isActive: pathname === ROUTE_PATH.FEEDS,
    },
    {
      label: "CS",
      href: ROUTE_PATH.CS,
      icon: FiHelpCircle,
      isActive: pathname === ROUTE_PATH.CS,
    },
    {
      label: "프로필",
      href: user ? ROUTE_PATH.PROFILE : ROUTE_PATH.LOGIN,
      icon: FiUser,
      isActive: pathname === ROUTE_PATH.PROFILE,
    },
  ];

  return (
    <>
      <div
        className="h-[calc(3.5rem+env(safe-area-inset-bottom))] sm:hidden"
        aria-hidden
      />
      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden"
        aria-label="모바일 주요 메뉴"
      >
        <div className="mx-auto grid h-14 max-w-md grid-cols-3">
          {items.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.label}
                href={item.href}
                aria-current={item.isActive ? "page" : undefined}
                className={cn(
                  "flex min-h-11 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors",
                  item.isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="size-5" aria-hidden />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
