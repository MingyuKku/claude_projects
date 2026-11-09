import { createEmptyInputs } from "./empty-draft";

import type { CampaignDraft } from "@/entities/campaign";

/** 테스트용 초안: 아무것도 입력하지 않은 등록 중 캠페인. 필요한 조각만 덮어씀. */
export function createDraftFixture(
  overrides: Partial<CampaignDraft> = {},
): CampaignDraft {
  return {
    campaignIdx: 1001,
    campaignCode: "PB00000001001",
    serviceType: "PICK",
    productType: "BRAND",
    status: "DRAFT",
    version: 1,
    visitedSteps: [],
    updatedAt: "2026-11-06 10:00:00",
    ...createEmptyInputs(),
    policy: {
      agreements: {
        service: false,
        privacy: false,
        operation: false,
        reward: false,
      },
    },
    ...overrides,
  };
}
