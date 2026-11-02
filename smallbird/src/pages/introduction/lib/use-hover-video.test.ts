import { act, renderHook } from "@testing-library/react";

import { useHoverVideo } from "./use-hover-video";

function mockMatchMedia(matches: boolean) {
  vi.stubGlobal("matchMedia", () => ({ matches }));
}

function attachVideo(result: { current: ReturnType<typeof useHoverVideo> }) {
  const video = {
    play: vi.fn(() => Promise.resolve()),
    pause: vi.fn(),
    currentTime: 5,
  };
  result.current.videoRef.current = video as unknown as HTMLVideoElement;
  return video;
}

describe("useHoverVideo", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("play 는 비디오를 재생하고 reject 되어도 오류를 내지 않는다", async () => {
    const { result } = renderHook(() => useHoverVideo());
    const video = attachVideo(result);
    video.play.mockRejectedValue(new Error("blocked"));

    result.current.play();
    await Promise.resolve();

    expect(video.play).toHaveBeenCalled();
  });

  it("PC 폭에서 stop 은 비디오를 멈추고 처음으로 되감는다", () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useHoverVideo());
    const video = attachVideo(result);

    result.current.stop();

    expect(video.pause).toHaveBeenCalled();
    expect(video.currentTime).toBe(0);
  });

  it("TAB 이하 폭에서 stop 은 비디오를 멈추지 않는다", () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useHoverVideo());
    const video = attachVideo(result);

    result.current.stop();

    expect(video.pause).not.toHaveBeenCalled();
  });

  it("markReady 를 호출하면 isReady 가 true 가 된다", () => {
    const { result } = renderHook(() => useHoverVideo());
    expect(result.current.isReady).toBe(false);

    act(() => result.current.markReady());

    expect(result.current.isReady).toBe(true);
  });
});
