import type { CampaignProductType, PostingTopic } from "@/entities/campaign";

/** 주제 이름 번역 키. 공구형은 시안 표기("무관"·"/" 구분)를 따로 둠. */
export function getTopicLabelKey(
  topic: PostingTopic,
  productType: CampaignProductType | null,
) {
  return productType === "GROUP_BUY"
    ? (`creator.groupBuyTopic.${topic}` as const)
    : (`creator.topic.${topic}` as const);
}
