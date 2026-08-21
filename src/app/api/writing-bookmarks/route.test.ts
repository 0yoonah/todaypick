import { beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE, GET, POST } from "./route";
import { getRequest, jsonRequest } from "@/test/apiRequest";
import { fakeSupabase, installSupabaseMock } from "@/test/fakeSupabase";

vi.mock("@/utils/supabase/server");

const DENIED = {
  code: "42501",
  message: "permission denied for table writing_bookmarks",
};

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("GET /api/writing-bookmarks", () => {
  it("비로그인 요청은 401과 규약 문구를 준다", async () => {
    const { client } = fakeSupabase({ user: null });
    installSupabaseMock(client);

    const response = await GET();

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "인증이 필요합니다." });
  });

  it("북마크가 없으면 공개 게시글을 조회하지 않는다", async () => {
    const fake = fakeSupabase({
      user: { id: "u1" },
      from: { writing_bookmarks: { data: [] } },
    });
    installSupabaseMock(fake.client);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ drafts: [] });
    expect(fake.rpcCalls("get_public_writing_drafts")).toEqual([]);
  });

  it("북마크 순서대로 게시글을 붙이고 비공개가 된 글은 제외한다", async () => {
    const fake = fakeSupabase({
      user: { id: "u1" },
      from: {
        writing_bookmarks: {
          data: [
            { draft_id: "d2", created_at: "2026-08-21T00:00:00.000Z" },
            { draft_id: "사라진글", created_at: "2026-08-20T00:00:00.000Z" },
            { draft_id: "d1", created_at: "2026-08-19T00:00:00.000Z" },
          ],
        },
      },
      rpc: {
        get_public_writing_drafts: {
          data: [
            { id: "d1", title: "글 1" },
            { id: "d2", title: "글 2" },
          ],
        },
      },
    });
    installSupabaseMock(fake.client);

    const response = await GET();
    const body = await response.json();

    // 북마크 최신순을 따르고, 공개 목록에 없는 글은 빠진다.
    expect(body.drafts).toEqual([
      { id: "d2", title: "글 2" },
      { id: "d1", title: "글 1" },
    ]);
    expect(fake.calls("writing_bookmarks")[0].filters).toEqual([
      ["eq", "user_id", "u1"],
    ]);
  });

  it("북마크 조회 오류는 500을 주고 내부 문구를 담지 않는다", async () => {
    const { client } = fakeSupabase({
      user: { id: "u1" },
      from: { writing_bookmarks: { error: DENIED } },
    });
    installSupabaseMock(client);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "북마크한 게시글을 불러오지 못했습니다." });
    expect(JSON.stringify(body)).not.toContain("permission denied");
  });

  it("공개 게시글 조회 오류도 500을 준다", async () => {
    const { client } = fakeSupabase({
      user: { id: "u1" },
      from: { writing_bookmarks: { data: [{ draft_id: "d1" }] } },
      rpc: { get_public_writing_drafts: { error: DENIED } },
    });
    installSupabaseMock(client);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(JSON.stringify(body)).not.toContain("permission denied");
  });
});

