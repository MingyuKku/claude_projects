import { useEffect, useRef, useState } from "react";

// 리사이즈가 멈춘 뒤 이만큼(ms) 지나면 플래그를 내림(디바운스).
const RESIZE_SETTLE_MS = 150;

/** 창 크기를 조절하는 동안만 true. 조절이 멈추고 150ms 뒤에 false 로 돌아옴. */
export function useIsResizing() {
  const [isResizing, setIsResizing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    function handleResize() {
      setIsResizing(true);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(
        () => setIsResizing(false),
        RESIZE_SETTLE_MS,
      );
    }

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timerRef.current);
    };
  }, []);

  return isResizing;
}
