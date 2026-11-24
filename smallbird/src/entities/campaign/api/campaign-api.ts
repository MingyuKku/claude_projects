import { serverApiV3 } from "@/shared/api";

import {
  toCampaignListParams,
  toCopySourceParams,
} from "../lib/to-list-params";
import { transformCampaignList } from "../lib/transform-campaigns";
import { transformCopySources } from "../lib/transform-copy-sources";
import { campaignListSchema } from "../model/schema";

import type { CampaignListParams } from "../lib/to-list-params";
import type { CampaignListQuery, CopySourceQuery } from "../model/types";

async function fetchCampaignList(params: CampaignListParams) {
  return campaignListSchema.parse(
    await serverApiV3.get("/campaign", { params }),
  );
}

/** A-2 `GET /v3/campaign`. 정렬은 최초 등록일 최신순(서버). */
export async function fetchCampaigns(query: CampaignListQuery) {
  return transformCampaignList(
    await fetchCampaignList(toCampaignListParams(query)),
  );
}

/** A-2 `GET /v3/campaign`을 이전 캠페인 불러오기 조건(서비스·상품 유형, 지금 캠페인 제외, 검색어)으로 한 쪽 읽음. */
export async function fetchCopySources(query: CopySourceQuery, page: number) {
  return transformCopySources(
    await fetchCampaignList(toCopySourceParams(query, page)),
  );
}

/** A-4 `DELETE /v3/campaign/{campaignIdx}`. 등록 중(`DRAFT`)만(데모 포함), 아니면 409 `NOT_DELETABLE`, Sub ID는 403. */
export async function deleteCampaign(campaignIdx: number) {
  await serverApiV3.delete(`/campaign/${campaignIdx}`);
}
