import { create } from "zustand";

interface AppState {
  origin: string;
  setOrigin: (origin: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  origin: "",
  setOrigin: (origin) => set({ origin }),
}));
