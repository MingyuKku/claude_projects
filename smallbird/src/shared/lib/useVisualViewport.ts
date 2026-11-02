import { useCallback, useSyncExternalStore } from "react";

interface VisualViewportBox {
  height: number;
  offsetTop: number;
  /** 핀치 확대 배율. 1이 아니면 사용자가 확대한 상태. */
  scale: number;
  /** 레이아웃 뷰포트 높이(`documentElement.clientHeight`). iOS는 키보드가 떠도 줄지 않음. */
  layoutHeight: number;
}

let cached: VisualViewportBox | null = null;

function read(): VisualViewportBox | null {
  const viewport = typeof window === "undefined" ? null : window.visualViewport;
  if (!viewport) return null;
  const layoutHeight = document.documentElement.clientHeight;
  // useSyncExternalStore는 같은 값이면 같은 참조를 돌려줘야 다시 그리지 않음.
  if (
    cached?.height !== viewport.height ||
    cached.offsetTop !== viewport.offsetTop ||
    cached.scale !== viewport.scale ||
    cached.layoutHeight !== layoutHeight
  ) {
    cached = {
      height: viewport.height,
      offsetTop: viewport.offsetTop,
      scale: viewport.scale,
      layoutHeight,
    };
  }
  return cached;
}

function subscribe(onChange: () => void) {
  const viewport = window.visualViewport;
  if (!viewport) return () => {};
  viewport.addEventListener("resize", onChange);
  viewport.addEventListener("scroll", onChange);
  // 레이아웃 높이는 창 크기(Android 키보드의 resizes-content, 회전)로 바뀜.
  window.addEventListener("resize", onChange);
  return () => {
    viewport.removeEventListener("resize", onChange);
    viewport.removeEventListener("scroll", onChange);
    window.removeEventListener("resize", onChange);
  };
}

function readNothing() {
  return null;
}

function subscribeNothing() {
  return () => {};
}

/**
 * 가상 키보드를 뺀 보이는 영역(`visualViewport`)의 크기·위치와 레이아웃 뷰포트 높이. 지원하지 않는 환경에서는 null.
 * 보이는 영역은 주소창이 접힐 때·핀치 확대로 끌 때도 바뀌어 그때마다 다시 그리므로, 필요 없는 동안은 `isEnabled`를 꺼 구독하지 않음(null).
 */
export function useVisualViewport(isEnabled = true) {
  const subscribeIfEnabled = useCallback(
    (onChange: () => void) =>
      isEnabled ? subscribe(onChange) : subscribeNothing(),
    [isEnabled],
  );
  return useSyncExternalStore(
    subscribeIfEnabled,
    isEnabled ? read : readNothing,
    readNothing,
  );
}
