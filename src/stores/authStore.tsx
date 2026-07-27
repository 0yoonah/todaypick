"use client";

import { create } from "zustand";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";
import { AuthState } from "@/types/auth";

interface AuthStore extends AuthState {
  initialize: () => Promise<void>;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  // 초기 상태
  user: null,
  loading: true,

  // 초기화
  initialize: async () => {
    const supabase = createClient();

    try {
      set({ loading: true });

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        console.error("Auth initialization error:", error);
        set({ user: null });
        return;
      }

      set({ user });
    } catch (error) {
      console.error("Auth initialization error:", error);
      set({ user: null });
    } finally {
      set({ loading: false });
    }
  },

  setUser: (user: User | null) => set({ user }),
  setLoading: (loading: boolean) => set({ loading }),
  clearAuth: () => set({ user: null, loading: false }),
}));
