import type { MouseEvent } from "react";

const INTERACTIVE_SELECTOR = "button, a, input, label, [role=checkbox]";

/** 행·카드 클릭으로 상세를 열 때 체크박스·버튼을 누른 것은 빼려고 씀. */
export function isInteractiveTarget(event: MouseEvent<HTMLElement>) {
  if (!(event.target instanceof Element)) return false;
  const interactive = event.target.closest(INTERACTIVE_SELECTOR);
  return interactive !== null && interactive !== event.currentTarget;
}
