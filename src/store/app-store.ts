import { create } from "zustand";

type AppState = {
  pendingRequests: number;
  showLoader: () => void;
  hideLoader: () => void;
};

export const useAppStore = create<AppState>((set) => ({
  pendingRequests: 0,
  showLoader: () =>
    set((state) => ({ pendingRequests: state.pendingRequests + 1 })),
  hideLoader: () =>
    set((state) => ({
      pendingRequests: Math.max(0, state.pendingRequests - 1),
    })),
}));
