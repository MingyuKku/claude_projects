import { transformCampaignList } from "../lib/transform-campaigns";
import { campaignListSchema } from "../model/schema";

import type { CampaignListQuery } from "../model/types";

// 요구 명세 A-2·A-4. API가 없는 동안은 개발 서버에서만 목이 응답함(목 응답도 Zod로 검증해 실제 응답과 같은 길을 지남).
async function loadMockCampaignApi() {
  if (!import.meta.env.DEV) {
    throw new Error("The campaign API is not available yet.");
  }
  return import("./mock/campaign-mock");
}

/** A-2 `GET /v3/campaign`. 정렬은 최초 등록일 최신순(서버). */
export async function fetchCampaigns(query: CampaignListQuery) {
  const mock = await loadMockCampaignApi();
  return transformCampaignList(
    campaignListSchema.parse(await mock.listCampaigns(query)),
  );
}

/** A-4 `DELETE /v3/campaign/{campaignIdx}`. 등록 중(`DRAFT`)만(데모 포함), 아니면 409 `NOT_DELETABLE`, Sub ID는 403. */
export async function deleteCampaign(campaignIdx: number) {
  const mock = await loadMockCampaignApi();
  await mock.deleteCampaign(campaignIdx);
}
