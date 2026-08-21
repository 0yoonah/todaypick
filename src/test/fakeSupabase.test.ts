import { describe, expect, it } from "vitest";
import { fakeSupabase } from "./fakeSupabase";

describe("fakeSupabase", () => {
  describe("auth", () => {
    it("주입한 사용자를 getUser로 돌려준다", async () => {
      const { client } = fakeSupabase({ user: { id: "u1" } });

      const { data } = await client.auth.getUser();

      expect(data.user).toEqual({ id: "u1" });
    });

    it("user를 주지 않으면 비로그인으로 본다", async () => {
      const { client } = fakeSupabase({});

      const { data } = await client.auth.getUser();

      expect(data.user).toBeNull();
    });
  });

  describe("조회 결과", () => {
    it("빌더를 직접 await하면 주입한 결과를 준다", async () => {
      const { client } = fakeSupabase({
        from: { cs_reviews: { data: [{ question_id: "net-1" }] } },
      });

      const { data, error } = await client
        .from("cs_reviews")
        .select("question_id")
        .eq("user_id", "u1");

      expect(data).toEqual([{ question_id: "net-1" }]);
      expect(error).toBeNull();
    });

    it("single은 배열을 단일 객체로 줄인다", async () => {
      const { client } = fakeSupabase({
        from: { writing_drafts: { data: [{ id: "d1" }] } },
      });

      const { data } = await client.from("writing_drafts").select("id").single();

      expect(data).toEqual({ id: "d1" });
    });

    it("maybeSingle은 비어 있으면 null을 준다", async () => {
      const { client } = fakeSupabase({ from: { scraped_quotes: { data: [] } } });

      const { data } = await client
        .from("scraped_quotes")
        .select("id")
        .maybeSingle();

      expect(data).toBeNull();
    });

    it("오류를 주입하면 data 없이 error를 준다", async () => {
      const { client } = fakeSupabase({
        from: { cs_reviews: { error: { code: "42P01", message: "relation 없음" } } },
      });

      const { data, error } = await client.from("cs_reviews").select("*");

      expect(data).toBeNull();
      expect(error).toEqual({ code: "42P01", message: "relation 없음" });
    });

    it("count 옵션이면 개수를 함께 준다", async () => {
      const { client } = fakeSupabase({
        from: { feed_reads: { data: [{ id: 1 }], count: 7 } },
      });

      const { data, count } = await client
        .from("feed_reads")
        .select("*", { count: "exact" });

      expect(count).toBe(7);
      expect(data).toEqual([{ id: 1 }]);
    });

    it("head 옵션이면 data 없이 개수만 준다", async () => {
      const { client } = fakeSupabase({
        from: { daily_activities: { count: 3 } },
      });

      const { data, count } = await client
        .from("daily_activities")
        .select("id", { count: "exact", head: true });

      expect(count).toBe(3);
      expect(data).toBeNull();
    });
  });

  describe("빌더 불변성", () => {
    // src/app/api/writing-drafts/route.ts는 빌더를 변수에 담고 두 갈래로 나눠 await한다.
    // 필터가 누적되면 두 갈래가 서로 오염된다.
    it("같은 빌더에서 갈라진 두 갈래의 필터가 섞이지 않는다", async () => {
      const fake = fakeSupabase({
        from: { writing_drafts: [{ data: [{ id: "mine" }] }, { data: [{ id: "public" }] }] },
      });

      const query = fake.client
        .from("writing_drafts")
        .select("id")
        .order("updated_at", { ascending: false });

      const owned = await query.eq("user_id", "u1");
      const shared = await query.eq("visibility", "public");

      expect(owned.data).toEqual([{ id: "mine" }]);
      expect(shared.data).toEqual([{ id: "public" }]);
      expect(fake.calls("writing_drafts")).toEqual([
        {
          op: "select",
          columns: "id",
          filters: [["eq", "user_id", "u1"]],
          modifiers: [["order", "updated_at", { ascending: false }]],
          terminal: "await",
        },
        {
          op: "select",
          columns: "id",
          filters: [["eq", "visibility", "public"]],
          modifiers: [["order", "updated_at", { ascending: false }]],
          terminal: "await",
        },
      ]);
    });

    it("빌더를 await하지 않으면 호출로 기록하지 않는다", () => {
      const fake = fakeSupabase({ from: { cs_reviews: { data: [] } } });

      fake.client.from("cs_reviews").select("*").eq("user_id", "u1");

      expect(fake.calls("cs_reviews")).toEqual([]);
    });
  });

  describe("호출 기록", () => {
    it("변경 작업의 payload를 기록한다", async () => {
      const fake = fakeSupabase({ from: { cs_reviews: { data: null } } });

      await fake.client
        .from("cs_reviews")
        .upsert({ user_id: "u1", score: 40 })
        .eq("question_id", "net-1");

      expect(fake.calls("cs_reviews")).toEqual([
        {
          op: "upsert",
          payload: { user_id: "u1", score: 40 },
          filters: [["eq", "question_id", "net-1"]],
          modifiers: [],
          terminal: "await",
        },
      ]);
    });

    it("in과 gte 필터를 기록한다", async () => {
      const fake = fakeSupabase({ from: { quiz_results: { data: [] } } });

      await fake.client
        .from("quiz_results")
        .select("*")
        .in("quiz_id", ["q1", "q2"])
        .gte("created_at", "2026-08-01");

      expect(fake.calls("quiz_results")[0].filters).toEqual([
        ["in", "quiz_id", ["q1", "q2"]],
        ["gte", "created_at", "2026-08-01"],
      ]);
    });

    it("호출하지 않은 테이블은 빈 배열을 준다", () => {
      const fake = fakeSupabase({});

      expect(fake.calls("users")).toEqual([]);
    });
  });

  describe("응답 배열", () => {
    it("배열로 주면 호출 순서대로 소비한다", async () => {
      const { client } = fakeSupabase({
        from: { daily_activities: [{ data: [{ date: "2026-08-21" }] }, { count: 3 }] },
      });

      const first = await client.from("daily_activities").select("*");
      const second = await client
        .from("daily_activities")
        .select("id", { count: "exact", head: true });

      expect(first.data).toEqual([{ date: "2026-08-21" }]);
      expect(second.count).toBe(3);
    });

    it("단일 응답은 여러 번 호출해도 그대로 준다", async () => {
      const { client } = fakeSupabase({ from: { users: { data: [{ id: "u1" }] } } });

      await client.from("users").select("*");
      const second = await client.from("users").select("*");

      expect(second.data).toEqual([{ id: "u1" }]);
    });

    it("배열을 다 쓴 뒤 또 호출하면 실패한다", async () => {
      const { client } = fakeSupabase({ from: { users: [{ data: [] }] } });

      await client.from("users").select("*");

      await expect(client.from("users").select("*")).rejects.toThrow(
        /users.*응답을 다 소비/
      );
    });
  });

  describe("주입하지 않은 접근", () => {
    it("주입하지 않은 테이블을 부르면 실패한다", async () => {
      const { client } = fakeSupabase({});

      await expect(client.from("cs_reviews").select("*")).rejects.toThrow(
        /cs_reviews.*주입하지 않았다/
      );
    });

    it("지원하지 않는 메서드를 부르면 실패한다", () => {
      const { client } = fakeSupabase({ from: { users: { data: [] } } });

      // 타입에 없는 메서드를 런타임에 불렀을 때의 동작을 확인한다.
      const builder = client.from("users").select("*") as unknown as {
        limit(count: number): unknown;
      };

      expect(() => builder.limit(1)).toThrow(/limit.*지원하지 않는/);
    });
  });

  describe("rpc", () => {
    it("주입한 결과를 주고 인자를 기록한다", async () => {
      const fake = fakeSupabase({
        rpc: { record_feed_read: { data: { ok: true } } },
      });

      const { data } = await fake.client.rpc("record_feed_read", { feed_id: "f1" });

      expect(data).toEqual({ ok: true });
      expect(fake.rpcCalls("record_feed_read")).toEqual([{ feed_id: "f1" }]);
    });

    it("주입하지 않은 rpc를 부르면 실패한다", async () => {
      const { client } = fakeSupabase({});

      await expect(client.rpc("record_feed_read", {})).rejects.toThrow(
        /record_feed_read.*주입하지 않았다/
      );
    });
  });

  describe("storage", () => {
    it("upload와 remove 결과를 주고 인자를 기록한다", async () => {
      const fake = fakeSupabase({
        storage: { upload: { data: { path: "u1/a.png" } }, remove: { data: [] } },
      });

      const uploaded = await fake.client.storage
        .from("avatars")
        .upload("u1/a.png", new Blob([]));
      await fake.client.storage.from("avatars").remove(["u1/old.png"]);

      expect(uploaded.data).toEqual({ path: "u1/a.png" });
      expect(fake.storageCalls()).toEqual([
        { bucket: "avatars", op: "upload", path: "u1/a.png" },
        { bucket: "avatars", op: "remove", paths: ["u1/old.png"] },
      ]);
    });
  });
});
