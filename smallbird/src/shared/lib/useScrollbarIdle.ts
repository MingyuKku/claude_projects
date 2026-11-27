import { useCallback, useEffect, useRef, useState } from "react";

// 터치 기기에서 스크롤바를 처음 보였다가, 또는 마지막 스크롤 뒤에 숨기기까지 기다리는 시간(ms).
const SCROLLBAR_IDLE_MS = 1500;

/**
 * 스크롤 중이 아닌 상태(`isIdle`). 마운트 직후에는 스크롤 영역이 있음을 알리려고 잠시 `false`임.
 * `reveal()`을 부르면 `false`로 돌아가고 `SCROLLBAR_IDLE_MS` 뒤 다시 `true`가 됨(스크롤·스크롤바가 생길 때 부름).
 * 터치 기기에서 `isIdle`일 때 스크롤바를 숨기는 것은 CSS(`pointer-coarse:`)가 하며, 마우스 환경은 항상 보임.
 */
export function useScrollbarIdle() {
  const [isIdle, setIsIdle] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const startIdleTimer = useCallback(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setIsIdle(true), SCROLLBAR_IDLE_MS);
  }, []);

  const reveal = useCallback(() => {
    setIsIdle(false);
    startIdleTimer();
  }, [startIdleTimer]);

  // 처음에는 이미 `false`라 상태는 바꾸지 않고 타이머만 시작함.
  useEffect(() => {
    startIdleTimer();
    return () => clearTimeout(timerRef.current);
  }, [startIdleTimer]);

  return { isIdle, reveal };
}
