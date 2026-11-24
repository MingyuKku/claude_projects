import { renderHook } from "@testing-library/react";

import { usePushMessageRefresh } from "./use-push-message-refresh";

describe("usePushMessageRefresh", () => {
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

  it("새 푸시 도착 메시지를 받으면 콜백을 부른다", () => {
    const onNewNotification = vi.fn();
    renderHook(() => usePushMessageRefresh(true, onNewNotification));

    postMessage({ type: "web-push-received" });

    expect(onNewNotification).toHaveBeenCalledTimes(1);
  });

  it("다른 메시지는 무시한다", () => {
    const onNewNotification = vi.fn();
    renderHook(() => usePushMessageRefresh(true, onNewNotification));

    postMessage({ type: "web-push-click", link: "/campaign" });
    postMessage("web-push-received");

    expect(onNewNotification).not.toHaveBeenCalled();
  });

  it("사용하지 않거나 내려가면 받지 않는다", () => {
    const onNewNotification = vi.fn();
    renderHook(() => usePushMessageRefresh(false, onNewNotification));
    const { unmount } = renderHook(() =>
      usePushMessageRefresh(true, onNewNotification),
    );
    unmount();

    postMessage({ type: "web-push-received" });

    expect(onNewNotification).not.toHaveBeenCalled();
  });
});
