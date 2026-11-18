import type { PostingTopic } from "@/entities/campaign";

/** "전체"(`All`) 코드. 다른 주제와 함께 고르지 않음. */
export const ALL_TOPIC: PostingTopic = "All";

/**
 * 주제 선택 규칙(P-30 ① 답 전 처리): "전체"를 새로 고르면 다른 주제를 풀고, 다른 주제를 새로 고르면 "전체"를 풂.
 * `previous`는 바꾸기 전, `next`는 토글이 준 선택.
 */
export function applyTopicRule(
  previous: readonly PostingTopic[],
  next: PostingTopic[],
): PostingTopic[] {
  const isAllAdded = next.includes(ALL_TOPIC) && !previous.includes(ALL_TOPIC);
  if (isAllAdded) return [ALL_TOPIC];
  const hasOthers = next.some((topic) => topic !== ALL_TOPIC);
  return hasOthers ? next.filter((topic) => topic !== ALL_TOPIC) : next;
}
