import {
  CAMPAIGN_PLATFORMS,
  CAMPAIGN_TYPES,
  toKnownCode,
} from "../model/input-codes";

import type { CampaignListResponse } from "../model/schema";
import type { CopySourceCampaign } from "../model/types";
import type { PagedResult } from "@/shared/lib";

/** 등록일은 날짜만 씀(`yyyy-MM-dd HH:mm:ss` → `yyyy-MM-dd`). */
function toDateOnly(dateTime: string | null | undefined) {
  return dateTime ? dateTime.slice(0, 10) : null;
}

export function transformCopySources(
  response: CampaignListResponse,
): PagedResult<CopySourceCampaign> {
  return {
    records: response.list.map((item) => ({
      campaignIdx: item.campaignIdx,
      name: item.name ?? "",
      brandName: item.brandName || null,
      campaignType: toKnownCode(CAMPAIGN_TYPES, item.campaignType),
      rawCampaignType: item.campaignType ?? null,
      platform: toKnownCode(CAMPAIGN_PLATFORMS, item.platform),
      createdDate: toDateOnly(item.createdDate),
    })),
    totalCount: response.count,
    totalPages: Math.ceil(response.count / Math.max(response.entrySize, 1)),
  };
}
