import { useState } from "react";

/**
 * 대상 하나를 다루는 다이얼로그(삭제 확인, 오류 안내 등)의 열림 상태와 내용을 따로 둠.
 * 닫을 때 대상을 비우면 닫힘 애니메이션 동안 내용이 빈 값으로 다시 그려져 문구가 순간 바뀜. 그래서 닫을 때는
 * 열림만 끄고 대상은 다음에 열 때까지 남겨 둠.
 */
export function useDialogTarget<T>() {
  const [state, setState] = useState<{ target: T | null; isOpen: boolean }>({
    target: null,
    isOpen: false,
  });

  return {
    /** 마지막으로 연 대상. 닫히는 중에도 남아 있음. */
    target: state.target,
    isOpen: state.isOpen,
    open: (target: T) => setState({ target, isOpen: true }),
    close: () => setState((prev) => ({ ...prev, isOpen: false })),
  };
}
