import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET, PUT } from "./route";
import { formRequest, jsonRequest } from "@/test/apiRequest";
import {
  FAKE_STORAGE_ORIGIN,
  fakeSupabase,
  installSupabaseMock,
} from "@/test/fakeSupabase";

vi.mock("@/utils/supabase/server");

const FIXED_NOW = new Date("2026-08-21T05:00:00.000Z");
const DENIED = { code: "42501", message: "permission denied for table users" };
const NO_ROWS = { code: "PGRST116", message: "no rows returned" };

function pngFile(name = "a.png", size = 10) {
  return new File([new Uint8Array(size)], name, { type: "image/png" });
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(FIXED_NOW);
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
});

describe("GET /api/profile", () => {
  it("비로그인 요청은 401과 규약 문구를 준다", async () => {
    const { client } = fakeSupabase({ user: null });
    installSupabaseMock(client);

    const response = await GET();

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "인증이 필요합니다." });
  });

  it("프로필이 없으면 null을 준다", async () => {
    const { client } = fakeSupabase({
      user: { id: "u1" },
      from: { users: { error: NO_ROWS } },
    });
    installSupabaseMock(client);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toBeNull();
  });

  it("저장된 경로를 공개 주소로 바꿔 준다", async () => {
    const fake = fakeSupabase({
      user: { id: "u1" },
      from: {
        users: { data: [{ id: "u1", nickname: "윤아", avatar_url: "u1-a.png" }] },
      },
    });
    installSupabaseMock(fake.client);

    const body = await (await GET()).json();

    expect(body.avatar_url).toBe(
      `${FAKE_STORAGE_ORIGIN}/avatars/u1-a.png?t=${FIXED_NOW.getTime()}`
    );
    expect(fake.storageCalls()).toEqual([
      { bucket: "avatars", op: "getPublicUrl", path: "u1-a.png" },
    ]);
  });

  it("이미지가 없으면 avatar_url을 null로 준다", async () => {
    const fake = fakeSupabase({
      user: { id: "u1" },
      from: { users: { data: [{ id: "u1", nickname: "윤아", avatar_url: null }] } },
    });
    installSupabaseMock(fake.client);

    const body = await (await GET()).json();

    expect(body.avatar_url).toBeNull();
    expect(fake.storageCalls()).toEqual([]);
  });

  it("본인 행만 조회한다", async () => {
    const fake = fakeSupabase({
      user: { id: "u1" },
      from: { users: { data: [{ id: "u1", avatar_url: null }] } },
    });
    installSupabaseMock(fake.client);

    await GET();

    expect(fake.calls("users")[0].filters).toEqual([["eq", "id", "u1"]]);
  });

  it("조회 오류는 500을 주고 내부 문구를 담지 않는다", async () => {
    const { client } = fakeSupabase({
      user: { id: "u1" },
      from: { users: { error: DENIED } },
    });
    installSupabaseMock(client);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "프로필을 불러오는데 실패했습니다." });
    expect(JSON.stringify(body)).not.toContain("permission denied");
  });
});

