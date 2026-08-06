import { describe, expect, it } from "vitest";
import {
  countReadsByDate,
  parseFeedReadPagination,
} from "@/utils/feedReadUtils";

describe("countReadsByDate", () => {
  it("빈 목록은 빈 결과를 반환한다", () => {
    expect(countReadsByDate([])).toEqual({});
  });

  it("서울 날짜별 읽은 글 수를 집계한다", () => {
    expect(
      countReadsByDate([
        { read_date: "2026-08-02" },
        { read_date: "2026-08-03" },
        { read_date: "2026-08-03" },
      ])
    ).toEqual({ "2026-08-02": 1, "2026-08-03": 2 });
  });
});

describe("parseFeedReadPagination", () => {
  it("기본 페이지 값을 반환한다", () => {
    expect(parseFeedReadPagination(new URLSearchParams())).toEqual({
      page: 1,
      limit: 12,
    });
  });

  it("허용 범위의 페이지 값을 파싱한다", () => {
    expect(
      parseFeedReadPagination(new URLSearchParams("page=2&limit=50"))
    ).toEqual({ page: 2, limit: 50 });
  });

  it.each(["0", "-1", "1.5", "text"])(
    "잘못된 page=%s를 거부한다",
    (page) => {
      expect(() =>
        parseFeedReadPagination(new URLSearchParams({ page }))
      ).toThrow("page는 1 이상의 정수여야 합니다.");
    }
  );

  it.each(["0", "51", "1.5", "text"])(
    "잘못된 limit=%s를 거부한다",
    (limit) => {
      expect(() =>
        parseFeedReadPagination(new URLSearchParams({ limit }))
      ).toThrow("limit은 1 이상 50 이하의 정수여야 합니다.");
    }
  );
});
