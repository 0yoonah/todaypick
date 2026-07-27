import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getTodayQuiz } from "@/utils/quizUtils";
import { quizzes } from "@/data/quizzes";
import { getSeoulDateKey } from "@/utils/dateUtils";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = new URL(request.url).searchParams;
    const quizId = searchParams.get("quizId");

    const { data: user } = await supabase.auth.getUser();

    if (!user.user) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
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
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "퀴즈를 불러오는데 실패했습니다.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: user } = await supabase.auth.getUser();

    if (!user.user) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { selectedAnswer } = body;

    if (selectedAnswer === undefined || selectedAnswer === null) {
      return NextResponse.json(
        { error: "선택한 답안이 필요합니다." },
        { status: 400 }
      );
    }

    const todayQuiz = getTodayQuiz();
    const quiz = quizzes.find((q) => q.id === todayQuiz.id);

    if (!quiz) {
      return NextResponse.json(
        { error: "퀴즈를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const isCorrect = selectedAnswer === quiz.correct_answer;

    // 이미 답안을 제출했는지 확인
    const { data: existingResult } = await supabase
      .from("quiz_results")
      .select("id")
      .eq("user_id", user.user.id)
      .eq("quiz_id", todayQuiz.id)
      .single();

    if (existingResult) {
      return NextResponse.json(
        { error: "이미 답안을 제출한 퀴즈입니다." },
        { status: 409 }
      );
    }

    // 답안 저장
    const { error: resultError } = await supabase.from("quiz_results").insert({
      user_id: user.user.id,
      quiz_id: todayQuiz.id,
      selected_answer: selectedAnswer,
      is_correct: isCorrect,
      answered_at: new Date().toISOString(),
    });

    if (resultError) {
      throw resultError;
    }

    // 퀴즈 완료 활동 기록
    try {
      await supabase.from("daily_activities").upsert(
        {
          user_id: user.user.id,
          date: getSeoulDateKey(),
          quiz_completed: true,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,date",
        }
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
    console.error("퀴즈 답안 제출 실패:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "답안 제출에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}
