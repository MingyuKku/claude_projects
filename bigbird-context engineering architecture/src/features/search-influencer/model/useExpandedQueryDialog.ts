import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";

import { EXPANDED_HISTORY_STATE_KEY } from "./constants";

interface UseExpandedQueryDialogOptions {
  /** PC 폭이면 모달을 쓰지 않고 열려 있던 모달도 닫음(PC는 인라인으로 펼침). */
  isDesktop: boolean;
  /** 사용자 동작으로 닫힌 직후 같은 이벤트 안에서 기존 입력창에 포커스를 돌려줌. */
  onCloseFocus: () => void;
}

// 확장 입력 모달의 열림 상태와 history 항목을 함께 관리함. 모달이 열린 동안 뒤로가기가 모달만 닫도록 항목을 하나 쌓음.
export function useExpandedQueryDialog({
  isDesktop,
  onCloseFocus,
}: UseExpandedQueryDialogOptions) {
  const [isOpen, setIsOpen] = useState(false);
  // 모달을 열 때 쌓은 history 항목이 남아 있는지. 뒤로가기로 닫을 때는 브라우저가 이미 지운 상태.
  const hasHistoryEntryRef = useRef(false);

  // 뒤로가기(브라우저·Android)로 모달을 닫음. 이때 history 항목은 브라우저가 이미 지움.
  useEffect(() => {
    if (!isOpen) return;

    function handlePopState() {
      hasHistoryEntryRef.current = false;
      setIsOpen(false);
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isOpen]);

  // 이펙트처럼 동기 갱신(flushSync)을 쓸 수 없는 곳에서 닫을 때: history.back()으로 정리하고 닫힘은 popstate에서 처리함.
  const requestClose = useCallback(() => {
    if (hasHistoryEntryRef.current) window.history.back();
    else setIsOpen(false);
  }, []);

  useEffect(() => {
    if (isDesktop && isOpen) requestClose();
  }, [isDesktop, isOpen, requestClose]);

  function open() {
    // React Router가 쓰는 history.state(idx·key)를 그대로 이어받아 같은 URL로 항목을 하나 쌓음.
    window.history.pushState(
      { ...window.history.state, [EXPANDED_HISTORY_STATE_KEY]: true },
      "",
    );
    hasHistoryEntryRef.current = true;
    setIsOpen(true);
  }

  // 사용자 동작(축소 버튼·Esc)으로 닫을 때: iOS는 탭 이벤트 안에서 동기로 focus해야 키보드가 유지됨.
  // 그래서 모달을 동기로 내린 뒤 같은 이벤트 안에서 기존 입력창에 포커스를 주고, 쌓은 history 항목을 정리함.
  function closeByUser() {
    flushSync(() => setIsOpen(false));
    onCloseFocus();
    if (hasHistoryEntryRef.current) {
      hasHistoryEntryRef.current = false;
      window.history.back();
    }
  }

  // 이동하면서 닫을 때: 쌓아 둔 history 항목은 이동 항목으로 바꿔 남지 않게 해야 하므로 replace 여부를 돌려줌.
  function closeForNavigation() {
    const shouldReplace = hasHistoryEntryRef.current;
    hasHistoryEntryRef.current = false;
    setIsOpen(false);
    return { shouldReplace };
  }

  return {
    isOpen: isOpen && !isDesktop,
    open,
    closeByUser,
    closeForNavigation,
  };
}
