import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: user } = await supabase.auth.getUser();

    if (!user.user) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    // 사용자 프로필 정보 조회
    const { data: profile, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    // avatar_url 동적 생성
    if (profile && profile.avatar_url) {
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(profile.avatar_url);

      // 캐시 무효화를 위해 타임스탬프 추가
      const timestamp = Date.now();
      profile.avatar_url = `${urlData.publicUrl}?t=${timestamp}`;
    } else if (profile) {
      profile.avatar_url = null;
    }

    return NextResponse.json(profile || null, { status: 200 });
  } catch (error) {
    console.error("프로필 조회 오류:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "프로필을 불러오는데 실패했습니다.",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: user } = await supabase.auth.getUser();

    if (!user.user) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      );
    }

    // Content-Type에 따라 처리 방식 분기
    const contentType = request.headers.get("content-type");

    if (contentType?.includes("multipart/form-data")) {
      // 파일 업로드가 포함된 경우
      const formData = await request.formData();
      const file = formData.get("file") as File;
      const nickname = formData.get("nickname") as string;

      if (!nickname) {
        return NextResponse.json(
          { error: "닉네임이 필요합니다." },
          { status: 400 }
        );
      }

      // 파일이 있으면 업로드
      if (file) {
        // 파일 타입 검증
        if (!file.type.startsWith("image/")) {
          return NextResponse.json(
            { error: "이미지 파일만 업로드할 수 있습니다." },
            { status: 400 }
          );
        }

        // 파일 크기 검증 (5MB 제한)
        if (file.size > 5 * 1024 * 1024) {
          return NextResponse.json(
            { error: "파일 크기는 5MB 이하여야 합니다." },
            { status: 400 }
          );
        }

        // 기존 프로필 이미지 삭제
        const { data: existingFiles } = await supabase.storage
          .from("avatars")
          .list("");

        if (existingFiles && existingFiles.length > 0) {
          const fileNamesToDelete = existingFiles
            .filter((file) => file.name.startsWith(user.user.id))
            .map((file) => file.name);

          if (fileNamesToDelete.length > 0) {
            const { error: deleteError } = await supabase.storage
              .from("avatars")
              .remove(fileNamesToDelete);

            if (deleteError) {
              console.warn("기존 파일 삭제 실패:", deleteError);
            } else {
              console.log("기존 파일 삭제 성공:", fileNamesToDelete);
            }
          }
        }

        // 파일명 생성 (사용자ID.확장자) - 고정 파일명으로 덮어쓰기
        const fileExt = file.name.split(".").pop();
        const fileName = `${user.user.id}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(fileName, file, {
            cacheControl: "0", // 캐시 비활성화
            upsert: true, // 기존 파일 덮어쓰기
          });

        if (uploadError) {
          console.error("파일 업로드 실패:", uploadError);
          return NextResponse.json(
            { error: "파일 업로드에 실패했습니다." },
            { status: 500 }
          );
        } else {
          console.log("파일 업로드 성공:", fileName);
        }

        // users 테이블에 저장
        const { error: profileError } = await supabase.from("users").upsert({
          id: user.user.id,
          email: user.user.email,
          nickname: nickname,
          avatar_url: fileName,
        });

        if (profileError) {
          console.error("DB 저장 실패:", profileError);
          throw profileError;
        } else {
          console.log("DB 저장 성공:", fileName);
        }
      } else {
        const { error: profileError } = await supabase.from("users").upsert({
          id: user.user.id,
          email: user.user.email,
          nickname: nickname,
          avatar_url: null,
        });

        if (profileError) {
          throw profileError;
        }
      }
    } else {
      // JSON 데이터인 경우 (닉네임만 업데이트)
      const body: { nickname: string } = await request.json();
      const nickname = body.nickname || "";

      // users 테이블에 저장 (avatar_url은 null로 설정)
      const { error: profileError } = await supabase.from("users").upsert({
        id: user.user.id,
        email: user.user.email,
        nickname: nickname,
        avatar_url: null,
      });

      if (profileError) {
        throw profileError;
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("프로필 업데이트 오류:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "프로필 업데이트에 실패했습니다.",
      },
      { status: 500 }
    );
  }
}
