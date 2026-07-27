"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ProfileUpdateData } from "@/types/auth";

export const useProfileMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profileData: ProfileUpdateData) => {
      let response: Response;

      if (profileData.file) {
        // 파일이 있으면 FormData로 전송
        const formData = new FormData();
        formData.append("nickname", profileData.nickname || "");
        formData.append("file", profileData.file);
        formData.append("removeAvatar", "false");

        response = await fetch("/api/profile", {
          method: "PUT",
          body: formData,
        });
      } else {
        // 파일이 없으면 JSON으로 전송
        response = await fetch("/api/profile", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nickname: profileData.nickname,
            removeAvatar: profileData.removeAvatar || false,
          }),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "프로필 업데이트에 실패했습니다.");
      }

      return response.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (error) => {
      console.error("프로필 업데이트 실패:", error);
    },
  });
};
