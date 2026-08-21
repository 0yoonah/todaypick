import { NextResponse } from "next/server";

/** API 오류 응답은 항상 이 형태다. */
export type ApiErrorBody = { error: string };

export const AUTH_REQUIRED_MESSAGE = "인증이 필요합니다.";

function errorResponse(message: string, status: number) {
  return NextResponse.json<ApiErrorBody>({ error: message }, { status });
}

export function unauthorized() {
  return errorResponse(AUTH_REQUIRED_MESSAGE, 401);
}

export function badRequest(message: string) {
  return errorResponse(message, 400);
}

export function notFound(message: string) {
  return errorResponse(message, 404);
}

export function conflict(message: string) {
  return errorResponse(message, 409);
}

/**
 * 500 응답에는 고정 문구만 담는다.
 *
 * 원본 오류를 응답에 실으면 Supabase 제약 조건 이름이나 내부 스키마가 클라이언트로 나간다.
 * 진단에 필요한 내용은 서버 로그에만 남긴다.
 */
export function serverError(message: string, cause?: unknown) {
  if (cause !== undefined) {
    console.error(message, cause);
  }
  return errorResponse(message, 500);
}
