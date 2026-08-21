import { beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE, GET, POST, PUT } from "./route";
import { getRequest, jsonRequest } from "@/test/apiRequest";
import { fakeSupabase, installSupabaseMock } from "@/test/fakeSupabase";
import { MAX_DRAFT_TITLE_LENGTH } from "@/utils/writingUtils";

vi.mock("@/utils/supabase/server");

const DENIED = {
  code: "42501",
  message: "permission denied for table writing_drafts",
};
const NO_ROWS = { code: "PGRST116", message: "no rows returned" };
const OWNER_FILTERS = [
  ["eq", "id", "d1"],
  ["eq", "user_id", "u1"],
];

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

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

  it("본인 글 조회에 id가 없으면 400을 준다", async () => {
    const { client } = fakeSupabase({ user: { id: "u1" } });
    installSupabaseMock(client);

    const response = await GET(getRequest("/api/writing-drafts?scope=mine"));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "조회할 글이 필요합니다." });
  });

  it("잘못된 관심 분야는 400을 준다", async () => {
    const { client } = fakeSupabase({ user: { id: "u1" } });
    installSupabaseMock(client);

    const response = await GET(
      getRequest("/api/writing-drafts?scope=public&interest=없는분야")
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "유효한 관심 분야가 필요합니다.",
    });
  });

  it("잘못된 페이지 값은 의도한 검증 문구로 400을 준다", async () => {
    const { client } = fakeSupabase({ user: { id: "u1" } });
    installSupabaseMock(client);

    const response = await GET(
      getRequest("/api/writing-drafts?scope=public&page=0")
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "page는 1 이상의 정수여야 합니다.",
    });
  });

  it("공개 목록을 최신순으로 정렬하고 관심 분야로 걸러 페이지를 나눈다", async () => {
    const { client } = fakeSupabase({
      user: null,
      rpc: {
        get_public_writing_drafts: {
          data: [
            { id: "d1", updated_at: "2026-08-19T00:00:00.000Z", tags: ["frontend"] },
            { id: "d2", updated_at: "2026-08-21T00:00:00.000Z", tags: ["frontend"] },
            { id: "d3", updated_at: "2026-08-20T00:00:00.000Z", tags: ["backend"] },
          ],
        },
      },
    });
    installSupabaseMock(client);

    const response = await GET(
      getRequest(
        "/api/writing-drafts?scope=public&interest=frontend&page=1&limit=1"
      )
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      drafts: [
        { id: "d2", updated_at: "2026-08-21T00:00:00.000Z", tags: ["frontend"] },
      ],
      totalCount: 2,
      totalPages: 2,
      currentPage: 1,
    });
  });

  it("공개 글 단건은 rpc 결과를 그대로 준다", async () => {
    const fake = fakeSupabase({
      user: null,
      rpc: { get_public_writing_drafts: { data: [{ id: "d1", title: "글" }] } },
    });
    installSupabaseMock(fake.client);

    const response = await GET(getRequest("/api/writing-drafts?id=d1"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ draft: { id: "d1", title: "글" } });
    expect(fake.rpcCalls("get_public_writing_drafts")).toEqual([
      { p_id: "d1" },
    ]);
  });

  it("본인 글 단건은 소유자 조건을 함께 걸어 조회한다", async () => {
    const fake = fakeSupabase({
      user: { id: "u1" },
      from: { writing_drafts: { data: [{ id: "d1", title: "내 글" }] } },
    });
    installSupabaseMock(fake.client);

    const response = await GET(
      getRequest("/api/writing-drafts?id=d1&scope=mine")
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      draft: { id: "d1", title: "내 글" },
    });
    expect(fake.calls("writing_drafts")[0].filters).toEqual(OWNER_FILTERS);
  });

  it("남의 글을 본인 글로 조회하면 404를 준다", async () => {
    const { client } = fakeSupabase({
      user: { id: "u1" },
      from: { writing_drafts: { error: NO_ROWS } },
    });
    installSupabaseMock(client);

    const response = await GET(
      getRequest("/api/writing-drafts?id=d1&scope=mine")
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: "게시글을 찾을 수 없습니다.",
    });
  });

  it("로그인 사용자의 목록은 본인 글만 조회한다", async () => {
    const fake = fakeSupabase({
      user: { id: "u1" },
      from: { writing_drafts: { data: [] } },
    });
    installSupabaseMock(fake.client);

    await GET(getRequest("/api/writing-drafts"));

    expect(fake.calls("writing_drafts")[0].filters).toEqual([
      ["eq", "user_id", "u1"],
    ]);
  });

  it("비로그인 목록은 공개 글만 조회한다", async () => {
    const fake = fakeSupabase({
      user: null,
      from: { writing_drafts: { data: [] } },
    });
    installSupabaseMock(fake.client);

    await GET(getRequest("/api/writing-drafts"));

    expect(fake.calls("writing_drafts")[0].filters).toEqual([
      ["eq", "visibility", "public"],
    ]);
  });

  it("공개 게시글 조회 오류는 500을 주고 내부 문구를 담지 않는다", async () => {
    const { client } = fakeSupabase({
      user: null,
      rpc: { get_public_writing_drafts: { error: DENIED } },
    });
    installSupabaseMock(client);

    const response = await GET(getRequest("/api/writing-drafts?scope=public"));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "공개 게시글을 불러오지 못했습니다." });
    expect(JSON.stringify(body)).not.toContain("permission denied");
  });

  it("목록 조회 오류는 500을 주고 내부 문구를 담지 않는다", async () => {
    const { client } = fakeSupabase({
      user: { id: "u1" },
      from: { writing_drafts: { error: DENIED } },
    });
    installSupabaseMock(client);

    const response = await GET(getRequest("/api/writing-drafts"));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "글 초안을 불러오지 못했습니다." });
    expect(JSON.stringify(body)).not.toContain("permission denied");
  });
});

