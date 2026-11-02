import { useLayoutEffect, useState } from "react";

import { FALLBACK_LINE_HEIGHT } from "./constants";

import type { RefObject } from "react";

interface UseTextareaOverflowOptions {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  /** 입력창을 고정 높이로 펼친 상태인지. */
  isExpanded: boolean;
  /** 글이 이 줄 수를 넘으면 isOverflowing이 됨. */
  overflowLines: number;
  query: string;
}

// 펼치기 전에는 입력 높이를 글에 맞추고(최소·최대 높이는 클래스로 제한), 펼친 상태는 클래스의 높이를 씀.
// 글이 overflowLines를 넘는지(isOverflowing)를 돌려줌.
export function useTextareaOverflow({
  textareaRef,
  isExpanded,
  overflowLines,
  query,
}: UseTextareaOverflowOptions) {
  const [isOverflowing, setIsOverflowing] = useState(false);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "";
    if (!isExpanded) {
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
    // 줄 수로 비교해 소수점 높이 차이로 아이콘이 깜빡이지 않게 함. 줄을 줄여 기준 이하가 되면 사라짐.
    const lineHeight =
      Number.parseFloat(getComputedStyle(textarea).lineHeight) ||
      FALLBACK_LINE_HEIGHT;
    const totalLines = Math.round(textarea.scrollHeight / lineHeight);
    setIsOverflowing(totalLines > overflowLines);
  }, [textareaRef, isExpanded, overflowLines, query]);

  return { isOverflowing };
}
