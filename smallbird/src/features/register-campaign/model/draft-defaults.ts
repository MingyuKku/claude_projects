import type { CampaignDraft, CampaignProductType } from "@/entities/campaign";

// 택1·복수 선택 그룹마다 첫 항목을 기본 선택으로 채움. 서버에 저장된 값이 있으면 그 값을 쓰고, 비어 있는 칸만 채움.
// 채운 값은 저장한 값(savedDraft)과 달라 저장 대상이 됨. 단, 아직 열지 않은 단계는 단계 이동 때 보내지 않고 결제 때 보냄(`getChangedSteps`).

const DEFAULT_PRODUCT_TYPE = "PRODUCT_DELIVERY";
const DEFAULT_PLATFORM = "INSTAGRAM";
const DEFAULT_GENDER = "FEMALE";
// 공구형 시안(3.0.1)은 연령대·주제도 첫 항목 "무관"이 기본 선택임.
const DEFAULT_AGE_GROUPS = ["AGE_10S"] as const;
const DEFAULT_TOPICS = ["Beauty"] as const;
const GROUP_BUY_DEFAULT_AGE_GROUPS = ["ALL"] as const;
const GROUP_BUY_DEFAULT_TOPICS = ["All"] as const;
const DEFAULT_POSTING_PERIOD_MONTHS = 1;

export function applyDraftDefaults(
  draft: CampaignDraft,
  {
    hasServerCampaignType = false,
    productType = null,
  }: {
    hasServerCampaignType?: boolean;
    productType?: CampaignProductType | null;
  } = {},
): CampaignDraft {
  const { info, creator, conditions } = draft;
  const isGroupBuy = productType === "GROUP_BUY";
  const defaultAgeGroups = isGroupBuy
    ? GROUP_BUY_DEFAULT_AGE_GROUPS
    : DEFAULT_AGE_GROUPS;
  const defaultTopics = isGroupBuy ? GROUP_BUY_DEFAULT_TOPICS : DEFAULT_TOPICS;
  return {
    ...draft,
    // 서버가 모르는 유형(v2)이면 채우지 않아 유형이 바뀐 것으로 처리되지 않게 함.
    info: {
      ...info,
      campaignType:
        info.campaignType ??
        (hasServerCampaignType ? null : DEFAULT_PRODUCT_TYPE),
    },
    creator: {
      platform: creator.platform ?? DEFAULT_PLATFORM,
      gender: creator.gender ?? DEFAULT_GENDER,
      ageGroups:
        creator.ageGroups.length > 0
          ? creator.ageGroups
          : [...defaultAgeGroups],
      topics: creator.topics.length > 0 ? creator.topics : [...defaultTopics],
    },
    conditions: {
      ...conditions,
      postingPeriodMonths:
        conditions.postingPeriodMonths ?? DEFAULT_POSTING_PERIOD_MONTHS,
      secondaryCopyright: conditions.secondaryCopyright ?? true,
    },
  };
}
