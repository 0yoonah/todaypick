import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getTodayQuiz, selectDailyQuiz } from "@/utils/quizUtils";
import { quizzes } from "@/data/quizzes";
import { getSeoulDateKey } from "@/utils/dateUtils";
import { recordDailyActivity } from "@/services/dailyActivityService";
import type { QuizResult } from "@/types/quiz";
import {
  badRequest,
  conflict,
  notFound,
  serverError,
  unauthorized,
} from "@/utils/apiResponse";

type SolvedQuizResult = Pick<
  QuizResult,
  "quiz_id" | "selected_answer" | "is_correct" | "answered_at"
>;

/**
 * 사용자가 푼 문제와 오늘 푼 문제를 함께 조회한다.
 * 오늘 이미 답한 문제가 있으면 그 문제가 오늘의 퀴즈다.
 */
async function loadSolvedQuizzes(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  dateKey: string
) {
  const { data, error } = await supabase
    .from("quiz_results")
    .select("quiz_id, selected_answer, is_correct, answered_at")
    .eq("user_id", userId);

  if (error) throw error;

  const results = (data ?? []) as SolvedQuizResult[];

  return {
    solvedIds: results.map((result) => result.quiz_id),
    todayResult:
      results.find(
        (result) => getSeoulDateKey(new Date(result.answered_at)) === dateKey
      ) ?? null,
  };
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = new URL(request.url).searchParams;
    const quizId = searchParams.get("quizId");
    const isTodayScope = searchParams.get("scope") === "today";

    const { data: user } = await supabase.auth.getUser();

    if (isTodayScope) {
      const dateKey = getSeoulDateKey();

      // 비로그인 사용자는 개인화 없이 같은 문제를 본다.
      if (!user.user) {
        return NextResponse.json({
          quiz: getTodayQuiz(),
          result: null,
          isCompleted: false,
          solvedCount: 0,
          totalCount: quizzes.length,
        });
      }

      const { solvedIds, todayResult } = await loadSolvedQuizzes(
        supabase,
        user.user.id,
        dateKey
      );

      if (todayResult) {
        return NextResponse.json({
          quiz: quizzes.find((quiz) => quiz.id === todayResult.quiz_id) ?? null,
          result: todayResult,
          isCompleted: false,
          solvedCount: solvedIds.length,
          totalCount: quizzes.length,
        });
      }

      const quiz = selectDailyQuiz(quizzes, dateKey, solvedIds);

      return NextResponse.json({
        quiz,
        result: null,
        isCompleted: quiz === null,
        solvedCount: solvedIds.length,
        totalCount: quizzes.length,
      });
    }

    if (!user.user) {
      return unauthorized();
    }

    if (!!quizId) {
      const { data, error } = await supabase
        .from("quiz_results")
        .select("*")
        .eq("user_id", user.user.id)
        .eq("quiz_id", quizId)
        .single();

      // PGRST116: 데이터가 없을 때 발생하는 에러 - 퀴즈를 풀기 전에는 데이터가 없음
      if (error && error.code !== "PGRST116") {
        throw error;
      }

      return NextResponse.json(data || null, { status: 200 });
    }

    const { data, error } = await supabase
      .from("quiz_results")
      .select("*")
      .eq("user_id", user.user.id)
      .order("answered_at", { ascending: false });

    if (error) {
      throw error;
    }

    const recordsWithQuizInfo =
      data?.map((record) => {
        const quiz = quizzes.find((q) => q.id === record.quiz_id);
        return {
          ...record,
          quiz: quiz || null,
        };
      }) || [];

    return NextResponse.json(recordsWithQuizInfo, { status: 200 });
  } catch (error) {
    return serverError("퀴즈를 불러오는데 실패했습니다.", error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: user } = await supabase.auth.getUser();

    if (!user.user) {
      return unauthorized();
    }

    const body = await request.json();
    const { selectedAnswer } = body;

    if (selectedAnswer === undefined || selectedAnswer === null) {
      return badRequest("선택한 답안이 필요합니다.");
    }

    const dateKey = getSeoulDateKey();
    const { solvedIds, todayResult } = await loadSolvedQuizzes(
      supabase,
      user.user.id,
      dateKey
    );

    if (todayResult) {
      return conflict("이미 답안을 제출한 퀴즈입니다.");
    }

    // GET과 같은 규칙으로 오늘의 문제를 다시 고른다.
    const quiz = selectDailyQuiz(quizzes, dateKey, solvedIds);

    if (!quiz) {
      return notFound("오늘 풀 수 있는 퀴즈가 없습니다.");
    }

    const isCorrect = selectedAnswer === quiz.correct_answer;

    // 답안 저장
    const { error: resultError } = await supabase.from("quiz_results").insert({
      user_id: user.user.id,
      quiz_id: quiz.id,
      selected_answer: selectedAnswer,
      is_correct: isCorrect,
      answered_at: new Date().toISOString(),
    });

    if (resultError) {
      throw resultError;
    }

    // 퀴즈 완료 활동 기록
    try {
      await recordDailyActivity(
        supabase,
        user.user.id,
        getSeoulDateKey(),
        "quiz_completed"
      );
    } catch (activityError) {
      console.error("활동 기록 저장 실패:", activityError);
    }

    return NextResponse.json(
      {
        isCorrect,
        explanation: quiz.explanation,
      },
      { status: 200 }
    );
  } catch (error) {
    return serverError("답안 제출에 실패했습니다.", error);
  }
}
