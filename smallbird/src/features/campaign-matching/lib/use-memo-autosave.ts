import { tryit } from "radash";
import { useEffect, useRef, useState } from "react";

import { saveProposalMemo } from "@/entities/campaign-progress";

import type { RefObject } from "react";

const SAVE_DELAY_MS = 800;

export type MemoSaveState = "idle" | "saving" | "saved" | "failed";

/**
 * 입력이 멈추면 메모 전체를 저장함. 창을 닫거나 다른 크리에이터로 바뀌기 전에 남은 입력도 저장함.
 * 저장은 한 번에 하나씩 차례로 보내 늦게 끝난 이전 값이 최신 값을 덮지 않게 하고,
 * 저장한 값은 `onSaved`로 조회 캐시에 넣어 다시 열었을 때 옛 메모가 보이지 않게 함.
 */
function enqueueSave(
  queue: RefObject<Promise<unknown>>,
  proposalIdx: number,
  value: string,
  onSaved: RefObject<(memo: string) => void>,
) {
  const next = queue.current.then(async () => {
    const [error] = await tryit(saveProposalMemo)(proposalIdx, value);
    if (!error) onSaved.current(value);
    return error;
  });
  queue.current = next;
  return next;
}

export function useMemoAutosave(
  proposalIdx: number,
  savedMemo: string,
  onSaved: (memo: string) => void,
  onCloseFailed: () => void,
) {
  const [memo, setMemo] = useState(savedMemo);
  const [state, setState] = useState<MemoSaveState>("idle");
  const pending = useRef<string | null>(null);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const onSavedRef = useRef(onSaved);
  const onCloseFailedRef = useRef(onCloseFailed);
  useEffect(() => {
    onSavedRef.current = onSaved;
    onCloseFailedRef.current = onCloseFailed;
  });

  useEffect(() => {
    if (pending.current === null) return;
    const timer = setTimeout(() => {
      const value = pending.current;
      if (value === null) return;
      pending.current = null;
      setState("saving");
      void enqueueSave(queue, proposalIdx, value, onSavedRef).then((error) =>
        setState(error ? "failed" : "saved"),
      );
    }, SAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [memo, proposalIdx]);

  useEffect(
    () => () => {
      if (pending.current === null) return;
      // 창이 닫혀 칸 아래 안내를 그릴 수 없으므로 실패는 토스트로 알림.
      void enqueueSave(queue, proposalIdx, pending.current, onSavedRef).then(
        (error) => error && onCloseFailedRef.current(),
      );
    },
    [proposalIdx],
  );

  return {
    memo,
    state,
    change: (value: string) => {
      pending.current = value;
      setMemo(value);
    },
  };
}
