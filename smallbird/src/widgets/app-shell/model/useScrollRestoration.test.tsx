import { act, fireEvent, render, screen } from "@testing-library/react";
import { useRef } from "react";
import { createMemoryRouter, Outlet, RouterProvider } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useScrollRestoration } from "./useScrollRestoration";

// 겹치는 막대처럼 본문의 형제 요소를 둔 셸.
function Shell() {
  const ref = useRef<HTMLElement>(null);
  useScrollRestoration(ref);
  return (
    <div>
      <main ref={ref}>
        <Outlet />
      </main>
      <div data-testid="bar" />
    </div>
  );
}

// 내용 길이에 따라 스크롤이 잘리는 본문.
let maxScroll = 1000;
let frames: FrameRequestCallback[] = [];

function runFrame() {
  const current = frames;
  frames = [];
  act(() => current.forEach((callback) => callback(0)));
}

beforeEach(() => {
  maxScroll = 1000;
  frames = [];
  const tops = new WeakMap<Element, number>();
  vi.spyOn(Element.prototype, "scrollTop", "get").mockImplementation(function (
    this: Element,
  ) {
    return tops.get(this) ?? 0;
  });
  vi.spyOn(Element.prototype, "scrollTop", "set").mockImplementation(function (
    this: Element,
    value: number,
  ) {
    tops.set(this, Math.min(value, maxScroll));
  });
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) =>
    frames.push(callback),
  );
  vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {
    frames = [];
  });
});

afterEach(() => vi.restoreAllMocks());

async function goBackWithShortContent() {
  const router = createMemoryRouter([
    {
      element: <Shell />,
      children: [
        { path: "/", element: <p>처음</p> },
        { path: "/next", element: <p>다음</p> },
      ],
    },
  ]);
  render(<RouterProvider router={router} />);
  const main = screen.getByRole("main");
  main.scrollTop = 500;
  fireEvent.scroll(main);
  await act(() => router.navigate("/next"));
  maxScroll = 100;
  await act(() => router.navigate(-1));
  return main;
}

describe("useScrollRestoration", () => {
  it("뒤로 오면 내용이 길어질 때까지 다시 맞춰 떠날 때 위치로 되돌린다", async () => {
    const main = await goBackWithShortContent();
    expect(main.scrollTop).toBe(100);
    maxScroll = 1000;
    runFrame();
    expect(main.scrollTop).toBe(500);
  });

  it("되돌리는 동안 본문 옆 막대를 잡으면 멈춘다", async () => {
    const main = await goBackWithShortContent();
    fireEvent.pointerDown(screen.getByTestId("bar"));
    maxScroll = 1000;
    runFrame();
    expect(main.scrollTop).toBe(100);
  });
});
