import { act, renderHook } from "@testing-library/react";

import {
  formatCountdown,
  remainingSeconds,
  useCountdown,
} from "./useCountdown";

describe("remainingSeconds", () => {
  it("남은 시간을 올림한다 — 0.1초라도 남았으면 1초로 보인다", () => {
    expect(remainingSeconds(10_100, 10_000)).toBe(1);
  });

  it("만료 시각 정각은 0", () =>
    expect(remainingSeconds(10_000, 10_000)).toBe(0));

  // 백그라운드 탭에서 틱이 씹혀도 벽시계로 계산하므로 음수가 나오지 않는다.
  it("만료 시각이 지났으면 음수가 아니라 0", () => {
    expect(remainingSeconds(10_000, 80_000)).toBe(0);
  });

  it("60초 뒤면 60", () => expect(remainingSeconds(60_000, 0)).toBe(60));
});

describe("formatCountdown", () => {
  it("60 은 01:00", () => expect(formatCountdown(60)).toBe("01:00"));
  it("59 는 00:59", () => expect(formatCountdown(59)).toBe("00:59"));
  it("0 은 00:00", () => expect(formatCountdown(0)).toBe("00:00"));
  it("125 는 02:05", () => expect(formatCountdown(125)).toBe("02:05"));
});

describe("useCountdown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("시작 전에는 00:00 이고 만료로 본다", () => {
    const { result } = renderHook(() => useCountdown());
    expect(result.current.text).toBe("00:00");
    expect(result.current.isExpired()).toBe(true);
  });

  it("start 직후 첫 틱을 기다리지 않고 전체 시간을 보여준다", () => {
    const { result } = renderHook(() => useCountdown());
    act(() => result.current.start());
    expect(result.current.secondsLeft).toBe(60);
    expect(result.current.text).toBe("01:00");
    expect(result.current.isExpired()).toBe(false);
  });

  it("1초마다 줄어들고 0 에서 멈추며 만료가 된다", () => {
    const { result } = renderHook(() => useCountdown());
    act(() => result.current.start(3));
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.secondsLeft).toBe(2);
    act(() => vi.advanceTimersByTime(5000));
    expect(result.current.secondsLeft).toBe(0);
    expect(result.current.isExpired()).toBe(true);
  });

  it("stop 하면 표시값이 멈추지만 만료 판정은 실제 시간을 따른다", () => {
    const { result } = renderHook(() => useCountdown());
    act(() => result.current.start(10));
    act(() => vi.advanceTimersByTime(2000));
    act(() => result.current.stop());
    act(() => vi.advanceTimersByTime(20_000));
    expect(result.current.secondsLeft).toBe(8);
    expect(result.current.isExpired()).toBe(true);
  });

  it("start 를 다시 부르면 새 시간으로 재시작한다", () => {
    const { result } = renderHook(() => useCountdown());
    act(() => result.current.start(10));
    act(() => vi.advanceTimersByTime(5000));
    act(() => result.current.start(10));
    expect(result.current.secondsLeft).toBe(10);
  });
});
