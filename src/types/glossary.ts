import type { CsCategory } from "@/types/cs";

export interface GlossaryTerm {
  id: string;
  /** 표제어 */
  term: string;
  /** 한두 문장으로 정리한 정의 */
  definition: string;
  /** 영문 표기나 약어처럼 같은 용어를 가리키는 다른 이름. 검색에 사용한다. */
  aliases: string[];
  /** CS 지식 문항과 같은 분류를 사용한다. */
  category: CsCategory;
  /** 함께 보면 좋은 다른 용어의 id */
  related: string[];
  created_at: string;
}
