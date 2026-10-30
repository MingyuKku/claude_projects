import { useEffect, useEffectEvent } from "react";

/**
 * 뒤로 가기·앞으로 가기로 이 화면이 브라우저 캐시(bfcache)에서 복원될 때 `callback`을 부름.
 * 복원된 화면은 떠나기 전 상태 그대로(JS 상태 포함)라, 외부 페이지로 전체 이동하며 켜 둔 "진행 중" 상태를 여기서 되돌림.
 */
export function useOnPageRestore(callback: () => void) {
  const handleRestore = useEffectEvent(callback);

  useEffect(() => {
    function onPageShow(event: PageTransitionEvent) {
      if (event.persisted) handleRestore();
    }

    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);
}
