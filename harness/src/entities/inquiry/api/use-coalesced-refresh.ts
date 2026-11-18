import { useCallback, useEffect, useRef } from "react";

const COALESCE_MS = 300;

/**
 * 짧은 사이에 여러 번 온 다시 받기 요청을 마지막 한 번으로 합침. 답장 전송 직후의 재조회와
 * Firestore 변경 신호가 거의 동시에 와서 같은 목록 요청이 여러 번 나가던 것을 막음.
 * `refresh`는 참조가 안정적이어야 함(SWR `mutate`).
 */
export function useCoalescedRefresh(refresh: () => unknown) {
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  return useCallback(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => void refresh(), COALESCE_MS);
  }, [refresh]);
}
