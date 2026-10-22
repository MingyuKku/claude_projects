import { useRef, type PointerEvent } from "react";
import { useNavigate } from "react-router";

import { TAP_SLOP } from "../model/constants";

// 터치는 손가락을 뗄 때(pointerup) 이동함. 스크롤이 시작되면 브라우저가 pointercancel을 보내므로 스크롤은 이동하지 않음.
// click까지 기다리지 않는 이유는 키보드가 떠 있을 때 입력창이 포커스를 잃으면 레이아웃이 움직여 click이 카드를 빗나가기 때문.
// 마우스와 키보드(Enter·Space)는 click으로 이동함.
export function useTapNavigate(to: string) {
  const navigate = useNavigate();
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
    void navigate(to);
  }

  function onPointerCancel() {
    touchStartRef.current = null;
  }

  function onClick() {
    if (isHandledRef.current) return;
    void navigate(to);
  }

  return { onPointerDown, onPointerUp, onPointerCancel, onClick };
}
