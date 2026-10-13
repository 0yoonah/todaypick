import { beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE } from "./route";
import { jsonRequest } from "@/test/apiRequest";
import { fakeSupabase, installSupabaseMock } from "@/test/fakeSupabase";

vi.mock("@/utils/supabase/server");

const USER = { id: "u1", email: "user@example.com" };
const FAILED = "회원 탈퇴를 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.";
const request = (body?: unknown) => jsonRequest("DELETE", "/api/account", body);

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("DELETE /api/account", () => {
  it("비로그인 요청은 401", async () => {
    installSupabaseMock(fakeSupabase({ user: null }).client);

    const response = await DELETE(request({ password: "pw" }));

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "인증이 필요합니다." });
  });

  it.each([[undefined], [{}], [{ password: "" }], [{ password: 123 }]])(
    "비밀번호가 없으면 400 (%j)",
    async (body) => {
      const fake = fakeSupabase({ user: USER });
      installSupabaseMock(fake.client);

      const response = await DELETE(request(body));

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: "비밀번호를 입력해 주세요." });
      expect(fake.authCalls()).toEqual([]);
    }
  );

  it("비밀번호가 틀리면 400이고 아무것도 지우지 않는다", async () => {
    const fake = fakeSupabase({
      user: USER,
      auth: { signInWithPassword: { error: { message: "Invalid login credentials", status: 400 } } },
    });
    installSupabaseMock(fake.client);

    const response = await DELETE(request({ password: "wrong" }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "비밀번호가 일치하지 않습니다." });
    expect(fake.storageCalls()).toEqual([]);
    expect(fake.rpcCalls("delete_own_account")).toEqual([]);
  });

  it("시도 제한(429)이면 다시 시도하라고 안내한다", async () => {
    const fake = fakeSupabase({
      user: USER,
      auth: { signInWithPassword: { error: { message: "rate limit", status: 429 } } },
    });
    installSupabaseMock(fake.client);

    const response = await DELETE(request({ password: "pw" }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "시도가 많습니다. 잠시 후 다시 시도해 주세요.",
    });
    expect(fake.rpcCalls("delete_own_account")).toEqual([]);
  });

  it("프로필 이미지 삭제에 실패하면 500이고 계정은 지우지 않는다", async () => {
    const fake = fakeSupabase({
      user: USER,
      auth: { signInWithPassword: {} },
      storage: { list: { data: [{ name: "u1-a.png" }] }, remove: { error: { message: "storage down" } } },
    });
    installSupabaseMock(fake.client);

    const response = await DELETE(request({ password: "pw" }));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: FAILED });
    expect(fake.rpcCalls("delete_own_account")).toEqual([]);
  });

  it("계정 삭제 rpc가 실패하면 500과 고정 문구만 준다", async () => {
    const fake = fakeSupabase({
      user: USER,
      auth: { signInWithPassword: {} },
      storage: { list: { data: [] } },
      rpc: { delete_own_account: { error: { message: "permission denied for table users" } } },
    });
    installSupabaseMock(fake.client);

    const response = await DELETE(request({ password: "pw" }));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: FAILED });
  });

  it("이미지가 없으면 Storage를 건드리지 않고 계정을 지운다", async () => {
    const fake = fakeSupabase({
      user: USER,
      auth: { signInWithPassword: {}, signOut: {} },
      storage: { list: { data: [] } },
      rpc: { delete_own_account: {} },
    });
    installSupabaseMock(fake.client);

    const response = await DELETE(request({ password: "pw" }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ deleted: true });
    expect(fake.storageCalls().map((call) => call.op)).toEqual(["list"]);
    expect(fake.calls("users")).toEqual([]);
  });

  it("본인 이미지만 지우고 avatar_url을 비운 뒤 계정을 지우고 로그아웃한다", async () => {
    const fake = fakeSupabase({
      user: USER,
      auth: { signInWithPassword: {}, signOut: {} },
      storage: {
        list: { data: [{ name: "u1-a.png" }, { name: "u10-b.png" }, { name: "u1-c.webp" }] },
        remove: {},
      },
      from: { users: {} },
      rpc: { delete_own_account: {} },
    });
    installSupabaseMock(fake.client);

    const response = await DELETE(request({ password: "pw" }));

    expect(response.status).toBe(200);
    expect(fake.authCalls()).toEqual([
      { op: "signInWithPassword", args: { email: "user@example.com", password: "pw" } },
      { op: "signOut", args: undefined },
    ]);
    expect(fake.storageCalls()).toEqual([
      { bucket: "avatars", op: "list", path: "", options: { search: "u1" } },
      { bucket: "avatars", op: "remove", paths: ["u1-a.png", "u1-c.webp"] },
    ]);
    expect(fake.calls("users")).toEqual([
      expect.objectContaining({
        op: "update",
        payload: { avatar_url: null },
        filters: [["eq", "id", "u1"]],
      }),
    ]);
    expect(fake.rpcCalls("delete_own_account")).toHaveLength(1);
  });
});
