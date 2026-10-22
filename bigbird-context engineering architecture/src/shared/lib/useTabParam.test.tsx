import { act, renderHook } from "@testing-library/react";
import { MemoryRouter, useLocation, useNavigate } from "react-router";

import { useTabParam } from "./useTabParam";

import type { ReactNode } from "react";

const TABS = ["master", "company", "bank"] as const;

function setup(
  initialEntry: string,
  options: { history?: "push" | "replace"; resetParams?: string[] } = {},
) {
  function wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter initialEntries={["/prev", initialEntry]} initialIndex={1}>
        {children}
      </MemoryRouter>
    );
  }

  return renderHook(
    () => ({
      tabParam: useTabParam({ tabs: TABS, defaultTab: "master", ...options }),
      location: useLocation(),
      navigate: useNavigate(),
    }),
    { wrapper },
  );
}

describe("useTabParam", () => {
  it("쿼리가 없으면 기본 탭이다", () => {
    const { result } = setup("/account");
    expect(result.current.tabParam.tab).toBe("master");
  });

  it("허용된 값이면 그 탭이다", () => {
    const { result } = setup("/account?tab=bank");
    expect(result.current.tabParam.tab).toBe("bank");
  });

  it("허용 밖의 값은 기본 탭으로 보고 URL은 고치지 않는다", () => {
    const { result } = setup("/account?tab=unknown");
    expect(result.current.tabParam.tab).toBe("master");
    expect(result.current.location.search).toBe("?tab=unknown");
  });

  it("탭을 바꾸면 tab 쿼리를 쓰고 lng 같은 다른 쿼리는 유지한다", () => {
    const { result } = setup("/account?lng=en");
    act(() => result.current.tabParam.setTab("company"));
    expect(result.current.tabParam.tab).toBe("company");
    expect(new URLSearchParams(result.current.location.search).get("lng")).toBe(
      "en",
    );
    expect(result.current.location.search).toContain("tab=company");
  });

  it("resetParams는 탭을 바꿀 때 지운다", () => {
    const { result } = setup("/account?lng=en&panel=create&subId=3", {
      resetParams: ["panel", "subId"],
    });
    act(() => result.current.tabParam.setTab("bank"));
    const params = new URLSearchParams(result.current.location.search);
    expect(params.has("panel")).toBe(false);
    expect(params.has("subId")).toBe(false);
    expect(params.get("lng")).toBe("en");
    expect(params.get("tab")).toBe("bank");
  });

  it("기본 탭으로 돌아가면 tab 키를 지운다", () => {
    const { result } = setup("/account?tab=bank&lng=en");
    act(() => result.current.tabParam.setTab("master"));
    expect(result.current.location.search).toBe("?lng=en");
    expect(result.current.tabParam.tab).toBe("master");
  });

  it("허용 밖이거나 현재와 같은 탭은 무시한다", () => {
    const { result } = setup("/account?tab=bank");
    act(() => result.current.tabParam.setTab("nope"));
    act(() => result.current.tabParam.setTab("bank"));
    expect(result.current.location.search).toBe("?tab=bank");
    act(() => result.current.navigate(-1));
    expect(result.current.location.pathname).toBe("/prev");
  });

  it("기본은 기록을 남겨 뒤로가기로 이전 탭에 돌아간다", () => {
    const { result } = setup("/account");
    act(() => result.current.tabParam.setTab("company"));
    act(() => result.current.tabParam.setTab("bank"));
    act(() => result.current.navigate(-1));
    expect(result.current.tabParam.tab).toBe("company");
    act(() => result.current.navigate(-1));
    expect(result.current.tabParam.tab).toBe("master");
    expect(result.current.location.pathname).toBe("/account");
  });

  it("같은 탭을 한 번에 두 번 요청해도 기록은 한 번만 쌓인다", () => {
    const { result } = setup("/account");
    act(() => {
      result.current.tabParam.setTab("company");
      result.current.tabParam.setTab("company");
    });
    act(() => result.current.navigate(-1));
    expect(result.current.location.pathname).toBe("/account");
    expect(result.current.tabParam.tab).toBe("master");
  });

  it("뒤로 갔다가 같은 탭을 다시 누르면 이동한다", () => {
    const { result } = setup("/account");
    act(() => result.current.tabParam.setTab("company"));
    act(() => result.current.navigate(-1));
    act(() => result.current.tabParam.setTab("company"));
    expect(result.current.tabParam.tab).toBe("company");
  });

  it("history가 replace이면 기록을 남기지 않는다", () => {
    const { result } = setup("/account", { history: "replace" });
    act(() => result.current.tabParam.setTab("company"));
    act(() => result.current.navigate(-1));
    expect(result.current.location.pathname).toBe("/prev");
  });
});
