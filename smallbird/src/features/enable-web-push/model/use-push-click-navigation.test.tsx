import { renderHook } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router";

import { usePushClickNavigation } from "./use-push-click-navigation";

import type { ReactNode } from "react";

function wrapper({ children }: { children: ReactNode }) {
  return <MemoryRouter initialEntries={["/"]}>{children}</MemoryRouter>;
}

function useHookWithLocation() {
  usePushClickNavigation();
  return useLocation();
}

describe("usePushClickNavigation", () => {
  let container: EventTarget;

  beforeEach(() => {
    container = new EventTarget();
    Object.defineProperty(navigator, "serviceWorker", {
      value: container,
      configurable: true,
    });
  });

  function postMessage(data: unknown) {
    container.dispatchEvent(new MessageEvent("message", { data }));
  }

  it("알림 클릭 메시지를 받으면 그 경로로 이동한다", async () => {
    const { result } = renderHook(useHookWithLocation, { wrapper });

    postMessage({ type: "web-push-click", link: "/mypage" });

    await vi.waitFor(() => expect(result.current.pathname).toBe("/mypage"));
  });

  it("앱 경로가 아닌 링크는 이동하지 않는다", () => {
    const { result } = renderHook(useHookWithLocation, { wrapper });

    postMessage({ type: "web-push-click", link: "https://evil.example/" });

    expect(result.current.pathname).toBe("/");
  });

  it("언마운트하면 더 이상 메시지를 받지 않는다", () => {
    const { result, unmount } = renderHook(useHookWithLocation, { wrapper });
    unmount();

    postMessage({ type: "web-push-click", link: "/mypage" });

    expect(result.current.pathname).toBe("/");
  });
});
