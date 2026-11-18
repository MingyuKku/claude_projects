import { useCallback, useSyncExternalStore } from "react";

// 잘렸는지는 그려진 크기로만 알 수 있음. 줄 수를 넘긴 줄은 아래로 숨으므로 높이를 비교함.
function readIsTruncated(element: HTMLElement | null) {
  return element !== null && element.scrollHeight > element.clientHeight;
}

// 요소 크기가 바뀔 때(창 폭·칸 폭 변화) 다시 잼. 문구가 바뀌면 다시 그려지며 함께 다시 읽음.
export function useIsTruncated(element: HTMLElement | null) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (element === null || typeof ResizeObserver === "undefined") {
        return () => {};
      }
      const observer = new ResizeObserver(onChange);
      observer.observe(element);
      return () => observer.disconnect();
    },
    [element],
  );

  return useSyncExternalStore(
    subscribe,
    () => readIsTruncated(element),
    () => false,
  );
}