describe("PUT /api/profile", () => {
  it("비로그인 요청은 401을 준다", async () => {
    const { client } = fakeSupabase({ user: null });
    installSupabaseMock(client);

    const response = await PUT(
      jsonRequest("PUT", "/api/profile", { nickname: "윤아" })
    );

    expect(response.status).toBe(401);
  });

  it("닉네임이 비어 있으면 400을 준다", async () => {
    const { client } = fakeSupabase({
      user: { id: "u1" },
      from: { users: { error: NO_ROWS } },
    });
    installSupabaseMock(client);

    const response = await PUT(
      jsonRequest("PUT", "/api/profile", { nickname: "   " })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "닉네임이 필요합니다." });
  });

  it("닉네임만 바꾸면 이미지 경로를 유지한다", async () => {
    const fake = fakeSupabase({
      user: { id: "u1", email: "a@b.com" },
      from: { users: [{ data: [{ avatar_url: "u1-a.png" }] }, { data: null }] },
    });
    installSupabaseMock(fake.client);

    const response = await PUT(
      jsonRequest("PUT", "/api/profile", { nickname: "윤아" })
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      avatarUpdated: false,
    });
    expect(fake.calls("users")[1].payload).toMatchObject({
      id: "u1",
      nickname: "윤아",
      avatar_url: "u1-a.png",
    });
    expect(fake.storageCalls()).toEqual([]);
  });

  it("이미지 제거를 요청하면 경로를 비우고 기존 파일을 지운다", async () => {
    const fake = fakeSupabase({
      user: { id: "u1" },
      from: { users: [{ data: [{ avatar_url: "u1-a.png" }] }, { data: null }] },
      storage: { remove: { data: [] } },
    });
    installSupabaseMock(fake.client);

    const response = await PUT(
      jsonRequest("PUT", "/api/profile", {
        nickname: "윤아",
        removeAvatar: true,
      })
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      avatarUpdated: true,
    });
    expect(fake.calls("users")[1].payload).toMatchObject({ avatar_url: null });
    expect(fake.storageCalls()).toEqual([
      { bucket: "avatars", op: "remove", paths: ["u1-a.png"] },
    ]);
  });

  it("이미지 변경과 제거를 동시에 요청하면 400을 준다", async () => {
    const { client } = fakeSupabase({
      user: { id: "u1" },
      from: { users: { error: NO_ROWS } },
    });
    installSupabaseMock(client);

    const formData = new FormData();
    formData.set("nickname", "윤아");
    formData.set("file", pngFile());
    formData.set("removeAvatar", "true");

    const response = await PUT(formRequest("PUT", "/api/profile", formData));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "이미지 변경과 제거를 동시에 요청할 수 없습니다.",
    });
  });

  it("허용하지 않는 형식은 400을 준다", async () => {
    const { client } = fakeSupabase({
      user: { id: "u1" },
      from: { users: { error: NO_ROWS } },
    });
    installSupabaseMock(client);

    const formData = new FormData();
    formData.set("nickname", "윤아");
    formData.set(
      "file",
      new File([new Uint8Array(10)], "a.svg", { type: "image/svg+xml" })
    );

    const response = await PUT(formRequest("PUT", "/api/profile", formData));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "JPG, PNG, WEBP, GIF 이미지만 업로드할 수 있습니다.",
    });
  });

  it("5MB를 넘는 파일은 400을 준다", async () => {
    const { client } = fakeSupabase({
      user: { id: "u1" },
      from: { users: { error: NO_ROWS } },
    });
    installSupabaseMock(client);

    const formData = new FormData();
    formData.set("nickname", "윤아");
    formData.set("file", pngFile("big.png", 5 * 1024 * 1024 + 1));

    const response = await PUT(formRequest("PUT", "/api/profile", formData));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "파일 크기는 5MB 이하여야 합니다.",
    });
  });

  it("새 이미지를 올리면 그 경로를 저장하고 기존 파일을 지운다", async () => {
    const fake = fakeSupabase({
      user: { id: "u1" },
      from: { users: [{ data: [{ avatar_url: "old.png" }] }, { data: null }] },
      storage: { upload: { data: { path: "새경로" } }, remove: { data: [] } },
    });
    installSupabaseMock(fake.client);

    const formData = new FormData();
    formData.set("nickname", "윤아");
    formData.set("file", pngFile());

    const response = await PUT(formRequest("PUT", "/api/profile", formData));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      avatarUpdated: true,
    });

    const calls = fake.storageCalls();
    expect(calls[0]).toMatchObject({ bucket: "avatars", op: "upload" });
    // 업로드 경로는 사용자 id로 시작하고 확장자가 형식과 맞는다.
    const uploaded = calls[0] as { path: string };
    expect(uploaded.path).toMatch(/^u1-[0-9a-f-]+\.png$/);
    expect(fake.calls("users")[1].payload).toMatchObject({
      avatar_url: uploaded.path,
    });
    expect(calls[1]).toEqual({
      bucket: "avatars",
      op: "remove",
      paths: ["old.png"],
    });
  });

  it("업로드 실패는 500을 주고 프로필을 갱신하지 않는다", async () => {
    const fake = fakeSupabase({
      user: { id: "u1" },
      from: { users: { error: NO_ROWS } },
      storage: { upload: { error: { message: "storage quota exceeded" } } },
    });
    installSupabaseMock(fake.client);

    const formData = new FormData();
    formData.set("nickname", "윤아");
    formData.set("file", pngFile());

    const response = await PUT(formRequest("PUT", "/api/profile", formData));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "파일 업로드에 실패했습니다." });
    expect(JSON.stringify(body)).not.toContain("quota");
    // 조회 한 번만 하고 upsert는 하지 않는다.
    expect(fake.calls("users")).toHaveLength(1);
  });

  it("프로필 저장이 실패하면 올린 파일을 되돌린다", async () => {
    const fake = fakeSupabase({
      user: { id: "u1" },
      from: { users: [{ error: NO_ROWS }, { error: DENIED }] },
      storage: { upload: { data: {} }, remove: { data: [] } },
    });
    installSupabaseMock(fake.client);

    const formData = new FormData();
    formData.set("nickname", "윤아");
    formData.set("file", pngFile());

    const response = await PUT(formRequest("PUT", "/api/profile", formData));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "프로필 업데이트에 실패했습니다." });
    expect(JSON.stringify(body)).not.toContain("permission denied");

    const removes = fake
      .storageCalls()
      .filter((call) => call.op === "remove");
    expect(removes).toHaveLength(1);
  });

  it("기존 이미지 정리에 실패해도 갱신은 성공으로 응답한다", async () => {
    const fake = fakeSupabase({
      user: { id: "u1" },
      from: { users: [{ data: [{ avatar_url: "old.png" }] }, { data: null }] },
      storage: {
        remove: { error: { message: "object not found" } },
      },
    });
    installSupabaseMock(fake.client);

    const response = await PUT(
      jsonRequest("PUT", "/api/profile", {
        nickname: "윤아",
        removeAvatar: true,
      })
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      avatarUpdated: true,
    });
  });
});
