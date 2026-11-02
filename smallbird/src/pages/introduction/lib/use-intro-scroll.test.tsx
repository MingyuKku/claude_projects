import { act, fireEvent, render, screen } from "@testing-library/react";

import { HERO_SHRINK_DISTANCE } from "../model/constants";
import { useIntroScroll } from "./use-intro-scroll";

function Probe() {
  const { scrollerRef, heroProgress, handleScroll } = useIntroScroll();

  return (
    <div data-testid="scroller" ref={scrollerRef} onScroll={handleScroll}>
      <span data-testid="progress">{heroProgress}</span>
    </div>
  );
}

describe("useIntroScroll", () => {
  let frames: FrameRequestCallback[];

  beforeEach(() => {
    frames = [];
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      frames.push(callback);
      return frames.length;
    });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("스크롤하면 다음 프레임에 히어로 진행도를 갱신한다", () => {
    render(<Probe />);
    const scroller = screen.getByTestId("scroller");

    scroller.scrollTop = HERO_SHRINK_DISTANCE / 2;
    fireEvent.scroll(scroller);
    expect(screen.getByTestId("progress")).toHaveTextContent("0");

    act(() => frames.forEach((callback) => callback(0)));
    expect(screen.getByTestId("progress")).toHaveTextContent("0.5");
  });

  it("프레임이 대기 중이면 스크롤 이벤트가 프레임을 더 예약하지 않는다", () => {
    render(<Probe />);
    const scroller = screen.getByTestId("scroller");

    fireEvent.scroll(scroller);
    fireEvent.scroll(scroller);

    expect(frames).toHaveLength(1);
  });

  it("언마운트하면 대기 중인 프레임을 취소한다", () => {
    const { unmount } = render(<Probe />);

    fireEvent.scroll(screen.getByTestId("scroller"));
    unmount();

    expect(window.cancelAnimationFrame).toHaveBeenCalledWith(1);
  });
});
