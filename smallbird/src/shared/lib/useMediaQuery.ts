import { useSyncExternalStore } from "react";

// CSS 미디어 쿼리 일치 여부를 구독함. matchMedia가 없는 환경(jsdom 등)에서는 항상 false.
export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      if (typeof window.matchMedia !== "function") return () => {};
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    () =>
      typeof window.matchMedia === "function" &&
      window.matchMedia(query).matches,
    () => false,
  );
}
