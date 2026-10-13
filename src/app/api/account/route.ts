import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { badRequest, serverError, unauthorized } from "@/utils/apiResponse";

const AVATAR_BUCKET = "avatars";
const DELETE_FAILED_MESSAGE =
  "회원 탈퇴를 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.";

/**
 * 본인 계정을 지운다. 순서가 중요하다.
 * 1. 비밀번호를 다시 확인한다.
 * 2. 프로필 이미지를 지운다. 계정을 먼저 지우면 세션이 무효가 되어 Storage RLS를 통과하지 못한다.
 * 3. delete_own_account가 auth.users를 지우고, 기록 테이블은 on delete cascade로 함께 지워진다.
 */
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  const password = typeof body?.password === "string" ? body.password : "";
  if (!password) return badRequest("비밀번호를 입력해 주세요.");

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email ?? "",
    password,
  });
  if (signInError) {
    return badRequest(
      signInError.status === 429
        ? "시도가 많습니다. 잠시 후 다시 시도해 주세요."
        : "비밀번호가 일치하지 않습니다."
    );
  }

  const avatars = supabase.storage.from(AVATAR_BUCKET);
  const { data: files, error: listError } = await avatars.list("", {
    search: user.id,
  });
  if (listError) return serverError(DELETE_FAILED_MESSAGE, listError);

  // search는 부분 일치라 u1 검색에 u10의 파일도 잡힌다. 저장 규칙(`{id}-{uuid}.{ext}`)으로 다시 거른다.
  const ownPaths = (files ?? [])
    .map((file) => file.name)
    .filter((name) => name.startsWith(`${user.id}-`));

  if (ownPaths.length > 0) {
    const { error: removeError } = await avatars.remove(ownPaths);
    if (removeError) return serverError(DELETE_FAILED_MESSAGE, removeError);

    // 계정 삭제가 실패해도 지운 파일을 가리키는 주소가 남지 않게 먼저 비운다.
    const { error: clearError } = await supabase
      .from("users")
      .update({ avatar_url: null })
      .eq("id", user.id);
    if (clearError) return serverError(DELETE_FAILED_MESSAGE, clearError);
  }

  const { error: deleteError } = await supabase.rpc("delete_own_account");
  if (deleteError) return serverError(DELETE_FAILED_MESSAGE, deleteError);

  // 계정이 이미 지워졌으므로 로그아웃 실패는 응답에 영향을 주지 않는다. 쿠키만 정리한다.
  await supabase.auth.signOut();

  return NextResponse.json({ deleted: true });
}
