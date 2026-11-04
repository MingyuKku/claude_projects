import { useEffect, useState } from "react";

export type SettledResult<T> =
  { status: "fulfilled"; value: T } | { status: "rejected"; error: unknown };

export interface PromiseState<T> {
  /** 가장 최근에 끝난 결과. 새 Promise를 기다리는 동안에는 직전 Promise의 결과를 유지함. */
  result: SettledResult<T> | undefined;
  /** 지금 받은 Promise가 아직 끝나지 않았으면 true. */
  isPending: boolean;
}

/**
 * 라우터 loader가 기다리지 않고 넘긴 Promise를 화면을 멈추지 않고 구독함.
 * Suspense(`use`)로 받으면 결과가 오는 순간 하위 트리가 다시 마운트되어 입력 중인 값이 사라지므로 상태로 받음.
 */
export function usePromiseState<T>(promise: Promise<T>): PromiseState<T> {
  const [settled, setSettled] = useState<{
    promise: Promise<T>;
    result: SettledResult<T>;
  }>();

  useEffect(() => {
    let isActive = true;
    promise.then(
      (value) => {
        if (isActive)
          setSettled({ promise, result: { status: "fulfilled", value } });
      },
      (error: unknown) => {
        if (isActive)
          setSettled({ promise, result: { status: "rejected", error } });
      },
    );
    return () => {
      isActive = false;
    };
  }, [promise]);

  return {
    result: settled?.result,
    isPending: settled?.promise !== promise,
  };
}
