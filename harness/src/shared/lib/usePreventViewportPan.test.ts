import { fireEvent, renderHook } from "@testing-library/react";

import { usePreventViewportPan } from "./usePreventViewportPan";

// fireEvent는 기본 동작이 막히면 false를 돌려줌.
function drag(target: Element, fromY: number, toY: number) {
  fireEvent.touchStart(target, { touches: [{ clientX: 0, clientY: fromY }] });
  const isAllowed = fireEvent.touchMove(target, {
    touches: [{ clientX: 0, clientY: toY }],
  });
  return { defaultPrevented: !isAllowed };
}

function createScroller({ scrollTop }: { scrollTop: number }) {
  const scroller = document.createElement("div");
  scroller.style.overflowY = "auto";
  Object.defineProperties(scroller, {
    scrollHeight: { value: 1000 },
    clientHeight: { value: 300 },
  });
  scroller.scrollTop = scrollTop;
  const child = document.createElement("p");
  scroller.append(child);
  document.body.append(scroller);
  return { scroller, child };
}

afterEach(() => document.body.replaceChildren());

describe("usePreventViewportPan", () => {
  it("스크롤할 곳이 없는 영역을 끌면 막는다", () => {
    renderHook(() => usePreventViewportPan(true));
    const plain = document.createElement("div");
    document.body.append(plain);
    expect(drag(plain, 300, 200).defaultPrevented).toBe(true);
  });

  it("안쪽 스크롤 영역이 그 방향으로 스크롤할 수 있으면 막지 않는다", () => {
    renderHook(() => usePreventViewportPan(true));
    const { child } = createScroller({ scrollTop: 100 });
    expect(drag(child, 300, 200).defaultPrevented).toBe(false);
    expect(drag(child, 200, 300).defaultPrevented).toBe(false);
  });

  it("안쪽 스크롤 영역이 끝에 닿아 문서로 넘어갈 방향이면 막는다", () => {
    renderHook(() => usePreventViewportPan(true));
    const { child } = createScroller({ scrollTop: 0 });
    // 맨 위에서 손가락을 아래로 끌면 더 올라갈 곳이 없어 문서(보이는 영역)가 끌림.
    expect(drag(child, 200, 300).defaultPrevented).toBe(true);
    expect(drag(child, 300, 200).defaultPrevented).toBe(false);
  });

  it("꺼져 있으면 막지 않는다", () => {
    renderHook(() => usePreventViewportPan(false));
    const plain = document.createElement("div");
    document.body.append(plain);
    expect(drag(plain, 300, 200).defaultPrevented).toBe(false);
  });
});
