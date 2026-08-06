import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { csQuestions } from "@/data/csQuestions";
import { gradeCsAnswer, MAX_CS_ANSWER_LENGTH } from "@/utils/csUtils";
import type { CsReview } from "@/types/cs";

const selectFields =
  "question_id, score, matched_keywords, answer, used_hint, reviewed_at";

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

  return NextResponse.json({ reviews: (data ?? []) as CsReview[] });
}

export async function POST(request: NextRequest) {
  const { supabase, user } = await getAuthenticatedClient();
  if (!user) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const questionId = typeof body?.question_id === "string" ? body.question_id : "";
  const answer = typeof body?.answer === "string" ? body.answer : "";
  const usedHint = body?.used_hint === true;

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
        used_hint: usedHint,
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

  return NextResponse.json({ review: data as CsReview });
}
