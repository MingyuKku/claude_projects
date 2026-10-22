import { useLayoutEffect, useState } from "react";

import { FALLBACK_LINE_HEIGHT } from "./constants";

import type { RefObject } from "react";

interface UseTextareaOverflowOptions {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  /** 입력 높이를 글에 맞추는 wide 상태인지. */
  isWide: boolean;
  /** PC에서 입력창을 고정 높이로 펼친 상태인지. */
  isInlineExpanded: boolean;
  query: string;
}

// wide에서는 입력 높이를 글에 맞추고(최대 높이는 클래스로 제한), 한 줄로 돌아가면 인라인 높이를 지움.
// 글이 입력창에 보이는 줄 수를 넘는지(isOverflowing)를 돌려줌.
export function useTextareaOverflow({
  textareaRef,
  isWide,
  isInlineExpanded,
  query,
}: UseTextareaOverflowOptions) {
  const [isOverflowing, setIsOverflowing] = useState(false);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "";
    // 펼친 PC 입력창은 클래스의 고정 높이를 씀.
    if (isWide && !isInlineExpanded) {
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
    // 글의 전체 줄 수가 입력창에 보이는 줄 수(모든 기기 3줄)를 넘으면 펼치기 아이콘을 보여 줌.
    // 줄 수로 비교해 소수점 높이 차이로 아이콘이 깜빡이지 않게 하고, 줄을 줄여 안에 들어오면 사라짐.
    const lineHeight =
      Number.parseFloat(getComputedStyle(textarea).lineHeight) ||
      FALLBACK_LINE_HEIGHT;
    const totalLines = Math.round(textarea.scrollHeight / lineHeight);
    const visibleLines = Math.floor(textarea.clientHeight / lineHeight);
    setIsOverflowing(isWide && totalLines > visibleLines);
  }, [textareaRef, isWide, isInlineExpanded, query]);

  return { isOverflowing };
}
