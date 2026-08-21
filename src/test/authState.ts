import type { User } from "@supabase/supabase-js";
import { useAuthStore } from "@/stores/authStore";

// 컴포넌트 테스트에서 로그인 여부만 바꾸면 되는 경우가 많아 두 함수로 감싼다.
export function signInTestUser(id = "u1") {
  useAuthStore.setState({ user: { id } as unknown as User, loading: false });
}

export function signOutTestUser() {
  useAuthStore.setState({ user: null, loading: false });
}
