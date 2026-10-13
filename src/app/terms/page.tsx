import type { Metadata } from "next";
import { formatPolicyDate } from "@/config/policy";
import Link from "next/link";
import {
  ContactLink,
  PolicySection as Section,
} from "@/components/policy/PolicySection";
import { ROUTE_PATH } from "@/config/constants";

export const metadata: Metadata = {
  title: "이용약관 | TodayPick",
  description:
    "TodayPick 이용 조건, 게시글의 권리와 금지 행위, 운영자 조치와 서비스 중단·면책 기준을 안내합니다.",
};

// 내용을 바꾸면 시행일도 함께 갱신한다.
const EFFECTIVE_DATE = formatPolicyDate();

const linkClassName =
  "font-semibold text-foreground underline underline-offset-4 hover:text-primary";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1080px] px-5 py-8 sm:px-8 sm:py-12">
        <div className="mb-10 max-w-2xl">
          <p className="mb-3 text-sm font-semibold text-primary">이용약관</p>
          <h1 className="text-3xl font-bold tracking-[-0.03em] text-foreground sm:text-4xl">
            이용약관
          </h1>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            TodayPick(이하 &lsquo;서비스&rsquo;)을 이용하는 데 필요한 기본
            조건입니다. 서비스를 이용하면 이 약관에 동의한 것으로 봅니다.
            시행일: {EFFECTIVE_DATE}
          </p>
        </div>

        <div className="max-w-2xl divide-y">
          <Section title="1. 서비스 성격">
            <p>
              서비스는 IT 콘텐츠를 읽고 기록하며 학습 습관을 만드는 비영리 개인
              프로젝트입니다. 이용료를 받지 않으며 광고를 싣지 않습니다.
            </p>
            <p>
              피드의 기사와 블로그 글은 각 원 출처가 공개한 RSS로 모은 것으로,
              서비스는 제목과 설명 일부를 보여 주고 원문으로 안내합니다. 글의
              권리는 원 출처에 있으며 자세한 기준은{" "}
              <Link href={ROUTE_PATH.SOURCES} className={linkClassName}>
                출처 안내
              </Link>
              에서 확인할 수 있습니다.
            </p>
          </Section>

          <Section title="2. 회원 계정">
            <ul className="list-disc space-y-2 pl-5">
              <li>
                이메일과 비밀번호로 가입하며, 계정 정보는 본인이 안전하게
                관리해야 합니다.
              </li>
              <li>다른 사람의 이메일로 가입하거나 계정을 넘겨주지 않습니다.</li>
              <li>
                회원 탈퇴는 프로필 화면에서 비밀번호를 확인한 뒤 직접 할 수
                있으며, 탈퇴하면 계정과 기록이 즉시 삭제됩니다. 개인정보 처리는{" "}
                <Link href={ROUTE_PATH.PRIVACY} className={linkClassName}>
                  개인정보처리방침
                </Link>
                을 따릅니다.
              </li>
            </ul>
          </Section>

          <Section title="3. 게시글의 권리">
            <ul className="list-disc space-y-2 pl-5">
              <li>
                이용자가 작성한 글과 썸네일의 저작권은 작성자에게 있습니다.
              </li>
              <li>
                서비스는 작성자가 공개로 설정한 글을 게시글 목록과 상세 화면에
                보여 주는 데 필요한 범위에서만 이용합니다. 공개 글은 로그인하지
                않은 방문자도 볼 수 있습니다.
              </li>
              <li>
                작성자는 언제든 글을 수정하거나 비공개로 바꾸거나 삭제할 수
                있습니다.
              </li>
              <li>
                다른 글을 인용할 때는 출처를 밝히고 필요한 만큼만 인용해야
                합니다. 원문 전체나 대부분을 옮겨 적지 않습니다.
              </li>
            </ul>
          </Section>

          <Section title="4. 금지 행위">
            <p>다음에 해당하는 글을 올리거나 행위를 해서는 안 됩니다.</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>다른 사람의 저작물을 허락 없이 옮겨 게시하는 행위</li>
              <li>다른 사람의 개인정보를 노출하는 행위</li>
              <li>
                욕설, 혐오, 차별, 음란물 등 다른 이용자에게 불쾌감을 주는 내용
              </li>
              <li>광고, 홍보, 같은 내용의 반복 게시</li>
              <li>법령을 위반하거나 범죄와 관련된 내용</li>
              <li>서비스의 정상적인 운영을 방해하는 행위</li>
            </ul>
          </Section>

          <Section title="5. 운영자의 조치">
            <ul className="list-disc space-y-2 pl-5">
              <li>
                금지 행위에 해당하는 공개 글은 사전 통지 없이 비공개로 바꾸거나
                삭제할 수 있습니다.
              </li>
              <li>
                같은 행위를 반복하면 계정 이용을 제한하거나 계정을 삭제할 수
                있습니다.
              </li>
              <li>
                권리 침해를 신고하려면 해당 글의 주소와 사유를 <ContactLink />
                로 보내 주세요. 확인하는 대로 조치합니다.
              </li>
            </ul>
          </Section>

          <Section title="6. 서비스의 변경과 중단">
            <p>
              서비스는 무료로 제공하는 개인 프로젝트이므로 기능이 바뀌거나 예고
              없이 일시 중단되거나 종료될 수 있습니다. 서비스를 종료할 때는
              가능한 한 미리 화면에 알립니다.
            </p>
          </Section>

          <Section title="7. 책임의 한계">
            <ul className="list-disc space-y-2 pl-5">
              <li>
                피드의 외부 글 내용과 정확성에 대한 책임은 원 출처에 있습니다.
              </li>
              <li>
                퀴즈, CS 지식 채점, 용어 설명은 학습을 돕기 위한 참고 자료이며
                정확성을 보증하지 않습니다.
              </li>
              <li>
                이용자가 작성한 글에 대한 책임은 작성자에게 있습니다.
              </li>
              <li>
                운영자의 고의나 중대한 과실이 없는 한 서비스 이용으로 생긴
                손해에 대해 책임지지 않습니다.
              </li>
            </ul>
          </Section>

          <Section title="8. 약관의 변경과 문의">
            <p>
              약관을 바꾸면 시행일과 함께 이 화면에 게시합니다. 현재 약관의
              시행일은 {EFFECTIVE_DATE}입니다.
            </p>
            <p>
              약관에 관한 문의는 <ContactLink />로 보내 주세요.
            </p>
          </Section>
        </div>
      </div>
    </main>
  );
}
