import { useEffect } from "react";

const SCROLLABLE_OVERFLOW = new Set(["auto", "scroll"]);

// 손가락이 아래로(dy > 0) 움직이면 내용은 위로(scrollTop 감소) 스크롤됨.
function canScrollVertically(element: HTMLElement, dy: number) {
  if (!SCROLLABLE_OVERFLOW.has(getComputedStyle(element).overflowY)) {
    return false;
  }
  if (dy > 0) return element.scrollTop > 0;
  return element.scrollTop + element.clientHeight < element.scrollHeight - 1;
}

function hasScrollableAncestor(target: EventTarget | null, dy: number) {
  for (
    let el = target instanceof Element ? target : null;
    el && el !== document.documentElement;
    el = el.parentElement
  ) {
    if (el instanceof HTMLElement && canScrollVertically(el, dy)) return true;
  }
  return false;
}

/**
 * 켜져 있는 동안 화면(문서·보이는 영역)이 터치로 위아래로 끌리지 않게 막고, 안쪽 스크롤 영역의 스크롤만 허용함.
 * iOS는 키보드가 떠도 레이아웃을 줄이지 않아 사용자가 레이아웃 안에서 보이는 영역을 끌 수 있고,
 * 안쪽 스크롤 영역이 끝에 닿으면 터치 스크롤을 문서로 넘김(WebKit 191204). 그 결과 키보드 뒤 빈 영역이 드러남.
 *
 * 비패시브 touchmove에서 "이 방향으로 스크롤할 수 있는 조상이 없으면" preventDefault 함.
 * Radix Dialog·Sheet가 쓰는 react-remove-scroll과 같은 방식. 두 손가락(확대)과 가로 이동은 막지 않음.
 */
export function usePreventViewportPan(isActive: boolean) {
  useEffect(() => {
    if (!isActive) return;
    let lastX = 0;
    let lastY = 0;

    function handleTouchStart(event: TouchEvent) {
      const touch = event.touches[0];
      if (!touch) return;
      lastX = touch.clientX;
      lastY = touch.clientY;
    }

    function handleTouchMove(event: TouchEvent) {
      const touch = event.touches[0];
      if (event.touches.length !== 1 || !touch || !event.cancelable) return;
      const dx = touch.clientX - lastX;
      const dy = touch.clientY - lastY;
      lastX = touch.clientX;
      lastY = touch.clientY;
      if (dy === 0 || Math.abs(dx) > Math.abs(dy)) return;
      if (hasScrollableAncestor(event.target, dy)) return;
      event.preventDefault();
    }

    document.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
    };
  }, [isActive]);
}
