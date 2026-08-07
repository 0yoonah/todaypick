import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { csQuestions } from "@/data/csQuestions";
import { glossaryTerms } from "@/data/glossaryTerms";
import {
  gradeCsAnswer,
  MAX_CS_ANSWER_LENGTH,
  selectReviewQuestions,
  summarizeCsProgress,
  toReviewMap,
} from "@/utils/csUtils";
import type { CsReview } from "@/types/cs";
import { recordDailyActivity } from "@/services/dailyActivityService";
import { getSeoulDateKey } from "@/utils/dateUtils";
import { buildKeywordLinks } from "@/utils/glossaryUtils";

const selectFields =
  "question_id, score, matched_keywords, answer, reviewed_at";

async function getAuthenticatedClient() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return { supabase, user: data.user };
}

export async function GET() {
  const { supabase, user } = await getAuthenticatedClient();
  if (!user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("cs_reviews")
    .select(selectFields)
    .eq("user_id", user.id);

  if (error) {
    console.error(`CS 지식 채점 기록 조회 오류 (${error.code}): ${error.message}`);
    return NextResponse.json(
      { error: "채점 기록을 불러오지 못했습니다." },
      { status: 500 }
    );
  }

  const reviews = (data ?? []) as CsReview[];
  const reviewMap = toReviewMap(reviews);
  const reviewQuestions = selectReviewQuestions(csQuestions, reviewMap);

  // 복습 목록과 진도 집계를 서버에서 만들어, 문항 데이터가 클라이언트 번들에 실리지 않게 한다.
  return NextResponse.json({
    reviews,
    reviewQuestions,
    progress: summarizeCsProgress(csQuestions, reviewMap),
    keywordLinks: buildKeywordLinks(reviewQuestions, glossaryTerms),
  });
}

export async function POST(request: NextRequest) {
  const { supabase, user } = await getAuthenticatedClient();
  if (!user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const questionId = typeof body?.question_id === "string" ? body.question_id : "";
  const answer = typeof body?.answer === "string" ? body.answer : "";

  const question = csQuestions.find((item) => item.id === questionId);
  if (!question) {
    return NextResponse.json(
      { error: "존재하지 않는 질문입니다." },
      { status: 400 }
    );
  }

  if (answer.trim().length === 0) {
    return NextResponse.json({ error: "답변을 입력해야 합니다." }, { status: 400 });
  }

  if (answer.length > MAX_CS_ANSWER_LENGTH) {
    return NextResponse.json(
      { error: `답변은 ${MAX_CS_ANSWER_LENGTH}자 이하로 작성해야 합니다.` },
      { status: 400 }
    );
  }

  // 클라이언트가 보낸 점수를 믿지 않고 서버에서 다시 채점한다.
  const result = gradeCsAnswer(answer, question.keywords);

  const { data, error } = await supabase
    .from("cs_reviews")
    .upsert(
      {
        user_id: user.id,
        question_id: question.id,
        score: result.score,
        matched_keywords: result.matched,
        answer,
        reviewed_at: new Date().toISOString(),
      },
      { onConflict: "user_id,question_id" }
    )
    .select(selectFields)
    .single();

  if (error) {
    console.error(`CS 지식 채점 기록 저장 오류 (${error.code}): ${error.message}`);
    return NextResponse.json(
      { error: "채점 기록을 저장하지 못했습니다." },
      { status: 500 }
    );
  }

  // 홈 체크리스트용 활동 기록. 같은 날 여러 문항을 풀어도 한 행만 갱신된다.
  try {
    await recordDailyActivity(
      supabase,
      user.id,
      getSeoulDateKey(),
      "cs_completed"
    );
  } catch (activityError) {
    // 채점 자체는 성공했으므로 활동 기록 실패로 응답을 막지 않는다.
    console.error("CS 지식 일일 활동 기록 실패:", activityError);
  }

  return NextResponse.json({ review: data as CsReview });
}
