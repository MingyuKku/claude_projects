import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router";

interface UseTabParamOptions<T extends string> {
  /** 허용하는 탭 값. 이 밖의 값은 기본 탭으로 봄. */
  tabs: readonly T[];
  defaultTab: T;
  /** 탭을 담는 쿼리 이름 */
  param?: string;
  /** 탭을 바꿀 때 함께 지울 쿼리(탭 안의 하위 화면 상태 등) */
  resetParams?: readonly string[];
  /** 탭 전환을 기록에 남길지 정함. 기본은 남김(뒤로가기로 이전 탭 복귀). */
  history?: "push" | "replace";
}

/**
 * 탭 상태를 URL 쿼리에 두는 훅. React Router의 Router 컨텍스트 안에서만 쓸 수 있음.
 * 잘못된 값은 렌더 중에 기본 탭으로 대체하고 URL은 다시 쓰지 않음.
 */
export function useTabParam<T extends string>({
  tabs,
  defaultTab,
  param = "tab",
  resetParams = [],
  history = "push",
}: UseTabParamOptions<T>) {
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get(param);
  const tab = tabs.find((candidate) => candidate === requested) ?? defaultTab;

  // Radix Tabs는 한 번 클릭에 mousedown과 focus로 같은 탭을 두 번 알림. 렌더 전에는 `tab`이
  // 그대로라 두 번째 호출도 통과해 같은 주소가 기록에 두 번 쌓이므로, 주소가 바뀌기 전의 같은 요청은 무시함.
  const requestedRef = useRef<T | null>(null);
  useEffect(() => {
    requestedRef.current = null;
  }, [searchParams]);

  function setTab(next: string) {
    const nextTab = tabs.find((candidate) => candidate === next);
    if (nextTab === undefined || nextTab === tab) return;
    if (requestedRef.current === nextTab) return;
    requestedRef.current = nextTab;
    setSearchParams(
      (prev) => {
        // lng 같은 다른 쿼리는 그대로 둠.
        const params = new URLSearchParams(prev);
        for (const key of resetParams) params.delete(key);
        if (nextTab === defaultTab) params.delete(param);
        else params.set(param, nextTab);
        return params;
      },
      { replace: history === "replace" },
    );
  }

  return { tab, setTab };
}
