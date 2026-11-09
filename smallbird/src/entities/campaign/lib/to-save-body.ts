import { omit } from "radash";

import type { CampaignDraft, CampaignDraftSaveBody } from "../model/schema";

/** 초안을 저장 본문으로 바꿈. 서버가 정하는 응답 전용 필드는 보내지 않음. */
export function toDraftSaveBody(draft: CampaignDraft): CampaignDraftSaveBody {
  const body = omit(draft, [
    "campaignIdx",
    "campaignCode",
    "serviceType",
    "productType",
    "status",
    "updatedAt",
  ]);
  return { ...body, campaignInfo: omit(body.campaignInfo, ["endDate"]) };
}
