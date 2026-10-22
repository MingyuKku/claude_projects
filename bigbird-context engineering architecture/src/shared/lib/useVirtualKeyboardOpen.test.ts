import { act, renderHook } from "@testing-library/react";

import { useVirtualKeyboardOpen } from "./useVirtualKeyboardOpen";

function stubMedia(...matching: string[]) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: matching.includes(query),
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

function stubViewport(height: number) {
  const viewport = Object.assign(new EventTarget(), { height, offsetTop: 0 });
  vi.stubGlobal("visualViewport", viewport);
  return {
    resize(next: number) {
      viewport.height = next;
      viewport.dispatchEvent(new Event("resize"));
    },
  };
}

const TOUCH_BELOW_DESKTOP = ["(pointer: coarse)", "(max-width: 1439px)"];

beforeEach(() => vi.stubGlobal("innerHeight", 800));
afterEach(() => vi.unstubAllGlobals());

describe("useVirtualKeyboardOpen", () => {
  it("포커스가 있고 보이는 영역이 150px 넘게 줄면 열림으로 본다", () => {
    stubMedia(...TOUCH_BELOW_DESKTOP);
    const viewport = stubViewport(800);
    const { result } = renderHook(() => useVirtualKeyboardOpen(true));
    expect(result.current).toBe(false);
    act(() => viewport.resize(450));
    expect(result.current).toBe(true);
    act(() => viewport.resize(790));
    expect(result.current).toBe(false);
  });

  it("주소창 접힘 같은 작은 변화는 열림으로 보지 않는다", () => {
    stubMedia(...TOUCH_BELOW_DESKTOP);
    stubViewport(720);
    const { result } = renderHook(() => useVirtualKeyboardOpen(true));
    expect(result.current).toBe(false);
  });

  it("포커스가 없으면 닫힘이다", () => {
    stubMedia(...TOUCH_BELOW_DESKTOP);
    stubViewport(450);
    const { result } = renderHook(() => useVirtualKeyboardOpen(false));
    expect(result.current).toBe(false);
  });

  it("터치 기기가 아니거나 데스크톱 폭이면 닫힘이다", () => {
    stubViewport(450);
    stubMedia("(max-width: 1439px)");
    expect(renderHook(() => useVirtualKeyboardOpen(true)).result.current).toBe(
      false,
    );
    stubMedia("(pointer: coarse)");
    expect(renderHook(() => useVirtualKeyboardOpen(true)).result.current).toBe(
      false,
    );
  });

  it("visualViewport를 지원하지 않으면 닫힘이다", () => {
    stubMedia(...TOUCH_BELOW_DESKTOP);
    const { result } = renderHook(() => useVirtualKeyboardOpen(true));
    expect(result.current).toBe(false);
  });

  it("키보드가 뜰 때 innerHeight까지 줄어드는 환경에서도 감지한다", () => {
    stubMedia(...TOUCH_BELOW_DESKTOP);
    const viewport = stubViewport(800);
    const { result, rerender } = renderHook(
      ({ focused }) => useVirtualKeyboardOpen(focused),
      { initialProps: { focused: false } },
    );
    expect(result.current).toBe(false);
    // 실제 순서: 입력에 포커스 → 키보드가 뜨며 화면 높이가 줄어듦
    rerender({ focused: true });
    expect(result.current).toBe(false);
    vi.stubGlobal("innerHeight", 450);
    act(() => viewport.resize(450));
    expect(result.current).toBe(true);
  });
});
