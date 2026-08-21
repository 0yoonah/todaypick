import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";
import { getRequest } from "@/test/apiRequest";
import { fakeSupabase, installSupabaseMock } from "@/test/fakeSupabase";

vi.mock("@/utils/supabase/server");

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

// #149에서 401/404 분기를 헬퍼로 바꿨다. 전체 경로는 #152에서 다룬다.
describe("GET /api/writing-drafts", () => {
  it("본인 글만 조회하는 요청에 비로그인이면 401을 준다", async () => {
    const { client } = fakeSupabase({ user: null });
    installSupabaseMock(client);

    const response = await GET(
      getRequest("/api/writing-drafts?id=d1&scope=mine")
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "인증이 필요합니다." });
  });

  it("공개 게시글이 없으면 404를 준다", async () => {
    const { client } = fakeSupabase({
      user: null,
      rpc: { get_public_writing_drafts: { data: [] } },
    });
    installSupabaseMock(client);

    const response = await GET(getRequest("/api/writing-drafts?id=d1"));

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: "게시글을 찾을 수 없습니다.",
    });
  });
});
