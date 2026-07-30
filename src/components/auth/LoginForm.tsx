"use client";

import { useState, useCallback, useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { login } from "@/app/login/action";
import { FORM_DATA, ROUTE_PATH } from "@/config/constants";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function LoginForm() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction, isPending] = useActionState(login, {
    user: null,
    error: "",
  });

  useEffect(() => {
    if (!state.user) return;

    setUser(state.user);
    router.push(ROUTE_PATH.HOME);
  }, [state.user, setUser, router]);

  const handleTogglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  return (
    <form action={formAction} className="space-y-4 w-full">
      <div className="space-y-2">
        <Label htmlFor={FORM_DATA.EMAIL} className="text-sm text-foreground">
          이메일
        </Label>
        <Input
          id={FORM_DATA.EMAIL}
          type={FORM_DATA.EMAIL}
          name={FORM_DATA.EMAIL}
          autoComplete="email"
          placeholder="이메일을 입력하세요"
          className="h-12"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={FORM_DATA.PASSWORD} className="text-sm text-foreground">
          비밀번호
        </Label>
        <div className="relative">
          <Input
            id={FORM_DATA.PASSWORD}
            type={showPassword ? "text" : FORM_DATA.PASSWORD}
            name={FORM_DATA.PASSWORD}
            autoComplete="current-password"
            placeholder="비밀번호를 입력하세요"
            className="h-12 pr-12"
            required
          />
          <button
            type="button"
            onClick={handleTogglePasswordVisibility}
            className="absolute right-0.5 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
          >
            {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
          </button>
        </div>
      </div>

      {state?.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <Button
        type="submit"
        className="w-full h-12 font-medium cursor-pointer"
        disabled={isPending}
      >
        {isPending ? "로그인 중..." : "로그인"}
      </Button>
    </form>
  );
}
