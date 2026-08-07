import type { CsCategory } from "@/types/cs";

export interface GlossaryTerm {
  id: string;
  /** 표제어 */
  term: string;
  /** 목록에 노출하는 한 문장 요약 */
  definition: string;
  /** 상세 화면에서 보여주는 사전적 설명. 개념, 동작 방식, 쓰임새와 주의점을 담는다. */
  detail: string;
  /** 영문 표기나 약어처럼 같은 용어를 가리키는 다른 이름. 검색에 사용한다. */
  aliases: string[];
  /** CS 지식 문항과 같은 분류를 사용한다. */
  category: CsCategory;
  /** 함께 보면 좋은 다른 용어의 id */
  related: string[];
  created_at: string;
}
