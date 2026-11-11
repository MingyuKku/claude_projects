import { useSidebarStore } from "./sidebar-store";

afterEach(() => {
  localStorage.clear();
  useSidebarStore.setState({ isCollapsed: false });
});

describe("useSidebarStore", () => {
  it("펼친 상태가 기본이다", () => {
    expect(useSidebarStore.getInitialState().isCollapsed).toBe(false);
  });

  it("접힘 여부를 토글한다", () => {
    useSidebarStore.getState().toggleCollapsed();
    expect(useSidebarStore.getState().isCollapsed).toBe(true);
    useSidebarStore.getState().toggleCollapsed();
    expect(useSidebarStore.getState().isCollapsed).toBe(false);
  });

  it("expand는 접힌 사이드바를 펼치고, 이미 펼쳐져 있으면 그대로 둔다", () => {
    useSidebarStore.setState({ isCollapsed: true });
    useSidebarStore.getState().expand();
    expect(useSidebarStore.getState().isCollapsed).toBe(false);
    useSidebarStore.getState().expand();
    expect(useSidebarStore.getState().isCollapsed).toBe(false);
  });

  it("접힘 상태를 저장하지 않아 새로고침하면 펼친 상태로 돌아간다", () => {
    useSidebarStore.getState().toggleCollapsed();
    expect(localStorage.getItem("bigbird:sidebar")).toBeNull();
  });
});
