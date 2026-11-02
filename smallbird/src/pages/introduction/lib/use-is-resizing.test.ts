import { act, renderHook } from "@testing-library/react";

import { useIsResizing } from "./use-is-resizing";

describe("useIsResizing", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("처음에는 false 이다", () => {
    const { result } = renderHook(() => useIsResizing());

    expect(result.current).toBe(false);
  });

  it("리사이즈 중에는 true 이고 멈춘 뒤 150ms 가 지나면 false 로 돌아온다", () => {
    const { result } = renderHook(() => useIsResizing());

    act(() => {
      window.dispatchEvent(new Event("resize"));
    });
    expect(result.current).toBe(true);

    act(() => {
      vi.advanceTimersByTime(149);
    });
    expect(result.current).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe(false);
  });

  it("리사이즈가 이어지면 타이머를 다시 시작한다", () => {
    const { result } = renderHook(() => useIsResizing());

    act(() => {
      window.dispatchEvent(new Event("resize"));
      vi.advanceTimersByTime(100);
      window.dispatchEvent(new Event("resize"));
      vi.advanceTimersByTime(100);
    });

    expect(result.current).toBe(true);
  });
});
