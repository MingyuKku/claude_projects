import { renderHook } from "@testing-library/react";

import { captureExpandHeights } from "../lib/expand-heights";
import { useExpandTransition } from "./useExpandTransition";

import type { ExpandPhase } from "./useInlineExpand";

// jsdom에는 레이아웃과 Web Animations가 없어 높이와 animate를 직접 꾸밈.
function setup() {
  const form = document.createElement("form");
  const field = document.createElement("div");
  form.append(field);
  document.body.append(form);

  let height = 222;
  Object.defineProperty(field, "offsetHeight", { get: () => height });
  const animate = vi.fn().mockReturnValue({ finished: new Promise(() => {}) });
  Object.defineProperty(field, "animate", { value: animate });

  return {
    form,
    animate,
    setHeight(next: number) {
      height = next;
    },
  };
}

function renderTransition(form: HTMLFormElement, onCollapsed = vi.fn()) {
  return renderHook(
    ({ phase }: { phase: ExpandPhase }) =>
      useExpandTransition({ formRef: { current: form }, phase, onCollapsed }),
    { initialProps: { phase: "closed" as ExpandPhase } },
  );
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("useExpandTransition", () => {
  it("펼치기 직전에 기억한 높이에서 새 높이로 전환한다", () => {
    const { form, animate, setHeight } = setup();
    const { rerender } = renderTransition(form);

    captureExpandHeights(form);
    setHeight(500);
    rerender({ phase: "open" });

    expect(animate).toHaveBeenCalledWith(
      [
        { height: "222px", maxHeight: "222px" },
        { height: "500px", maxHeight: "500px" },
      ],
      expect.objectContaining({ duration: 360 }),
    );
  });

  it("마지막 렌더 뒤에 배치가 바뀌어도(키보드) 누르는 순간의 높이에서 시작한다", () => {
    const { form, animate, setHeight } = setup();
    const { rerender } = renderTransition(form);

    // 다시 그리지 않고 높이만 바뀜(키보드가 열려 셸 속성만 바뀐 경우).
    setHeight(142);
    captureExpandHeights(form);
    setHeight(464);
    rerender({ phase: "open" });

    expect(animate).toHaveBeenCalledWith(
      [
        { height: "142px", maxHeight: "142px" },
        { height: "464px", maxHeight: "464px" },
      ],
      expect.anything(),
    );
  });

  it("접을 때는 접힌 높이로 전환하고 끝나면 onCollapsed를 부른다", async () => {
    const { form, animate, setHeight } = setup();
    animate.mockReturnValue({ finished: Promise.resolve() });
    const onCollapsed = vi.fn();
    const { rerender } = renderTransition(form, onCollapsed);

    setHeight(500);
    rerender({ phase: "open" });
    captureExpandHeights(form);
    setHeight(222);
    rerender({ phase: "closing" });

    expect(animate).toHaveBeenLastCalledWith(
      [
        { height: "500px", maxHeight: "500px" },
        { height: "222px", maxHeight: "222px" },
      ],
      expect.objectContaining({ duration: 280, fill: "forwards" }),
    );
    await vi.waitFor(() => expect(onCollapsed).toHaveBeenCalled());
  });

  it("같은 단계에서 다시 그리기만 하면 전환하지 않는다", () => {
    const { form, animate, setHeight } = setup();
    const { rerender } = renderTransition(form);

    setHeight(300);
    rerender({ phase: "closed" });
    expect(animate).not.toHaveBeenCalled();
  });
});
