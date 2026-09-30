import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User } from "@restaurant-management/shared";
import { createEncryptedStorage } from "./auth-storage";

const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY;

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User | null, token: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() =>
        createEncryptedStorage(localStorage, ENCRYPTION_KEY),
      ),
    },
  ),
);
