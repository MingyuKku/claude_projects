import { act, fireEvent, render } from "@testing-library/react";
import { useRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { OverlayScrollbar } from "./OverlayScrollbar";

function Example() {
  const ref = useRef<HTMLElement>(null);
  return (
    <div>
      <main ref={ref} />
      <OverlayScrollbar scrollerRef={ref} />
    </div>
  );
}

// 본문 100 높이. 막대 자리도 100, 막대는 넘치는 비율만큼.
function setup(scrollHeight: number) {
  vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(100);
  vi.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockReturnValue(
    scrollHeight,
  );
  vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(25);
  HTMLElement.prototype.setPointerCapture = vi.fn();
  const { container } = render(<Example />);
  const track = container.querySelector<HTMLElement>("[aria-hidden]")!;
  return {
    main: container.querySelector("main")!,
    track,
    thumb: track.querySelector<HTMLElement>(".touch-none")!,
  };
}

afterEach(() => vi.restoreAllMocks());

describe("OverlayScrollbar", () => {
  it("내용이 넘치지 않으면 막대를 숨긴다", () => {
    expect(setup(100).track).toHaveAttribute("hidden");
  });

  it("막대 높이는 보이는 비율이고 너무 작아지지 않는다", () => {
    expect(setup(400).thumb.style.height).toBe("25px");
    vi.restoreAllMocks();
    expect(setup(10_000).thumb.style.height).toBe("24px");
  });

  it("막대를 끌면 비율대로 스크롤하고 놓으면 멈춘다", () => {
    const { main, thumb } = setup(400);
    fireEvent.pointerDown(thumb, { clientY: 0, pointerId: 1 });
    // 막대가 움직일 자리 75, 스크롤할 길이 300.
    fireEvent.pointerMove(thumb, { clientY: 25, pointerId: 1 });
    expect(main.scrollTop).toBe(100);
    fireEvent.pointerUp(thumb, { pointerId: 1 });
    fireEvent.pointerMove(thumb, { clientY: 75, pointerId: 1 });
    expect(main.scrollTop).toBe(100);
  });

  it("막대 위의 휠은 본문을 스크롤한다", () => {
    const { main, thumb } = setup(400);
    main.scrollBy = vi.fn();
    fireEvent.wheel(thumb, { deltaY: 40 });
    expect(main.scrollBy).toHaveBeenCalledWith({ top: 40 });
  });

  it("처음에는 보였다가 잠시 뒤 숨김 상태가 되고, 스크롤하면 다시 보인다", () => {
    vi.useFakeTimers();
    try {
      const { main, track } = setup(400);
      expect(track).toHaveAttribute("data-idle", "false");

      act(() => {
        vi.advanceTimersByTime(1500);
      });
      expect(track).toHaveAttribute("data-idle", "true");

      fireEvent.scroll(main);
      expect(track).toHaveAttribute("data-idle", "false");
    } finally {
      vi.useRealTimers();
    }
  });
});
