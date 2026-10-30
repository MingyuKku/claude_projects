import { act, renderHook } from "@testing-library/react";

import { useInlineExpand } from "./useInlineExpand";

const PADDING = 16;
const SLOT_HEIGHT = 142;

interface Layout {
  boundaryTop: number;
  formBottom: number;
  scrollportHeight: number;
}

function rect(box: { top?: number; bottom?: number }) {
  return { top: 0, bottom: 0, ...box } as DOMRect;
}

// jsdom에는 레이아웃이 없어 위치·크기를 직접 정함. 본문(boundary) 안에 스크롤 영역(main)이 있는 홈과 같은 구조.
function setup(layout: Layout) {
  const scrollport = document.createElement("main");
  scrollport.style.overflowY = "auto";
  const boundary = document.createElement("div");
  boundary.setAttribute("data-search-expand-boundary", "");
  boundary.style.paddingTop = `${PADDING}px`;
  const form = document.createElement("form");
  boundary.append(form);
  scrollport.append(boundary);
  document.body.append(scrollport);

  const state = { ...layout };
  vi.spyOn(boundary, "getBoundingClientRect").mockImplementation(() =>
    rect({ top: state.boundaryTop }),
  );
  vi.spyOn(form, "getBoundingClientRect").mockImplementation(() =>
    rect({ bottom: state.formBottom }),
  );
  Object.defineProperty(scrollport, "clientHeight", {
    get: () => state.scrollportHeight,
  });
  Object.defineProperty(form, "offsetHeight", { value: SLOT_HEIGHT });

  const { result } = renderHook(() =>
    useInlineExpand({ formRef: { current: form } }),
  );
  return { result, state };
}

let observerCallback: (() => void) | undefined;
const disconnect = vi.fn();

beforeEach(() => {
  observerCallback = undefined;
  disconnect.mockClear();
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(callback: () => void) {
        observerCallback = callback;
      }
      observe() {}
      disconnect = disconnect;
    },
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  document.body.replaceChildren();
});

describe("useInlineExpand", () => {
  it("처음에는 접혀 있고 펼치면 입력창 자리 높이를 기억한다", () => {
    const { result } = setup({
      boundaryTop: 0,
      formBottom: 400,
      scrollportHeight: 700,
    });
    expect(result.current.isExpanded).toBe(false);
    expect(result.current.metrics).toBeUndefined();
    act(() => result.current.expand());
    expect(result.current.isExpanded).toBe(true);
    expect(result.current.metrics?.slotHeight).toBe(SLOT_HEIGHT);
  });

  it("펼친 높이는 입력창 아래 끝에서 본문 안쪽 위까지다", () => {
    const { result } = setup({
      boundaryTop: 0,
      formBottom: 300,
      scrollportHeight: 700,
    });
    act(() => result.current.expand());
    // 300 − (0 + 16) = 284, 스크롤 영역 한도 700 − 32 = 668보다 작음.
    expect(result.current.metrics?.overlayHeight).toBe(284);
  });

  it("보이는 영역(스크롤 영역 높이 − 위아래 여백)을 넘지 않는다", () => {
    const { result } = setup({
      boundaryTop: -300,
      formBottom: 900,
      scrollportHeight: 400,
    });
    act(() => result.current.expand());
    // 본문이 위로 스크롤되어 있어도 한도는 스크롤 영역 크기 기준: 400 − 32 = 368.
    expect(result.current.metrics?.overlayHeight).toBe(368);
  });

  it("입력창 자리 높이보다 작아지지 않는다", () => {
    const { result } = setup({
      boundaryTop: 0,
      formBottom: 100,
      scrollportHeight: 120,
    });
    act(() => result.current.expand());
    expect(result.current.metrics?.overlayHeight).toBe(SLOT_HEIGHT);
  });

  it("스크롤 영역이 줄면(키보드) 펼친 높이를 다시 잰다", () => {
    const { result, state } = setup({
      boundaryTop: 0,
      formBottom: 600,
      scrollportHeight: 700,
    });
    act(() => result.current.expand());
    expect(result.current.metrics?.overlayHeight).toBe(584);
    state.scrollportHeight = 400;
    act(() => observerCallback?.());
    expect(result.current.metrics?.overlayHeight).toBe(368);
    expect(result.current.metrics?.slotHeight).toBe(SLOT_HEIGHT);
  });

  it("높이가 같으면 다시 그리지 않고, 접으면 관찰을 멈춘다", () => {
    const { result } = setup({
      boundaryTop: 0,
      formBottom: 300,
      scrollportHeight: 700,
    });
    act(() => result.current.expand());
    const before = result.current.metrics;
    act(() => observerCallback?.());
    expect(result.current.metrics).toBe(before);
    act(() => result.current.collapse());
    expect(result.current.isExpanded).toBe(false);
    expect(disconnect).toHaveBeenCalled();
  });

  it("전환을 보여 줄 수 있으면 접는 중 상태로 머물다가 finishCollapse에서 접는다", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({ matches: false } as MediaQueryList),
    );
    Object.defineProperty(Element.prototype, "animate", {
      configurable: true,
      value: vi.fn(),
    });
    const { result } = setup({
      boundaryTop: 0,
      formBottom: 300,
      scrollportHeight: 700,
    });
    act(() => result.current.expand());
    act(() => result.current.collapse());
    expect(result.current.phase).toBe("closing");
    expect(result.current.isExpanded).toBe(false);
    expect(result.current.metrics?.slotHeight).toBe(SLOT_HEIGHT);

    act(() => result.current.finishCollapse());
    expect(result.current.phase).toBe("closed");
    Reflect.deleteProperty(Element.prototype, "animate");
  });

  it("접는 중에 다시 펼치면 접지 않고 이어 간다", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({ matches: false } as MediaQueryList),
    );
    Object.defineProperty(Element.prototype, "animate", {
      configurable: true,
      value: vi.fn(),
    });
    const { result } = setup({
      boundaryTop: 0,
      formBottom: 300,
      scrollportHeight: 700,
    });
    act(() => result.current.expand());
    act(() => result.current.collapse());
    act(() => result.current.expand());
    expect(result.current.phase).toBe("open");
    act(() => result.current.finishCollapse());
    expect(result.current.phase).toBe("open");
    Reflect.deleteProperty(Element.prototype, "animate");
  });
});
