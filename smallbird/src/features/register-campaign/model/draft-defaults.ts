import type { CampaignDraft } from "@/entities/campaign";

// 택1·복수 선택 그룹마다 첫 항목을 기본 선택으로 채움. 서버에 저장된 값이 있으면 그 값을 쓰고, 비어 있는 칸만 채움.
// 채운 값은 저장한 값(savedDraft)과 달라 저장 대상이 됨. 단, 아직 열지 않은 단계는 단계 이동 때 보내지 않고 결제 때 보냄(`getChangedSteps`).

const DEFAULT_PRODUCT_TYPE = "PRODUCT_DELIVERY";
const DEFAULT_PLATFORM = "INSTAGRAM";
const DEFAULT_GENDER = "FEMALE";
// 연령대·주제는 브랜드형·공구형 모두 "무관"이 기본 선택임.
const DEFAULT_AGE_GROUPS = ["ALL"] as const;
const DEFAULT_TOPICS = ["All"] as const;
const DEFAULT_POSTING_PERIOD_MONTHS = 1;

export function applyDraftDefaults(
  draft: CampaignDraft,
  { hasServerCampaignType = false }: { hasServerCampaignType?: boolean } = {},
): CampaignDraft {
  const { info, creator, conditions } = draft;
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
          : [...DEFAULT_AGE_GROUPS],
      topics: creator.topics.length > 0 ? creator.topics : [...DEFAULT_TOPICS],
    },
    conditions: {
      ...conditions,
      postingPeriodMonths:
        conditions.postingPeriodMonths ?? DEFAULT_POSTING_PERIOD_MONTHS,
      secondaryCopyright: conditions.secondaryCopyright ?? true,
    },
  };
}