describe("POST /api/writing-bookmarks", () => {
  it("비로그인 요청은 401을 준다", async () => {
    const { client } = fakeSupabase({ user: null });
    installSupabaseMock(client);

    const response = await POST(
      jsonRequest("POST", "/api/writing-bookmarks", { draft_id: "d1" })
    );

    expect(response.status).toBe(401);
  });

  it("게시글 ID가 없으면 400을 준다", async () => {
    const { client } = fakeSupabase({ user: { id: "u1" } });
    installSupabaseMock(client);

    const response = await POST(
      jsonRequest("POST", "/api/writing-bookmarks", {})
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "게시글 ID가 필요합니다." });
  });

  it("공개 게시글이 아니면 404를 주고 북마크를 만들지 않는다", async () => {
    const fake = fakeSupabase({
      user: { id: "u1" },
      rpc: { get_public_writing_drafts: { data: [] } },
    });
    installSupabaseMock(fake.client);

    const response = await POST(
      jsonRequest("POST", "/api/writing-bookmarks", { draft_id: "비공개글" })
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: "공개 게시글을 찾을 수 없습니다.",
    });
    expect(fake.calls("writing_bookmarks")).toEqual([]);
  });

  it("공개 게시글 조회가 실패해도 404로 막는다", async () => {
    const fake = fakeSupabase({
      user: { id: "u1" },
      rpc: { get_public_writing_drafts: { error: DENIED } },
    });
    installSupabaseMock(fake.client);

    const response = await POST(
      jsonRequest("POST", "/api/writing-bookmarks", { draft_id: "d1" })
    );

    expect(response.status).toBe(404);
    expect(fake.calls("writing_bookmarks")).toEqual([]);
  });

  it("중복 요청을 무시하는 옵션으로 본인 북마크를 저장한다", async () => {
    const fake = fakeSupabase({
      user: { id: "u1" },
      from: { writing_bookmarks: { data: null } },
      rpc: { get_public_writing_drafts: { data: [{ id: "d1" }] } },
    });
    installSupabaseMock(fake.client);

    const response = await POST(
      jsonRequest("POST", "/api/writing-bookmarks", { draft_id: "d1" })
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ is_bookmarked: true });

    const call = fake.calls("writing_bookmarks")[0];
    expect(call.op).toBe("upsert");
    expect(call.payload).toEqual({ user_id: "u1", draft_id: "d1" });
    expect(call.options).toEqual({
      onConflict: "user_id,draft_id",
      ignoreDuplicates: true,
    });
  });

  it("저장 오류는 500을 주고 내부 문구를 담지 않는다", async () => {
    const { client } = fakeSupabase({
      user: { id: "u1" },
      from: { writing_bookmarks: { error: DENIED } },
      rpc: { get_public_writing_drafts: { data: [{ id: "d1" }] } },
    });
    installSupabaseMock(client);

    const response = await POST(
      jsonRequest("POST", "/api/writing-bookmarks", { draft_id: "d1" })
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "북마크를 저장하지 못했습니다." });
    expect(JSON.stringify(body)).not.toContain("permission denied");
  });
});

describe("DELETE /api/writing-bookmarks", () => {
  it("비로그인 요청은 401을 준다", async () => {
    const { client } = fakeSupabase({ user: null });
    installSupabaseMock(client);

    const response = await DELETE(
      getRequest("/api/writing-bookmarks?draftId=d1")
    );

    expect(response.status).toBe(401);
  });

  it("게시글 ID가 없으면 400을 준다", async () => {
    const { client } = fakeSupabase({ user: { id: "u1" } });
    installSupabaseMock(client);

    const response = await DELETE(getRequest("/api/writing-bookmarks"));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "게시글 ID가 필요합니다." });
  });

  it("본인 북마크만 대상으로 해제한다", async () => {
    const fake = fakeSupabase({
      user: { id: "u1" },
      from: { writing_bookmarks: { data: null } },
    });
    installSupabaseMock(fake.client);

    const response = await DELETE(
      getRequest("/api/writing-bookmarks?draftId=d1")
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ is_bookmarked: false });

    const call = fake.calls("writing_bookmarks")[0];
    expect(call.op).toBe("delete");
    expect(call.filters).toEqual([
      ["eq", "user_id", "u1"],
      ["eq", "draft_id", "d1"],
    ]);
  });

  it("해제 오류는 500을 주고 내부 문구를 담지 않는다", async () => {
    const { client } = fakeSupabase({
      user: { id: "u1" },
      from: { writing_bookmarks: { error: DENIED } },
    });
    installSupabaseMock(client);

    const response = await DELETE(
      getRequest("/api/writing-bookmarks?draftId=d1")
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "북마크를 해제하지 못했습니다." });
    expect(JSON.stringify(body)).not.toContain("permission denied");
  });
});
