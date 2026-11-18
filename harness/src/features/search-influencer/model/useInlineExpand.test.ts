import { act, renderHook } from "@testing-library/react";

import { useInlineExpand } from "./useInlineExpand";

const PADDING = 16;
const SLOT_HEIGHT = 142;
// 입력창 박스 142 = 입력 영역 80 + 테두리·패딩·간격·버튼 줄 62.
const TEXTAREA_HEIGHT = 80;
const CHROME_HEIGHT = SLOT_HEIGHT - TEXTAREA_HEIGHT;
const LINE_HEIGHT = 20;

interface Layout {
  boundaryTop: number;
  formBottom: number;
  scrollportHeight: number;
  // 위·아래 패딩이 다른 경우(태블릿 키보드: 위 40·아래 16). 없으면 둘 다 PADDING.
  paddingTop?: number;
  paddingBottom?: number;
  // 셸의 키보드 열림 표식.
  isKeyboardOpen?: boolean;
  // 펼치기 직전 접힌 입력창 박스 높이. 없으면 기본 142.
  boxHeight?: number;
  // 스크롤 영역(main)의 화면 위 끝. 헤더 높이에 해당. 없으면 0.
  scrollportTop?: number;
}

function rect(box: { top?: number; bottom?: number }) {
  return { top: 0, bottom: 0, ...box } as DOMRect;
}

