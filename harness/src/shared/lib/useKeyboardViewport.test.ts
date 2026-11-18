import { act, renderHook } from "@testing-library/react";

import { useKeyboardViewport } from "./useKeyboardViewport";

function stubLayoutHeight(height: number) {
  vi.spyOn(document.documentElement, "clientHeight", "get").mockReturnValue(
    height,
  );
}

function stubViewport(box: {
  height: number;
  offsetTop?: number;
  scale?: number;
}) {
  const viewport = Object.assign(new EventTarget(), {
    offsetTop: 0,
    scale: 1,
    ...box,
  });
  vi.stubGlobal("visualViewport", viewport);
  return {
    update(next: Partial<typeof viewport>) {
      Object.assign(viewport, next);
      viewport.dispatchEvent(new Event("scroll"));
    },
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("useKeyboardViewport", () => {
  it("키보드가 레이아웃을 줄이지 않고 덮으면(iOS) 보이는 영역 높이와 내린 만큼을 돌려준다", () => {
    stubLayoutHeight(750);
    stubViewport({ height: 420, offsetTop: 120 });
    const { result } = renderHook(() => useKeyboardViewport(true));
    expect(result.current).toEqual({ height: 420, pan: 120, gap: 330 });
  });

  it("내린 만큼은 0~gap으로 제한한다 (WebKit 297779)", () => {
    stubLayoutHeight(750);
    const viewport = stubViewport({ height: 420, offsetTop: 500 });
    const { result } = renderHook(() => useKeyboardViewport(true));
    expect(result.current?.pan).toBe(330);
    act(() => viewport.update({ offsetTop: -20 }));
    expect(result.current?.pan).toBe(0);
  });

  it("레이아웃이 함께 줄면(Android resizes-content) null이다", () => {
    stubLayoutHeight(420);
    stubViewport({ height: 420 });
    const { result } = renderHook(() => useKeyboardViewport(true));
    expect(result.current).toBeNull();
  });

  it("키보드가 닫혔거나 핀치 확대 중이면 null이다", () => {
    stubLayoutHeight(750);
    const viewport = stubViewport({ height: 420 });
    const { result, rerender } = renderHook(
      ({ isOpen }) => useKeyboardViewport(isOpen),
      { initialProps: { isOpen: false } },
    );
    expect(result.current).toBeNull();
    rerender({ isOpen: true });
    expect(result.current).not.toBeNull();
    act(() => viewport.update({ scale: 1.5 }));
    expect(result.current).toBeNull();
  });
});