describe("POST /api/writing-drafts", () => {
  it("비로그인 요청은 401을 준다", async () => {
    const { client } = fakeSupabase({ user: null });
    installSupabaseMock(client);

    const response = await POST(
      jsonRequest("POST", "/api/writing-drafts", { title: "제목" })
    );

    expect(response.status).toBe(401);
  });

  it("제한을 넘는 제목은 400을 준다", async () => {
    const { client } = fakeSupabase({ user: { id: "u1" } });
    installSupabaseMock(client);

    const response = await POST(
      jsonRequest("POST", "/api/writing-drafts", {
        title: "가".repeat(MAX_DRAFT_TITLE_LENGTH + 1),
        content: "본문",
      })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "글 초안 입력이 올바르지 않습니다.",
    });
  });

  it("작성자를 서버에서 붙여 저장한다", async () => {
    const saved = { id: "d1", title: "제목" };
    const fake = fakeSupabase({
      user: { id: "u1" },
      from: { writing_drafts: { data: [saved] } },
    });
    installSupabaseMock(fake.client);

    const response = await POST(
      jsonRequest("POST", "/api/writing-drafts", {
        title: "제목",
        content: "본문",
        tags: ["frontend"],
        visibility: "private",
        // 클라이언트가 보낸 user_id는 무시된다.
        user_id: "남의id",
      })
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual(saved);

    const call = fake.calls("writing_drafts")[0];
    expect(call.op).toBe("insert");
    expect(call.payload).toMatchObject({
      user_id: "u1",
      title: "제목",
      content: "본문",
      tags: ["frontend"],
      visibility: "private",
    });
  });

  it("저장 오류는 500을 주고 내부 문구를 담지 않는다", async () => {
    const { client } = fakeSupabase({
      user: { id: "u1" },
      from: { writing_drafts: { error: DENIED } },
    });
    installSupabaseMock(client);

    const response = await POST(
      jsonRequest("POST", "/api/writing-drafts", {
        title: "제목",
        content: "본문",
      })
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "글 초안을 만들지 못했습니다." });
    expect(JSON.stringify(body)).not.toContain("permission denied");
  });
});

describe("PUT /api/writing-drafts", () => {
  it("비로그인 요청은 401을 준다", async () => {
    const { client } = fakeSupabase({ user: null });
    installSupabaseMock(client);

    const response = await PUT(
      jsonRequest("PUT", "/api/writing-drafts", { id: "d1", title: "제목" })
    );

    expect(response.status).toBe(401);
  });

  it("id가 없으면 400을 준다", async () => {
    const { client } = fakeSupabase({ user: { id: "u1" } });
    installSupabaseMock(client);

    const response = await PUT(
      jsonRequest("PUT", "/api/writing-drafts", {
        title: "제목",
        content: "본문",
      })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "글 초안 입력이 올바르지 않습니다.",
    });
  });

  it("소유자 조건을 함께 걸어 수정한다", async () => {
    const fake = fakeSupabase({
      user: { id: "u1" },
      from: { writing_drafts: { data: [{ id: "d1", title: "바뀐 제목" }] } },
    });
    installSupabaseMock(fake.client);

    const response = await PUT(
      jsonRequest("PUT", "/api/writing-drafts", {
        id: "d1",
        title: "바뀐 제목",
        content: "본문",
      })
    );

    expect(response.status).toBe(200);

    const call = fake.calls("writing_drafts")[0];
    expect(call.op).toBe("update");
    // 소유자 조건이 빠지면 남의 글을 고칠 수 있다.
    expect(call.filters).toEqual(OWNER_FILTERS);
  });

  it("수정 오류는 500을 주고 내부 문구를 담지 않는다", async () => {
    const { client } = fakeSupabase({
      user: { id: "u1" },
      from: { writing_drafts: { error: DENIED } },
    });
    installSupabaseMock(client);

    const response = await PUT(
      jsonRequest("PUT", "/api/writing-drafts", {
        id: "d1",
        title: "제목",
        content: "본문",
      })
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "글 초안을 저장하지 못했습니다." });
    expect(JSON.stringify(body)).not.toContain("permission denied");
  });
});

describe("DELETE /api/writing-drafts", () => {
  it("비로그인 요청은 401을 준다", async () => {
    const { client } = fakeSupabase({ user: null });
    installSupabaseMock(client);

    const response = await DELETE(getRequest("/api/writing-drafts?id=d1"));

    expect(response.status).toBe(401);
  });

  it("id가 없으면 400을 준다", async () => {
    const { client } = fakeSupabase({ user: { id: "u1" } });
    installSupabaseMock(client);

    const response = await DELETE(getRequest("/api/writing-drafts"));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "삭제할 초안이 필요합니다.",
    });
  });

  it("소유자 조건을 함께 걸어 삭제한다", async () => {
    const fake = fakeSupabase({
      user: { id: "u1" },
      from: { writing_drafts: { data: null } },
    });
    installSupabaseMock(fake.client);

    const response = await DELETE(getRequest("/api/writing-drafts?id=d1"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });

    const call = fake.calls("writing_drafts")[0];
    expect(call.op).toBe("delete");
    expect(call.filters).toEqual(OWNER_FILTERS);
  });

  it("삭제 오류는 500을 주고 내부 문구를 담지 않는다", async () => {
    const { client } = fakeSupabase({
      user: { id: "u1" },
      from: { writing_drafts: { error: DENIED } },
    });
    installSupabaseMock(client);

    const response = await DELETE(getRequest("/api/writing-drafts?id=d1"));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "글 초안을 삭제하지 못했습니다." });
    expect(JSON.stringify(body)).not.toContain("permission denied");
  });
});
