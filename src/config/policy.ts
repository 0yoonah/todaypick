/** 이용약관·개인정보처리방침 시행일. 가입 동의 기록의 약관 버전으로도 쓴다. 내용을 바꾸면 함께 올린다. */
export const POLICY_EFFECTIVE_DATE = "2026-10-13";

export const CONSENT_REQUIRED_MESSAGE =
  "만 14세 이상 확인과 약관 동의가 필요합니다.";

export function formatPolicyDate(date: string = POLICY_EFFECTIVE_DATE): string {
  const [year, month, day] = date.split("-").map(Number);
  return `${year}년 ${month}월 ${day}일`;
}
