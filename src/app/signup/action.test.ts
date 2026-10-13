import { beforeEach, describe, expect, it, vi } from "vitest";
import { signup } from "./action";
import { fakeSupabase, installSupabaseMock } from "@/test/fakeSupabase";

vi.mock("@/utils/supabase/server");
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const INITIAL = { user: null, error: "" };

function form(overrides: Record<string, string | null> = {}) {
  const values: Record<string, string | null> = {
    nickname: "tester",
    email: "tester@example.com",
    password: "Password1!",
    confirmPassword: "Password1!",
    ageConfirmed: "on",
    termsAgreed: "on",
    ...overrides,
  };
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) {
    if (value !== null) data.set(key, value);
  }
  return data;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("signup 동의 검증", () => {
  it.each([["ageConfirmed"], ["termsAgreed"]])("%s가 없으면 가입하지 않는다", async (field) => {
    const fake = fakeSupabase({ user: null });
    installSupabaseMock(fake.client);

    const result = await signup(INITIAL, form({ [field]: null }));

    expect(result).toEqual({
      user: null,
      error: "만 14세 이상 확인과 약관 동의가 필요합니다.",
    });
    expect(fake.authCalls()).toEqual([]);
  });

  it("동의하면 약관 버전을 메타데이터에 담아 가입한다", async () => {
    const fake = fakeSupabase({
      user: null,
      auth: { signUp: { data: { user: { id: "new" }, session: null } } },
    });
    installSupabaseMock(fake.client);

    const result = await signup(INITIAL, form());

    expect(result.error).toBe("");
    expect(fake.authCalls()).toEqual([
      {
        op: "signUp",
        args: {
          email: "tester@example.com",
          password: "Password1!",
          options: {
            data: { nickname: "tester", terms_agreed: true, terms_version: "2026-10-13" },
          },
        },
      },
    ]);
  });
});
