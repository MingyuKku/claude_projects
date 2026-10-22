import { useSyncExternalStore } from "react";

interface VisualViewportBox {
  height: number;
  offsetTop: number;
}

let cached: VisualViewportBox | null = null;

function read(): VisualViewportBox | null {
  const viewport = typeof window === "undefined" ? null : window.visualViewport;
  if (!viewport) return null;
  // useSyncExternalStore는 같은 값이면 같은 참조를 돌려줘야 다시 그리지 않음.
  if (
    cached?.height !== viewport.height ||
    cached.offsetTop !== viewport.offsetTop
  ) {
    cached = { height: viewport.height, offsetTop: viewport.offsetTop };
  }
  return cached;
}

function subscribe(onChange: () => void) {
  const viewport = window.visualViewport;
  if (!viewport) return () => {};
  viewport.addEventListener("resize", onChange);
  viewport.addEventListener("scroll", onChange);
  return () => {
    viewport.removeEventListener("resize", onChange);
    viewport.removeEventListener("scroll", onChange);
  };
}

/** 가상 키보드를 뺀 보이는 영역(`visualViewport`)의 높이와 위 오프셋. 지원하지 않는 환경에서는 null. */
export function useVisualViewport() {
  return useSyncExternalStore(subscribe, read, () => null);
}
