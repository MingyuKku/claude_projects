/**
 * "무관"(전체) 선택 규칙(P-30 ① 답 전 처리): 무관을 새로 고르면 다른 항목을 풀고, 다른 항목을 새로 고르면 무관을 풂.
 * `previous`는 바꾸기 전, `next`는 토글이 준 선택.
 */
export function applyAllOptionRule<T extends string>(
  previous: readonly T[],
  next: T[],
  allValue: T,
): T[] {
  const isAllAdded = next.includes(allValue) && !previous.includes(allValue);
  if (isAllAdded) return [allValue];
  const hasOthers = next.some((value) => value !== allValue);
  return hasOthers ? next.filter((value) => value !== allValue) : next;
}
