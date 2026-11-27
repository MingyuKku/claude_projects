import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ScrollArea } from "./scroll-area";

const IDLE_MS = 1500;

function renderScrollArea() {
  render(
    <ScrollArea type="auto">
      <p>내용</p>
    </ScrollArea>,
  );
  return {
    root: document.querySelector<HTMLElement>("[data-slot=scroll-area]")!,
    viewport: screen.getByText("내용").closest<HTMLElement>(
      "[data-slot=scroll-area-viewport]",
    )!,
  };
}

describe("ScrollArea 스크롤 중이 아닐 때 숨김 상태", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("처음에는 스크롤바를 보이다가 잠시 뒤 숨긴다", () => {
    const { root } = renderScrollArea();
    expect(root).toHaveAttribute("data-idle", "false");

    act(() => {
      vi.advanceTimersByTime(IDLE_MS);
    });

    expect(root).toHaveAttribute("data-idle", "true");
  });

  it("스크롤하면 다시 보이고 멈춘 뒤 잠시 있다가 숨긴다", () => {
    const { root, viewport } = renderScrollArea();
    act(() => {
      vi.advanceTimersByTime(IDLE_MS);
    });

    fireEvent.scroll(viewport);
    expect(root).toHaveAttribute("data-idle", "false");

    act(() => {
      vi.advanceTimersByTime(IDLE_MS - 1);
    });
    expect(root).toHaveAttribute("data-idle", "false");

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(root).toHaveAttribute("data-idle", "true");
  });
});
