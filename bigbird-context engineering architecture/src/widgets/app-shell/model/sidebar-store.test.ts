import { useSidebarStore } from "./sidebar-store";

afterEach(() => {
  localStorage.clear();
  useSidebarStore.setState({ isCollapsed: false });
});

describe("useSidebarStore", () => {
  it("저장된 값이 없으면 접힌 상태가 기본이다", () => {
    expect(useSidebarStore.getInitialState().isCollapsed).toBe(true);
  });

  it("접힘 여부를 토글하고 localStorage에 저장한다", () => {
    useSidebarStore.getState().toggleCollapsed();
    expect(useSidebarStore.getState().isCollapsed).toBe(true);
    expect(JSON.parse(localStorage.getItem("bigbird:sidebar") ?? "{}")).toEqual(
      { state: { isCollapsed: true }, version: 0 },
    );
  });

  it("새로고침 후에도 저장된 접힘 상태를 복원한다", async () => {
    localStorage.setItem(
      "bigbird:sidebar",
      JSON.stringify({ state: { isCollapsed: true }, version: 0 }),
    );
    await useSidebarStore.persist.rehydrate();
    expect(useSidebarStore.getState().isCollapsed).toBe(true);
  });
});
