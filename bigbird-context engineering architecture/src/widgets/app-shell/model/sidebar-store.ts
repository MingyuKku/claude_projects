import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

interface SidebarState {
  /** PC(1440 이상) 사이드바의 접힘 여부. 태블릿 레일과 전체 메뉴(Sheet)는 이 값과 무관함. */
  isCollapsed: boolean;
  toggleCollapsed: () => void;
}

export const useSidebarStore = create<SidebarState>()(
  devtools(
    persist(
      (set) => ({
        // 디자인팀 QA(2026-10-28): 모든 LNB는 접힌(closed) 상태가 기본. 사용자가 펼치면 저장된 값을 따름.
        isCollapsed: true,
        toggleCollapsed: () =>
          set((state) => ({ isCollapsed: !state.isCollapsed })),
      }),
      {
        name: "bigbird:sidebar",
        partialize: (state) => ({ isCollapsed: state.isCollapsed }),
      },
    ),
    { name: "sidebar" },
  ),
);
