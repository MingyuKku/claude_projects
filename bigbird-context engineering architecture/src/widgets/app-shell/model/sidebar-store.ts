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
        isCollapsed: false,
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
