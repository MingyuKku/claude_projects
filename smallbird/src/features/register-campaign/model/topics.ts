import { GROUP_BUY_POSTING_TOPICS } from "@/entities/campaign";

import type { CampaignProductType, PostingTopic } from "@/entities/campaign";

type GroupBuyTopic = (typeof GROUP_BUY_POSTING_TOPICS)[number];

function isGroupBuyTopic(topic: PostingTopic): topic is GroupBuyTopic {
  return (GROUP_BUY_POSTING_TOPICS as readonly PostingTopic[]).includes(topic);
}

/** 주제 이름 번역 키. 공구형은 시안 표기("무관"·"/" 구분)를 따로 둠. */
export function getTopicLabelKey(
  topic: PostingTopic,
  productType: CampaignProductType | null,
) {
  if (productType === "GROUP_BUY" && isGroupBuyTopic(topic)) {
    return `creator.groupBuyTopic.${topic}` as const;
  }
  return `creator.topic.${topic}` as const;
}

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
