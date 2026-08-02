import Link from "next/link";

const REQUEST_URL =
  "https://github.com/0yoonah/todaypick/issues/new?title=%EC%BD%98%ED%85%90%EC%B8%A0+%EC%82%AD%EC%A0%9C%C2%B7%EC%88%98%EC%A0%95+%EC%9A%94%EC%B2%AD";

export default function SiteFooter() {
  return (
    <footer className="border-t bg-muted/30 pb-6 pt-8 sm:pb-8">
      <div className="mx-auto max-w-[1080px] px-5 text-sm leading-relaxed text-muted-foreground sm:px-8">
        <p className="font-semibold text-foreground">콘텐츠 및 권리 안내</p>
        <p className="mt-2 max-w-3xl">
          TodayPick은 비영리 개인 포트폴리오이며, RSS의 짧은 설명과 원문
          링크를 제공하는 콘텐츠 탐색 서비스입니다. 콘텐츠의 권리는 각 원
          출처에 있고 TodayPick은 원문 전체나 외부 이미지를 저장·대체하지
          않습니다.
        </p>
        <Link
          href={REQUEST_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex min-h-11 items-center font-semibold text-foreground underline underline-offset-4 hover:text-primary"
        >
          콘텐츠 삭제·수정 요청 접수
          <span className="sr-only">(새 창)</span>
        </Link>
      </div>
    </footer>
  );
}
