import { act, renderHook } from "@testing-library/react";
import { MemoryRouter, useLocation, useNavigate } from "react-router";

import { usePanelParam } from "./usePanelParam";

import type { ReactNode } from "react";

const PANELS = ["create", "permission"] as const;

function setup(initialEntry: string) {
  function wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter initialEntries={["/prev", initialEntry]} initialIndex={1}>
        {children}
      </MemoryRouter>
    );
  }

  return renderHook(
    () => ({
      panelParam: usePanelParam({ panels: PANELS, linkedParams: ["subId"] }),
      location: useLocation(),
      navigate: useNavigate(),
    }),
    { wrapper },
  );
}

describe("usePanelParam", () => {
  it("쿼리가 없거나 허용 밖의 값이면 null이다", () => {
    expect(setup("/a").result.current.panelParam.panel).toBeNull();
    expect(setup("/a?panel=nope").result.current.panelParam.panel).toBeNull();
  });

  it("허용된 값이면 그 패널이 열려 있다", () => {
    expect(setup("/a?panel=create").result.current.panelParam.panel).toBe(
      "create",
    );
  });

  it("열면 연결 값과 함께 쓰고 다른 쿼리는 유지한다", () => {
    const { result } = setup("/a?lng=en");
    act(() =>
      result.current.panelParam.openPanel("permission", { subId: "7" }),
    );
    const params = new URLSearchParams(result.current.location.search);
    expect(result.current.panelParam.panel).toBe("permission");
    expect(params.get("subId")).toBe("7");
    expect(params.get("lng")).toBe("en");
  });

  it("앱 안에서 연 패널은 뒤로가기로 닫힌다", () => {
    const { result } = setup("/a");
    act(() => result.current.panelParam.openPanel("create"));
    act(() => result.current.navigate(-1));
    expect(result.current.panelParam.panel).toBeNull();
    expect(result.current.location.pathname).toBe("/a");
  });

  it("앱 안에서 연 패널을 X로 닫으면 기록이 늘지 않는다", () => {
    const { result } = setup("/a");
    act(() => result.current.panelParam.openPanel("create"));
    act(() => result.current.panelParam.closePanel());
    expect(result.current.panelParam.panel).toBeNull();
    // 한 번 더 뒤로 가면 패널을 열기 전 기록이 아니라 앞 화면.
    act(() => result.current.navigate(-1));
    expect(result.current.location.pathname).toBe("/prev");
  });

  it("열린 채 다른 패널·연결 값으로 바꿔도 기록이 늘지 않는다", () => {
    const { result } = setup("/a");
    act(() =>
      result.current.panelParam.openPanel("permission", { subId: "1" }),
    );
    act(() =>
      result.current.panelParam.openPanel("permission", { subId: "2" }),
    );
    expect(
      new URLSearchParams(result.current.location.search).get("subId"),
    ).toBe("2");
    act(() => result.current.panelParam.closePanel());
    expect(result.current.panelParam.panel).toBeNull();
    act(() => result.current.navigate(-1));
    expect(result.current.location.pathname).toBe("/prev");
  });

  it("주소로 바로 들어온 패널은 닫을 때 쿼리만 지우고 기록을 대체한다", () => {
    const { result } = setup("/a?lng=en&panel=permission&subId=3");
    act(() => result.current.panelParam.closePanel());
    expect(result.current.location.search).toBe("?lng=en");
    expect(result.current.panelParam.panel).toBeNull();
    act(() => result.current.navigate(-1));
    expect(result.current.location.pathname).toBe("/prev");
  });

  it("같은 패널·연결 값을 다시 열면 무시한다", () => {
    const { result } = setup("/a");
    act(() => result.current.panelParam.openPanel("create"));
    act(() => result.current.panelParam.openPanel("create"));
    act(() => result.current.navigate(-1));
    expect(result.current.panelParam.panel).toBeNull();
    expect(result.current.location.pathname).toBe("/a");
  });
});
