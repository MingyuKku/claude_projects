import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useScrollActiveTabIntoView } from "./useScrollActiveTabIntoView";

const VIEW_WIDTH = 200;

function Tabs({ active, inset }: { active: string; inset?: number }) {
  const ref = useScrollActiveTabIntoView<HTMLDivElement>({ inset });
  return (
    <div ref={ref} data-testid="scroll">
      <div>
        {["a", "b", "c"].map((value) => (
          <button
            key={value}
            role="tab"
            data-value={value}
            data-state={value === active ? "active" : "inactive"}
          />
        ))}
      </div>
    </div>
  );
}

// jsdom은 레이아웃이 없어 탭 3개(폭 100씩)와 보이는 폭 200을 직접 알려 줌.
function mockLayout(container: HTMLElement) {
  Object.defineProperty(container, "clientWidth", { value: VIEW_WIDTH });
  container.getBoundingClientRect = () => ({ left: 0 }) as DOMRect;
  container.scrollTo = vi.fn();
  container
    .querySelectorAll<HTMLElement>("[role=tab]")
    .forEach((tab, index) => {
      tab.getBoundingClientRect = () =>
        ({
          left: index * 100 - container.scrollLeft,
          right: index * 100 + 100 - container.scrollLeft,
        }) as DOMRect;
    });
}

describe("useScrollActiveTabIntoView", () => {
  beforeEach(() => {
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("화면 밖으로 잘린 탭이 선택되면 보이는 위치까지 스크롤한다", async () => {
    const { getByTestId, rerender } = render(<Tabs active="a" inset={10} />);
    const container = getByTestId("scroll");
    mockLayout(container);

    // 처음 위치를 맞추는 것(즉시 이동)과 이후 탭 전환(부드럽게 이동)을 구분하려고 한 번 거침.
    rerender(<Tabs active="b" inset={10} />);
    await act(async () => {});
    rerender(<Tabs active="c" inset={10} />);
    await act(async () => {});

    expect(container.scrollTo).toHaveBeenCalledWith({
      left: 300 + 10 - VIEW_WIDTH,
      behavior: "smooth",
    });
  });

  it("이미 보이는 탭이 선택되면 스크롤하지 않는다", async () => {
    const { getByTestId, rerender } = render(<Tabs active="a" />);
    const container = getByTestId("scroll");
    mockLayout(container);

    rerender(<Tabs active="b" />);
    await act(async () => {});

    expect(container.scrollTo).not.toHaveBeenCalled();
  });
});
