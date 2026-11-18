import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface SidebarState {
  /** PC(1440 이상) 사이드바의 접힘 여부. 태블릿 레일과 전체 메뉴(Sheet)는 이 값과 무관함. */
  isCollapsed: boolean;
  toggleCollapsed: () => void;
  /** 접힌 레일에서 하위 메뉴가 있는 항목을 눌렀을 때 사이드바를 펼침. */
  expand: () => void;
}

// 접힘 여부는 저장하지 않음: 새로고침하면 항상 펼친 상태로 시작함.
export const useSidebarStore = create<SidebarState>()(
  devtools(
    (set) => ({
      isCollapsed: false,
      toggleCollapsed: () =>
        set((state) => ({ isCollapsed: !state.isCollapsed })),
      expand: () => set({ isCollapsed: false }),
    }),
    { name: "sidebar" },
  ),
);
