import Link from "next/link";
import { CONTACT_EMAIL, ROUTE_PATH } from "@/config/constants";

export default function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-[1080px] flex-col gap-3 px-5 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p>
          TodayPick은 비영리 개인 프로젝트입니다. 외부 글의 권리는 각 원
          출처에 있습니다.
        </p>
        <nav aria-label="서비스 정보">
          <ul className="flex flex-wrap gap-x-5 gap-y-1">
            <li>
              <Link
                href={ROUTE_PATH.SOURCES}
                className="inline-flex min-h-11 items-center hover:text-foreground sm:min-h-0"
              >
                출처 안내
              </Link>
            </li>
            <li>
              <Link
                href={ROUTE_PATH.PRIVACY}
                className="inline-flex min-h-11 items-center font-semibold text-foreground hover:text-primary sm:min-h-0"
              >
                개인정보처리방침
              </Link>
            </li>
            <li>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="inline-flex min-h-11 items-center hover:text-foreground sm:min-h-0"
              >
                문의
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
