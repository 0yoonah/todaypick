import type { ReactNode } from "react";
import { CONTACT_EMAIL } from "@/config/constants";

/** 개인정보처리방침·이용약관처럼 번호 매긴 조항을 나열하는 정책 페이지의 섹션 */
export function PolicySection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="py-8 first:pt-0">
      <h2 className="text-xl font-bold text-foreground">{title}</h2>
      <div className="mt-4 space-y-3 text-base leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}

export function ContactLink() {
  return (
    <a
      href={`mailto:${CONTACT_EMAIL}`}
      className="font-semibold text-foreground underline underline-offset-4 hover:text-primary"
    >
      {CONTACT_EMAIL}
    </a>
  );
}
