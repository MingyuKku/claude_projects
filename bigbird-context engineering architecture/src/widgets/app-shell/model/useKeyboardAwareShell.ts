import { useLayoutEffect, useState } from "react";

import { useVirtualKeyboardOpen } from "@/shared/lib/useVirtualKeyboardOpen";

import { isTextEntry } from "../lib/isTextEntry";

import type { FocusEvent } from "react";

/** 셸 루트에 펼칠 키보드 대응 속성을 돌려줌. 키보드 대응을 쓰지 않으면 빈 객체. */
export function useKeyboardAwareShell(isKeyboardAware: boolean) {
  const [isEditingText, setIsEditingText] = useState(false);
  const isKeyboardOpen = useVirtualKeyboardOpen(
    isKeyboardAware && isEditingText,
  );

  // 키보드가 열리는 순간 한 번만, 포커스한 입력을 감싼 `[data-keyboard-anchor]`(없으면 입력 자신)의 아래 끝이 보이게 스크롤함.
  // iOS는 포커스한 입력(커서)까지만 보이게 스크롤해 그 아래 버튼 줄이 키보드에 가려지기 때문. 여백은 앵커의
  // scroll-margin-bottom을 따름(CSSOM View scrollIntoView). 열려 있는 동안 다시 맞추지는 않음(사용자 스크롤과 충돌).
  useLayoutEffect(() => {
    if (!isKeyboardOpen) return;
    const active = document.activeElement;
    if (!(active instanceof HTMLElement)) return;
    const anchor = active.closest("[data-keyboard-anchor]") ?? active;
    const frame = requestAnimationFrame(() =>
      anchor.scrollIntoView({ block: "end" }),
    );
    return () => cancelAnimationFrame(frame);
  }, [isKeyboardOpen]);

  const keyboardState = isKeyboardOpen ? "open" : "closed";

  function handleFocusTextEntry(event: FocusEvent<HTMLDivElement>) {
    setIsEditingText(isTextEntry(event.target));
  }

  function handleBlurTextEntry(event: FocusEvent<HTMLDivElement>) {
    if (!isTextEntry(event.relatedTarget)) setIsEditingText(false);
  }

  if (!isKeyboardAware) return {};

  return {
    "data-keyboard": keyboardState,
    onFocus: handleFocusTextEntry,
    onBlur: handleBlurTextEntry,
  };
}
