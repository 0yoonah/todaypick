"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FiAlertTriangle } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROUTE_PATH } from "@/config/constants";
import { useAuthStore } from "@/stores/authStore";

const PASSWORD_INPUT_ID = "account-deletion-password";

export default function AccountDeletionSection() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { clearAuth } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(result?.error || "회원 탈퇴를 처리하지 못했습니다.");
      }
    },
    onSuccess: () => {
      clearAuth();
      queryClient.clear();
      router.replace(ROUTE_PATH.HOME);
    },
  });

  const close = () => {
    setOpen(false);
    setPassword("");
    mutation.reset();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!password || mutation.isPending) return;
    mutation.mutate();
  };

  return (
    <section aria-labelledby="account-deletion-title" className="mt-16 border-t pt-8">
      <h2 id="account-deletion-title" className="text-lg font-bold text-foreground">
        회원 탈퇴
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        탈퇴하면 계정과 모든 학습 기록이 즉시 삭제됩니다.
      </p>

      {!open ? (
        <Button
          type="button"
          variant="outline"
          className="mt-4 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => setOpen(true)}
        >
          회원 탈퇴
        </Button>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 max-w-md space-y-4 rounded-lg border border-destructive/40 p-5">
          <p className="flex gap-2 text-sm text-foreground">
            <FiAlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
            읽은 글, 스크랩, 퀴즈·CS 기록, 작성한 글이 모두 삭제되고 복구할 수 없어요.
          </p>
          <div className="space-y-2">
            <Label htmlFor={PASSWORD_INPUT_ID}>비밀번호 확인</Label>
            <Input
              id={PASSWORD_INPUT_ID}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={mutation.isPending}
            />
          </div>
          {mutation.isError && (
            <p role="alert" className="text-sm text-destructive">
              {mutation.error.message}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={close} disabled={mutation.isPending}>
              취소
            </Button>
            <Button type="submit" variant="destructive" disabled={!password || mutation.isPending}>
              {mutation.isPending ? "탈퇴 처리 중..." : "탈퇴하기"}
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
