import type { Metadata } from "next";
import type { ReactNode } from "react";
import { CONTACT_EMAIL } from "@/config/constants";

export const metadata: Metadata = {
  title: "개인정보처리방침 | TodayPick",
  description:
    "TodayPick이 수집하는 개인정보 항목과 이용 목적, 보관 기간, 처리 위탁과 삭제 요청 방법을 안내합니다.",
};

// 내용을 바꾸면 시행일도 함께 갱신한다.
const EFFECTIVE_DATE = "2026년 10월 13일";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="py-8 first:pt-0">
      <h2 className="text-xl font-bold text-foreground">{title}</h2>
      <div className="mt-4 space-y-3 text-base leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}

function ContactLink() {
  return (
    <a
      href={`mailto:${CONTACT_EMAIL}`}
      className="font-semibold text-foreground underline underline-offset-4 hover:text-primary"
    >
      {CONTACT_EMAIL}
    </a>
  );
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1080px] px-5 py-8 sm:px-8 sm:py-12">
        <div className="mb-10 max-w-2xl">
          <p className="mb-3 text-sm font-semibold text-primary">
            개인정보처리방침
          </p>
          <h1 className="text-3xl font-bold tracking-[-0.03em] text-foreground sm:text-4xl">
            개인정보처리방침
          </h1>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            TodayPick(이하 &lsquo;서비스&rsquo;)은 학습 기록 서비스를 제공하는
            데 필요한 최소한의 개인정보만 처리합니다. 시행일: {EFFECTIVE_DATE}
          </p>
        </div>

        <div className="max-w-2xl divide-y">
          <Section title="1. 처리하는 개인정보 항목">
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong className="font-semibold text-foreground">
                  회원가입 시 필수
                </strong>
                : 이메일, 비밀번호, 닉네임. 비밀번호는 인증 서비스가 암호화해
                저장하며 운영자도 볼 수 없습니다.
              </li>
              <li>
                <strong className="font-semibold text-foreground">
                  이용자가 선택해 입력
                </strong>
                : 프로필 이미지, 관심 분야, 하루 읽기 목표
              </li>
              <li>
                <strong className="font-semibold text-foreground">
                  서비스 이용 중 생성
                </strong>
                : 읽은 글 기록, 스크랩한 글과 명언, 퀴즈 답안, CS 지식 답변과
                점수, 날짜별 학습 활동, 작성한 글과 썸네일, 북마크한 게시글
              </li>
              <li>
                <strong className="font-semibold text-foreground">
                  자동으로 생성
                </strong>
                : 로그인 상태를 유지하는 세션 쿠키, 접속 시 호스팅 서비스에
                남는 IP 주소와 브라우저 정보 등 접속 기록
              </li>
            </ul>
          </Section>

          <Section title="2. 처리 목적">
            <ul className="list-disc space-y-2 pl-5">
              <li>회원 식별과 로그인 유지</li>
              <li>읽기 목표, 연속 학습일, 주간 리포트 등 학습 기록과 통계 제공</li>
              <li>작성한 글의 저장과 공개 게시글 표시</li>
              <li>문의와 삭제 요청 처리</li>
            </ul>
          </Section>

          <Section title="3. 보유 기간">
            <p>
              회원 탈퇴(계정 삭제)를 요청할 때까지 보관하며, 요청을 받으면 지체
              없이 파기합니다. 다만 읽은 글 기록은 최근 30일, 최대 100개까지만
              보관하고 기준을 넘는 기록은 매일 자동으로 삭제합니다.
            </p>
          </Section>

          <Section title="4. 제3자 제공">
            <p>
              개인정보를 제3자에게 제공하지 않습니다. 다만 이용자가 공개로 설정한
              게시글의 제목, 본문, 썸네일과 작성자 닉네임은 로그인하지 않은
              방문자를 포함해 누구나 볼 수 있습니다.
            </p>
          </Section>

          <Section title="5. 처리 위탁과 국외 이전">
            <p>서비스 운영을 위해 다음 업체에 개인정보 처리를 맡깁니다.</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong className="font-semibold text-foreground">
                  Supabase Inc.
                </strong>
                : 회원 인증, 데이터베이스, 프로필 이미지 저장. 데이터는 대한민국
                서울 리전에 저장됩니다.
              </li>
              <li>
                <strong className="font-semibold text-foreground">
                  Vercel Inc.
                </strong>
                : 웹 서비스 호스팅과 전송
              </li>
            </ul>
            <p>
              Vercel을 통한 호스팅 과정에서 요청을 처리하기 위해 다음과 같이
              개인정보가 국외로 이전됩니다.
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>이전받는 자: Vercel Inc. (privacy@vercel.com)</li>
              <li>이전 국가: 미국 등 Vercel이 운영하는 데이터센터 소재 국가</li>
              <li>
                이전 항목: 서비스 이용 시 전송되는 요청 정보(IP 주소, 브라우저
                정보, 로그인 세션)와 화면에 표시되는 회원 정보
              </li>
              <li>이전 시기와 방법: 서비스 이용 시 네트워크를 통해 전송</li>
              <li>보유 기간: 요청 처리 후 Vercel의 로그 보관 정책에 따름</li>
            </ul>
          </Section>

          <Section title="6. 파기 절차와 방법">
            <p>
              계정을 삭제하면 해당 계정에 연결된 학습 기록, 스크랩, 작성한 글,
              북마크가 데이터베이스에서 함께 삭제되며 프로필 이미지 파일도 함께
              지웁니다. 전자적 파일은 복구할 수 없는 방법으로 삭제합니다.
            </p>
          </Section>

          <Section title="7. 이용자의 권리와 행사 방법">
            <p>
              이용자는 언제든지 자신의 개인정보를 열람, 정정, 삭제하거나 처리
              정지를 요구할 수 있습니다. 프로필의 닉네임과 이미지, 관심 분야,
              읽기 목표는 프로필 화면에서 직접 고칠 수 있고, 작성한 글과 읽은 글
              기록도 직접 삭제할 수 있습니다.
            </p>
            <p>
              서비스 안에 회원 탈퇴 기능은 아직 없습니다. 계정 삭제를 원하시면
              가입한 이메일로 <ContactLink />에 요청해 주세요. 본인 확인 후
              지체 없이 처리합니다.
            </p>
          </Section>

          <Section title="8. 쿠키의 설치와 거부">
            <p>
              로그인 상태를 유지하기 위한 세션 쿠키만 사용하며 광고나 방문 분석
              목적의 쿠키는 사용하지 않습니다. 브라우저 설정에서 쿠키 저장을
              거부할 수 있지만 이 경우 로그인이 필요한 기능을 이용할 수 없습니다.
            </p>
          </Section>

          <Section title="9. 안전성 확보 조치">
            <ul className="list-disc space-y-2 pl-5">
              <li>모든 통신을 HTTPS로 암호화합니다.</li>
              <li>비밀번호는 인증 서비스에서 암호화해 저장합니다.</li>
              <li>
                데이터베이스 행 단위 접근 제어로 이용자는 본인 데이터에만 접근할
                수 있습니다.
              </li>
            </ul>
          </Section>

          <Section title="10. 개인정보 보호책임자">
            <p>
              개인정보 처리에 관한 문의, 불만, 피해 구제는 아래로 연락해 주세요.
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>보호책임자: TodayPick 운영자</li>
              <li>
                연락처: <ContactLink />
              </li>
            </ul>
            <p>
              개인정보 침해에 대한 신고나 상담은 개인정보침해신고센터(국번 없이
              118, privacy.kisa.or.kr)와 개인정보분쟁조정위원회(1833-6972,
              www.kopico.go.kr)에도 할 수 있습니다.
            </p>
          </Section>

          <Section title="11. 방침의 변경">
            <p>
              이 방침을 바꾸면 시행일과 함께 이 화면에 게시합니다. 현재 방침의
              시행일은 {EFFECTIVE_DATE}입니다.
            </p>
          </Section>
        </div>
      </div>
    </main>
  );
}
