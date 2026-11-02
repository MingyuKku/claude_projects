import { useRef, type PointerEvent } from "react";

import { TAP_SLOP } from "../model/constants";

// 터치는 손가락을 뗄 때(pointerup) 동작함(이동, 로그인 안내 알럿 등). 스크롤이 시작되면 브라우저가 pointercancel을 보내므로 스크롤은 동작하지 않음.
// click까지 기다리지 않는 이유는 키보드가 떠 있을 때 입력창이 포커스를 잃으면 레이아웃이 움직여 click이 카드를 빗나가기 때문.
// 마우스와 키보드(Enter·Space)는 click으로 동작함.
export function useTapAction(onTap: () => void) {
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const isHandledRef = useRef(false);

  function onPointerDown(event: PointerEvent) {
    isHandledRef.current = false;
    touchStartRef.current =
      event.pointerType === "mouse"
        ? null
        : { x: event.clientX, y: event.clientY };
  }

  function onPointerUp(event: PointerEvent) {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start) return;
    const moved = Math.hypot(event.clientX - start.x, event.clientY - start.y);
    if (moved > TAP_SLOP) return;
    isHandledRef.current = true;
    onTap();
  }

  function onPointerCancel() {
    touchStartRef.current = null;
  }

  function onClick() {
    if (isHandledRef.current) return;
    onTap();
  }

  return { onPointerDown, onPointerUp, onPointerCancel, onClick };
}