// jsdom에는 레이아웃이 없어 위치·크기를 직접 정함. 셸(data-keyboard) > 스크롤 영역(main) > 본문(boundary) > 폼 > 입력창 박스 > 입력 영역, 홈과 같은 구조.
function setup(layout: Layout) {
  const shell = document.createElement("div");
  shell.setAttribute(
    "data-keyboard",
    layout.isKeyboardOpen ? "open" : "closed",
  );
  const scrollport = document.createElement("main");
  scrollport.style.overflowY = "auto";
  const boundary = document.createElement("div");
  boundary.setAttribute("data-search-expand-boundary", "");
  boundary.style.paddingTop = `${layout.paddingTop ?? PADDING}px`;
  boundary.style.paddingBottom = `${layout.paddingBottom ?? PADDING}px`;
  const form = document.createElement("form");
  const box = document.createElement("div");
  const textarea = document.createElement("textarea");
  textarea.style.lineHeight = `${LINE_HEIGHT}px`;
  box.append(textarea);
  form.append(box);
  boundary.append(form);
  scrollport.append(boundary);
  shell.append(scrollport);
  document.body.append(shell);

  const state = { ...layout };
  vi.spyOn(boundary, "getBoundingClientRect").mockImplementation(() =>
    rect({ top: state.boundaryTop }),
  );
  vi.spyOn(form, "getBoundingClientRect").mockImplementation(() =>
    rect({ bottom: state.formBottom }),
  );
  vi.spyOn(scrollport, "getBoundingClientRect").mockImplementation(() =>
    rect({ top: state.scrollportTop ?? 0 }),
  );
  Object.defineProperty(scrollport, "clientHeight", {
    get: () => state.scrollportHeight,
  });
  Object.defineProperty(form, "offsetHeight", { value: SLOT_HEIGHT });
  const boxHeight = layout.boxHeight ?? SLOT_HEIGHT;
  Object.defineProperty(box, "offsetHeight", { value: boxHeight });
  Object.defineProperty(textarea, "offsetHeight", {
    value: boxHeight - CHROME_HEIGHT,
  });

  const { result, unmount } = renderHook(() =>
    useInlineExpand({ formRef: { current: form } }),
  );
  return { result, state, shell, unmount };
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

  it("위·아래 패딩이 다르면 각각 뺀다", () => {
    const { result } = setup({
      boundaryTop: -300,
      formBottom: 900,
      scrollportHeight: 400,
      paddingTop: 40,
      paddingBottom: 16,
    });
    act(() => result.current.expand());
    // 400 − (40 + 16) = 344. 위쪽 여백 40은 본문 안쪽 위(펼친 입력창의 위 끝) 계산에도 쓰임.
    expect(result.current.metrics?.overlayHeight).toBe(344);
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

  describe("키보드가 열린 동안", () => {
    it("펼친 높이는 본문 위치와 관계없이 보이는 영역 전체이고, 입력 영역 한도는 버튼 줄·패딩을 뺀 값이다", () => {
      const { result } = setup({
        boundaryTop: -500,
        formBottom: 300,
        scrollportHeight: 400,
        isKeyboardOpen: true,
      });
      // 400 − 32 = 368. 본문이 스크롤되어 입력창 아래 끝과 본문 위 끝 사이가 달라져도 같음.
      expect(result.current.limit).toEqual({
        maxFieldHeight: 368,
        maxTextareaHeight: 368 - CHROME_HEIGHT,
      });
      act(() => result.current.expand());
      expect(result.current.metrics?.overlayHeight).toBe(368);
    });

    it("보이는 영역이 낮아도 입력 1줄은 남긴다", () => {
      const { result } = setup({
        boundaryTop: 0,
        formBottom: 100,
        scrollportHeight: 80,
        isKeyboardOpen: true,
      });
      // 80 − 32 = 48 < 버튼 줄·패딩 62 + 1줄 20.
      expect(result.current.limit?.maxFieldHeight).toBe(
        CHROME_HEIGHT + LINE_HEIGHT,
      );
      expect(result.current.limit?.maxTextareaHeight).toBe(LINE_HEIGHT);
    });

    describe("펼쳐도 거의 커지지 않는 낮은 화면(가로 모드)", () => {
      // 보이는 영역 150 − 위 40 − 아래 16 = 94 < 접힌 박스 142라 펼쳐도 커질 여지가 없음.
      const lowScreen = {
        boundaryTop: 0,
        scrollportHeight: 150,
        paddingTop: 40,
        paddingBottom: 16,
        isKeyboardOpen: true,
      };

      it("위쪽 본문 여백을 빼지 않고 스크롤 영역 위 끝(헤더 아래)까지 키운다", () => {
        // 폼 아래 끝 190 − 스크롤 영역 위 끝(헤더 높이) 56 = 134. 여백을 뺀 값은 94.
        const { result } = setup({
          ...lowScreen,
          scrollportTop: 56,
          formBottom: 190,
        });
        act(() => result.current.expand());
        expect(result.current.metrics?.overlayHeight).toBe(134);
        // 접힌 상태의 입력 영역 한도는 그대로 여백을 뺀 값.
        expect(result.current.limit?.maxFieldHeight).toBe(94);
      });

      it("커질 여지가 한 줄 높이보다 작아도 같은 방식이다", () => {
        // 보이는 영역 368이고 접힌 박스 360이면 8px(< 한 줄 20) 커질 뿐.
        const { result } = setup({
          boundaryTop: 0,
          formBottom: 384,
          scrollportHeight: 400,
          isKeyboardOpen: true,
          boxHeight: 360,
        });
        act(() => result.current.expand());
        expect(result.current.metrics?.overlayHeight).toBe(384);
      });

      it("커질 여지가 한 줄 높이 이상이면 위쪽 여백을 그대로 둔다", () => {
        // 368 − 340 = 28 ≥ 한 줄 20.
        const { result } = setup({
          boundaryTop: 0,
          formBottom: 384,
          scrollportHeight: 400,
          isKeyboardOpen: true,
          boxHeight: 340,
        });
        act(() => result.current.expand());
        expect(result.current.metrics?.overlayHeight).toBe(368);
      });
    });

    it("키보드 열림 배치로 바뀌면 다시 잰다", async () => {
      const { result, shell } = setup({
        boundaryTop: 0,
        formBottom: 200,
        scrollportHeight: 400,
      });
      act(() => result.current.expand());
      // 키보드가 없을 때는 입력창 아래 끝에서 본문 안쪽 위까지: 200 − 16 = 184.
      expect(result.current.metrics?.overlayHeight).toBe(184);
      await act(async () => {
        shell.setAttribute("data-keyboard", "open");
        await Promise.resolve();
      });
      expect(result.current.metrics?.overlayHeight).toBe(368);
    });
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

  it("높이가 같으면 다시 그리지 않고, 사라지면 관찰을 멈춘다", () => {
    const { result, unmount } = setup({
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
    unmount();
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
