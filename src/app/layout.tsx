import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Header from "@/components/Header";
import MobileBottomNavigation from "@/components/MobileBottomNavigation";
import { AuthProvider } from "@/providers/AuthProvider";
import { QueryProvider } from "@/providers/QueryProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TodayPick - 하루 10분, IT 전문가로 성장하는 습관",
  description: "IT 최신 뉴스부터 상식 퀴즈까지 오늘 하루 10분 알아보기",
  applicationName: "TodayPick",
};

export const viewport: Viewport = {
  themeColor: "#4263C7",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" data-scroll-behavior="smooth">
      <body className={inter.className}>
        <QueryProvider>
          <AuthProvider>
            <Header />
            {children}
            <MobileBottomNavigation />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
