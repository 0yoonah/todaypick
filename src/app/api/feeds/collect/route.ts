import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { collectFeedItems } from "@/services/feedCollector";
import { createClient } from "@/utils/supabase/server";
import { serverError, unauthorized } from "@/utils/apiResponse";

// pg_cron이 3시간마다 부르는 예약 수집 전용 API. 운영 절차는 docs/feed-collection.md를 본다.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SAVE_FAILED_MESSAGE = "수집한 글을 저장하지 못했습니다.";

function isAuthorized(request: NextRequest, secret: string): boolean {
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(request.headers.get("authorization") ?? "");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function POST(request: NextRequest) {
  const secret = process.env.FEED_COLLECTOR_SECRET;
  if (!secret) {
    return serverError(
      "수집 설정이 없습니다.",
      new Error("FEED_COLLECTOR_SECRET 환경 변수가 없습니다.")
    );
  }

  if (!isAuthorized(request, secret)) {
    return unauthorized();
  }

  try {
    const { items, okCount, failedSourceIds } = await collectFeedItems();

    // 모든 출처가 실패하면 네트워크나 설정 문제다. 성공처럼 보이지 않게 알린다.
    if (okCount === 0) {
      return serverError(
        "RSS를 하나도 수집하지 못했습니다.",
        `실패한 출처: ${failedSourceIds.join(", ")}`
      );
    }

    // 서비스 롤 키 대신 같은 비밀값을 DB 함수가 Vault 값과 다시 확인한다.
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("upsert_feed_items", {
      p_secret: secret,
      p_items: items,
    });

    if (error) {
      return serverError(
        SAVE_FAILED_MESSAGE,
        `upsert_feed_items 실패 (${error.code}): ${error.message}`
      );
    }

    const { upserted = 0, deleted = 0 } =
      (data as { upserted?: number; deleted?: number } | null) ?? {};

    return NextResponse.json({
      upserted,
      deleted,
      sources: { ok: okCount, failed: failedSourceIds },
    });
  } catch (error) {
    return serverError(SAVE_FAILED_MESSAGE, error);
  }
}
