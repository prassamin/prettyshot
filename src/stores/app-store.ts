import { createStore } from "zustand";
import { useStore } from "zustand";
import { createContext, useContext } from "react";
import { User as SupaUser } from "@supabase/supabase-js";

export interface User extends SupaUser {
  is_pro: boolean;
}

export interface AppState {
  origin: string;
  user: User | null;
  setOrigin: (origin: string) => void;
  setUser: (user?: User | null) => void;
}

export const AppStoreContext = createContext<ReturnType<
  typeof createAppStore
> | null>(null);

export const createAppStore = (initProps?: Partial<AppState>) => {
  return createStore<AppState>()((set) => ({
    origin: initProps?.origin || "",
    user: initProps?.user || null,
    setOrigin: (origin) => set({ origin }),
    setUser: (user) => set({ user: user || null }),
  }));
};

export function useAppStore<T>(selector: (state: AppState) => T): T;
export function useAppStore(): AppState;
export function useAppStore<T>(
  selector?: (state: AppState) => T,
): T | AppState {
  const store = useContext(AppStoreContext);
  if (!store) throw new Error("Missing AppStoreProvider");
  return useStore(store, selector || ((state) => state as unknown as T));
}
