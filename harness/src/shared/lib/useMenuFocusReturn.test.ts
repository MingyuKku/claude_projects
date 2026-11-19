import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useMenuFocusReturn } from "./useMenuFocusReturn";

function closeEvent() {
  return { preventDefault: vi.fn() } as unknown as Event;
}

describe("useMenuFocusReturn", () => {
  it("기본은 포커스를 트리거로 되돌린다", () => {
    const { result } = renderHook(() => useMenuFocusReturn());
    const event = closeEvent();
    result.current.onCloseAutoFocus(event);
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it("포인터로 열면 포커스를 되돌리지 않는다", () => {
    const { result } = renderHook(() => useMenuFocusReturn());
    result.current.onPointerDown();
    const event = closeEvent();
    result.current.onCloseAutoFocus(event);
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it("포인터로 열었어도 키보드를 쓰면 포커스를 되돌린다", () => {
    const { result } = renderHook(() => useMenuFocusReturn());
    result.current.onPointerDown();
    result.current.onKeyDown();
    const event = closeEvent();
    result.current.onCloseAutoFocus(event);
    expect(event.preventDefault).not.toHaveBeenCalled();
  });
});
