import { useEffect, useRef } from "react";

interface InfiniteScrollSentinelProps {
  /** 화면에 들어오면 한 번 부름. 다음 쪽을 읽는 일. */
  onReach: () => void;
}

// 스크롤 목록 끝에 두는 보이지 않는 표식. 화면 아래 200px 안에 들어오면 다음 쪽을 읽게 함.
// 관찰자는 보이는 상태가 바뀔 때만 알려 주므로, 쪽을 이어 붙인 뒤에도 표식이 계속 보이면 다시 알려 주지 못함.
// 호출하는 쪽이 읽은 건수 등을 `key`로 줘 쪽마다 새로 그리게 해야 함.
export function InfiniteScrollSentinel({
  onReach,
}: InfiniteScrollSentinelProps) {
  const ref = useRef<HTMLDivElement>(null);
  const onReachRef = useRef(onReach);

  useEffect(() => {
    onReachRef.current = onReach;
  });

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          onReachRef.current();
        }
      },
      { rootMargin: "0px 0px 200px 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return <div ref={ref} aria-hidden className="h-px" />;
}
