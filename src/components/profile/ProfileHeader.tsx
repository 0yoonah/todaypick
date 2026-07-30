"use client";

import { useState, useCallback } from "react";
import { FiEdit3, FiX } from "react-icons/fi";
import { useAuthStore } from "@/stores/authStore";
import { useProfileMutation } from "@/hooks/useProfileMutation";
import { useProfileQuery } from "@/hooks/useProfileQuery";
import { getInitials } from "@/utils/profileUtils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ProfileHeader() {
  const { user } = useAuthStore();
  const { data: userProfile } = useProfileQuery();
  const profileMutation = useProfileMutation();

  const nickname = userProfile?.nickname;
  const avatarUrl = userProfile?.avatar_url;

  const [isEditing, setIsEditing] = useState(false);
  const [editNickname, setEditNickname] = useState<string>(nickname);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);

  const clearPreviewUrl = useCallback(() => {
    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
  }, [previewUrl]);

  const handleSaveProfile = useCallback(async () => {
    if (!user) return;
    if (!editNickname.trim()) {
      return;
    }

    try {
      await profileMutation.mutateAsync({
        nickname: editNickname.trim(),
        file: selectedFile || undefined,
        removeAvatar,
      });
    } catch {
      return;
    }

    setSelectedFile(null);
    clearPreviewUrl();
    setRemoveAvatar(false);
    setIsEditing(false);
  }, [
    editNickname,
    selectedFile,
    removeAvatar,
    profileMutation,
    user,
    clearPreviewUrl,
  ]);

  const handleCancelEdit = useCallback(() => {
    if (userProfile) {
      setEditNickname(userProfile.nickname);
    }
    setSelectedFile(null);
    clearPreviewUrl();
    setRemoveAvatar(false);
    setIsEditing(false);
    profileMutation.reset();
  }, [userProfile, profileMutation, clearPreviewUrl]);

  const handleRemoveAvatar = useCallback(() => {
    setSelectedFile(null);
    clearPreviewUrl();
    setRemoveAvatar(true);
  }, [clearPreviewUrl]);

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        clearPreviewUrl();
        setSelectedFile(file);
        setRemoveAvatar(false);

        // 미리보기 URL 생성 (blob URL은 임시이므로 미리보기용으로만 사용)
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      }
    },
    [clearPreviewUrl]
  );

  if (!user) return null;

  return (
    <section className="p-5 sm:p-6" aria-labelledby="profile-summary-title">
      <div className="flex items-start gap-4 sm:items-center sm:gap-5">
          <div className="relative">
            {isEditing ? (
              <>
                <label htmlFor="input-file" className="cursor-pointer">
                  <Avatar className="size-16 border-2 border-background ring-1 ring-border transition-colors hover:ring-primary sm:size-20">
                    <AvatarImage
                      key={previewUrl || avatarUrl || "default"}
                      src={
                        previewUrl ||
                        (!removeAvatar ? avatarUrl || undefined : undefined)
                      }
                    />
                    <AvatarFallback className="bg-primary text-lg font-bold text-primary-foreground">
                      {getInitials(editNickname || nickname || "사용자")}
                    </AvatarFallback>
                  </Avatar>
                </label>
                <input
                  id="input-file"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {(selectedFile || (!removeAvatar && avatarUrl)) && (
                  <Button
                    onClick={handleRemoveAvatar}
                    variant="destructive"
                    size="sm"
                    className="absolute -right-1 -top-1 size-6 cursor-pointer rounded-full p-0"
                    title="이미지 제거"
                  >
                    <FiX className="h-3 w-3" />
                  </Button>
                )}
              </>
            ) : (
              <Avatar className="size-16 border-2 border-background ring-1 ring-border sm:size-20">
                <AvatarImage
                  key={avatarUrl || "default"}
                  src={previewUrl || avatarUrl || undefined}
                />
                <AvatarFallback className="bg-primary text-lg font-bold text-primary-foreground">
                  {getInitials(editNickname || nickname || "사용자")}
                </AvatarFallback>
              </Avatar>
            )}
          </div>

          <div className="min-w-0 flex-1">
            {isEditing ? (
              <div className="max-w-md space-y-3">
                <div>
                  <Label className="mb-2 block text-sm font-medium text-foreground">
                    닉네임
                  </Label>
                  <Input
                    type="text"
                    value={editNickname}
                    onChange={(e) => setEditNickname(e.target.value)}
                    placeholder="닉네임을 입력하세요"
                  />
                  {profileMutation.error && (
                    <span className="text-sm text-destructive">
                      {profileMutation.error instanceof Error
                        ? profileMutation.error.message
                        : "프로필 업데이트에 실패했습니다."}
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveProfile}
                    size="sm"
                    disabled={profileMutation.isPending}
                  >
                    {profileMutation.isPending ? "저장 중" : "저장"}
                  </Button>
                  <Button
                    onClick={handleCancelEdit}
                    size="sm"
                    variant="outline"
                    disabled={profileMutation.isPending}
                  >
                    취소
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="mb-1 text-xs font-semibold text-muted-foreground">
                    내 프로필
                  </p>
                  <h2
                    id="profile-summary-title"
                    className="truncate text-xl font-bold tracking-[-0.02em] text-foreground"
                  >
                    {nickname}
                  </h2>
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    {user.email}
                  </p>
                </div>
                <Button
                  onClick={() => {
                    profileMutation.reset();
                    setEditNickname(nickname || "");
                    clearPreviewUrl();
                    setSelectedFile(null);
                    setRemoveAvatar(false);
                    setIsEditing(true);
                  }}
                  variant="outline"
                  size="sm"
                  className="w-fit cursor-pointer"
                >
                  <FiEdit3 className="h-4 w-4" />
                  프로필 수정
                </Button>
              </div>
            )}
          </div>
      </div>
    </section>
  );
}
