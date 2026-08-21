import { beforeEach, describe, expect, it, vi } from "vitest";
import { PUT } from "./route";
import { jsonRequest } from "@/test/apiRequest";
import { fakeSupabase, installSupabaseMock } from "@/test/fakeSupabase";

vi.mock("@/utils/supabase/server");

const DENIED = { code: "42501", message: "permission denied for table users" };

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("PUT /api/profile/interests", () => {
  it("비로그인 요청은 401과 규약 문구를 준다", async () => {
    const { client } = fakeSupabase({ user: null });
    installSupabaseMock(client);

    const response = await PUT(
      jsonRequest("PUT", "/api/profile/interests", { interests: ["frontend"] })
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "인증이 필요합니다." });
  });

  it("배열이 아니면 400을 준다", async () => {
    const { client } = fakeSupabase({ user: { id: "u1" } });
    installSupabaseMock(client);

    const response = await PUT(
      jsonRequest("PUT", "/api/profile/interests", { interests: "frontend" })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "유효하지 않은 관심 분야가 포함되어 있습니다.",
    });
  });

  it("허용하지 않는 값이 섞이면 400을 준다", async () => {
    const { client } = fakeSupabase({ user: { id: "u1" } });
    installSupabaseMock(client);

    const response = await PUT(
      jsonRequest("PUT", "/api/profile/interests", {
        interests: ["frontend", "없는분야"],
      })
    );

    expect(response.status).toBe(400);
  });

  it("중복은 거절하지 않고 하나로 합친다", async () => {
    const fake = fakeSupabase({
      user: { id: "u1" },
      from: { users: { data: null } },
    });
    installSupabaseMock(fake.client);

    const response = await PUT(
      jsonRequest("PUT", "/api/profile/interests", {
        interests: ["frontend", "frontend"],
      })
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ interests: ["frontend"] });
    expect(fake.calls("users")[0].payload).toEqual({
      interests: ["frontend"],
    });
  });

  it("본인 행만 대상으로 관심 분야를 저장한다", async () => {
    const fake = fakeSupabase({
      user: { id: "u1" },
      from: { users: { data: null } },
    });
    installSupabaseMock(fake.client);

    const response = await PUT(
      jsonRequest("PUT", "/api/profile/interests", {
        interests: ["frontend", "security"],
      })
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      interests: ["frontend", "security"],
    });

    const call = fake.calls("users")[0];
    expect(call.op).toBe("update");
    expect(call.filters).toEqual([["eq", "id", "u1"]]);
  });

  it("빈 배열도 저장한다", async () => {
    const fake = fakeSupabase({
      user: { id: "u1" },
      from: { users: { data: null } },
    });
    installSupabaseMock(fake.client);

    const response = await PUT(
      jsonRequest("PUT", "/api/profile/interests", { interests: [] })
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ interests: [] });
  });

  it("저장 오류는 500을 주고 내부 문구를 담지 않는다", async () => {
    const { client } = fakeSupabase({
      user: { id: "u1" },
      from: { users: { error: DENIED } },
    });
    installSupabaseMock(client);

    const response = await PUT(
      jsonRequest("PUT", "/api/profile/interests", { interests: ["frontend"] })
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "관심 분야를 저장하지 못했습니다." });
    expect(JSON.stringify(body)).not.toContain("permission denied");
  });
});
