import { act, renderHook } from "@testing-library/react";

import { useCoalescedRefresh } from "./use-coalesced-refresh";

describe("useCoalescedRefresh", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("짧은 사이에 여러 번 불러도 한 번만 다시 받는다", () => {
    const refresh = vi.fn();
    const { result } = renderHook(() => useCoalescedRefresh(refresh));

    act(() => {
      result.current();
      result.current();
      result.current();
    });
    expect(refresh).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(300));
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("화면을 떠나면 예약된 재조회를 취소한다", () => {
    const refresh = vi.fn();
    const { result, unmount } = renderHook(() => useCoalescedRefresh(refresh));

    act(() => result.current());
    unmount();
    act(() => vi.advanceTimersByTime(300));
    expect(refresh).not.toHaveBeenCalled();
  });
});
