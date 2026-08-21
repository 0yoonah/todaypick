import { expect, it, vi } from "vitest";
import { GET } from "./route";
import { fakeSupabase, installSupabaseMock } from "@/test/fakeSupabase";

vi.mock("@/utils/supabase/server");

// 헬퍼가 동작하는지 확인하는 최소 예시다. 전체 경로는 #150에서 덮는다.
it("비로그인 요청은 401과 규약 문구를 준다", async () => {
  const { client } = fakeSupabase({ user: null });
  installSupabaseMock(client);

  const response = await GET();

  expect(response.status).toBe(401);
  expect(await response.json()).toEqual({ error: "인증이 필요합니다." });
});
