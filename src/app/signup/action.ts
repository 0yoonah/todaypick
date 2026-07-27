"use server";

import { revalidatePath } from "next/cache";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";
import {
  validateEmail,
  validateNickname,
  validatePassword,
  formatAuthError,
} from "@/utils/authUtils";
import { FORM_DATA, ROUTE_PATH } from "@/config/constants";

interface SignUpData {
  email: string;
  password: string;
  confirmPassword: string;
  nickname: string;
}

const validateSignupData = (formData: SignUpData) => {
  // 닉네임 유효성 검사
  if (!validateNickname(formData.nickname)) {
    return { error: formatAuthError("Invalid nickname") };
  }

  // 이메일 유효성 검사
  if (!validateEmail(formData.email)) {
    return { error: formatAuthError("Invalid email") };
  }

  // 비밀번호 유효성 검사
  const passwordValidation = validatePassword(formData.password);
  if (!passwordValidation.isValid) {
    return { error: passwordValidation.errors.join(", ") };
  }

  // 비밀번호 확인
  if (formData.password !== formData.confirmPassword) {
    return { error: formatAuthError("Password mismatch") };
  }

  return { error: "" };
};

export async function signup(
  prevState: { user: User | null; error: string },
  formData: FormData
) {
  const supabase = await createClient();

  const data: SignUpData = {
    email: formData.get(FORM_DATA.EMAIL) as string,
    password: formData.get(FORM_DATA.PASSWORD) as string,
    confirmPassword: formData.get(FORM_DATA.CONFIRM_PASSWORD) as string,
    nickname: formData.get(FORM_DATA.NICKNAME) as string,
  };

  // 유효성 검사
  const validation = validateSignupData(data);
  if (validation.error) {
    return { user: null, error: validation.error };
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        nickname: data.nickname,
      },
    },
  });

  if (error) {
    return {
      user: null,
      error: formatAuthError(error.message),
    };
  }

  revalidatePath(ROUTE_PATH.HOME, "layout");
  return { user, error: "" };
}
