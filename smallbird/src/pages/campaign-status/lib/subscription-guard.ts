import { getTypeFilterCodes } from "@/entities/campaign";

import type { CampaignSummary } from "@/entities/campaign";
import type { SubscriptionProductType } from "@/entities/subscription";

const SUBSCRIPTION_TYPE_BY_SERVICE = {
  PICK: "pick",
  RECRUIT: "recruit",
} as const satisfies Record<string, SubscriptionProductType>;

/**
 * 구독이 끝난 서비스의 등록 중 실제 캠페인이면 true. 입력값은 보존하되 이어 쓰기는 막음.
 * 구독 상태를 아직 모르거나(불러오는 중·실패) 유형을 모르면 막지 않음: 서버가 결제 때 구독을 다시 검사함. 데모는 구독과 상관없음.
 */
export function isSubscriptionExpiredForWrite(
  campaign: Pick<CampaignSummary, "type" | "isDemo">,
  subscribedTypes: ReadonlySet<SubscriptionProductType> | null,
) {
  if (campaign.isDemo || campaign.type === null || subscribedTypes === null) {
    return false;
  }
  const { serviceType } = getTypeFilterCodes(campaign.type);
  return !subscribedTypes.has(SUBSCRIPTION_TYPE_BY_SERVICE[serviceType]);
}
