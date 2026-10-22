import { act, renderHook } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router";

import { useTapNavigate } from "./use-tap-navigate";

import type { PointerEvent } from "react";

function pointer(pointerType: string, clientX = 0, clientY = 0) {
  return { pointerType, clientX, clientY } as PointerEvent;
}

function setup() {
  return renderHook(
    () => ({ tap: useTapNavigate("/target"), path: useLocation().pathname }),
    { wrapper: MemoryRouter },
  );
}

describe("useTapNavigate", () => {
  it("터치가 허용 거리 안에서 떼어지면 이동하고 뒤따르는 click은 무시한다", () => {
    const { result } = setup();

    act(() => result.current.tap.onPointerDown(pointer("touch", 0, 0)));
    act(() => result.current.tap.onPointerUp(pointer("touch", 3, 4)));
    expect(result.current.path).toBe("/target");

    act(() => result.current.tap.onClick());
    expect(result.current.path).toBe("/target");
  });

  it("터치가 허용 거리를 넘으면 이동하지 않는다", () => {
    const { result } = setup();

    act(() => result.current.tap.onPointerDown(pointer("touch", 0, 0)));
    act(() => result.current.tap.onPointerUp(pointer("touch", 30, 0)));

    expect(result.current.path).toBe("/");
  });

  it("pointercancel이면 이동하지 않는다", () => {
    const { result } = setup();

    act(() => result.current.tap.onPointerDown(pointer("touch", 0, 0)));
    act(() => result.current.tap.onPointerCancel());
    act(() => result.current.tap.onPointerUp(pointer("touch", 0, 0)));

    expect(result.current.path).toBe("/");
  });

  it("마우스는 click으로 이동한다", () => {
    const { result } = setup();

    act(() => result.current.tap.onPointerDown(pointer("mouse")));
    act(() => result.current.tap.onPointerUp(pointer("mouse")));
    expect(result.current.path).toBe("/");

    act(() => result.current.tap.onClick());
    expect(result.current.path).toBe("/target");
  });
});
