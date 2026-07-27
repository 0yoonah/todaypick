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

    const { data: existingProfile, error: profileLookupError } = await supabase
      .from("users")
      .select("avatar_url")
      .eq("id", user.user.id)
      .single();

    if (profileLookupError && profileLookupError.code !== "PGRST116") {
      throw profileLookupError;
    }

    const existingAvatarPath = existingProfile?.avatar_url || null;
    const contentType = request.headers.get("content-type");
    let nickname = "";
    let file: File | null = null;
    let removeAvatar = false;

    if (contentType?.includes("multipart/form-data")) {
      const formData = await request.formData();
      nickname = String(formData.get("nickname") || "").trim();
      const formFile = formData.get("file");
      file = formFile instanceof File && formFile.size > 0 ? formFile : null;
      removeAvatar = formData.get("removeAvatar") === "true";
    } else {
      const body: { nickname?: string; removeAvatar?: boolean } =
        await request.json();
      nickname = body.nickname?.trim() || "";
      removeAvatar = body.removeAvatar === true;
    }

    if (!nickname) {
      return NextResponse.json(
        { error: "닉네임이 필요합니다." },
        { status: 400 }
      );
    }

    if (file && removeAvatar) {
      return NextResponse.json(
        { error: "이미지 변경과 제거를 동시에 요청할 수 없습니다." },
        { status: 400 }
      );
    }

    const allowedImageTypes: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/gif": "gif",
    };

    if (file && !allowedImageTypes[file.type]) {
      return NextResponse.json(
        { error: "JPG, PNG, WEBP, GIF 이미지만 업로드할 수 있습니다." },
        { status: 400 }
      );
    }

    if (file && file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "파일 크기는 5MB 이하여야 합니다." },
        { status: 400 }
      );
    }

    let nextAvatarPath = removeAvatar ? null : existingAvatarPath;
    let uploadedAvatarPath: string | null = null;

    if (file) {
      const extension = allowedImageTypes[file.type];
      uploadedAvatarPath = `${user.user.id}-${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(uploadedAvatarPath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("프로필 이미지 업로드 실패:", uploadError);
        return NextResponse.json(
          { error: "파일 업로드에 실패했습니다." },
          { status: 500 }
        );
      }

      nextAvatarPath = uploadedAvatarPath;
    }

    const { error: profileError } = await supabase.from("users").upsert({
      id: user.user.id,
      email: user.user.email,
      nickname,
      avatar_url: nextAvatarPath,
    });

    if (profileError) {
      if (uploadedAvatarPath) {
        await supabase.storage.from("avatars").remove([uploadedAvatarPath]);
      }
      throw profileError;
    }

    if (
      existingAvatarPath &&
      existingAvatarPath !== nextAvatarPath &&
      (removeAvatar || uploadedAvatarPath)
    ) {
      const { error: deleteError } = await supabase.storage
        .from("avatars")
        .remove([existingAvatarPath]);

      if (deleteError) {
        console.warn("기존 프로필 이미지 정리 실패:", deleteError);
      }
    }

    return NextResponse.json(
      { success: true, avatarUpdated: nextAvatarPath !== existingAvatarPath },
      { status: 200 }
    );
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
