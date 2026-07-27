"use client";

import { useState, useCallback } from "react";
import { FiEdit3, FiX } from "react-icons/fi";
import { useAuthStore } from "@/stores/authStore";
import { useProfileMutation } from "@/hooks/useProfileMutation";
import { useProfileQuery } from "@/hooks/useProfileQuery";
import { getInitials } from "@/utils/profileUtils";
import { Card, CardContent } from "@/components/ui/card";
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

  const handleSaveProfile = useCallback(async () => {
    if (!user) return;
    if (!editNickname.trim()) {
      return;
    }

    await profileMutation.mutateAsync({
      nickname: editNickname.trim(),
      file: selectedFile || undefined,
    });
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsEditing(false);
  }, [editNickname, selectedFile, profileMutation, user]);

  const handleCancelEdit = useCallback(() => {
    if (userProfile) {
      setEditNickname(userProfile.nickname);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsEditing(false);
    profileMutation.reset();
  }, [userProfile, profileMutation]);

  const handleRemoveAvatar = useCallback(() => {
    setSelectedFile(null);
    setPreviewUrl(null);
  }, []);

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        setSelectedFile(file);

        // 미리보기 URL 생성 (blob URL은 임시이므로 미리보기용으로만 사용)
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      }
    },
    []
  );

  if (!user) return null;

  return (
    <Card className="mb-6 shadow-sm">
      <CardContent className="p-8">
        <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6 mb-6">
          <div className="relative">
            {isEditing ? (
              <>
                <label htmlFor="input-file" className="cursor-pointer">
                  <Avatar className="h-24 w-24 ring-4 ring-primary/20 hover:ring-primary/40 transition-all duration-200">
                    <AvatarImage
                      key={previewUrl || "default"}
                      src={previewUrl || undefined}
                    />
                    <AvatarFallback className="text-xl font-bold bg-primary text-primary-foreground">
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
                <Button
                  onClick={handleRemoveAvatar}
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 cursor-pointer"
                  title="이미지 제거"
                >
                  <FiX className="h-3 w-3" />
                </Button>
              </>
            ) : (
              <Avatar className="h-24 w-24 ring-4 ring-primary/20">
                <AvatarImage
                  key={avatarUrl || "default"}
                  src={previewUrl || avatarUrl || undefined}
                />
                <AvatarFallback className="text-xl font-bold bg-primary text-primary-foreground">
                  {getInitials(editNickname || nickname || "사용자")}
                </AvatarFallback>
              </Avatar>
            )}
          </div>

          <div className="text-center md:text-left flex-1">
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <Label className="block text-sm font-medium text-foreground mb-2">
                    닉네임
                  </Label>
                  <Input
                    type="text"
                    value={editNickname}
                    onChange={(e) => setEditNickname(e.target.value)}
                    placeholder="닉네임을 입력하세요"
                  />
                  {profileMutation.error && (
                    <span className="text-red-500 text-sm">
                      {profileMutation.error instanceof Error
                        ? profileMutation.error.message
                        : "프로필 업데이트에 실패했습니다."}
                    </span>
                  )}
                </div>

                <div className="flex space-x-2 justify-center md:justify-start">
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
              <>
                <div className="flex items-center justify-center md:justify-start space-x-3 mb-2">
                  <h1 className="text-3xl font-bold text-foreground">
                    {nickname}
                  </h1>
                  <Button
                    onClick={() => {
                      profileMutation.reset();
                      setEditNickname(nickname || "");
                      setPreviewUrl(null);
                      setIsEditing(true);
                    }}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10 cursor-pointer"
                  >
                    <FiEdit3 className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-muted-foreground mb-4">{user.email}</p>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
