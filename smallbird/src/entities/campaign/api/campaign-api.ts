import { transformCampaignList } from "../lib/transform-campaigns";
import { transformCopySources } from "../lib/transform-copy-sources";
import { campaignListSchema } from "../model/schema";
import { loadCampaignListMock } from "./mock-loader";

import type { CampaignListQuery, CopySourceQuery } from "../model/types";

/** A-2 `GET /v3/campaign`. 정렬은 최초 등록일 최신순(서버). */
export async function fetchCampaigns(query: CampaignListQuery) {
  const mock = await loadCampaignListMock();
  return transformCampaignList(
    campaignListSchema.parse(await mock.listCampaigns(query)),
  );
}

/** A-2 `GET /v3/campaign`을 이전 캠페인 불러오기 조건(서비스·상품 유형, 지금 캠페인 제외, 검색어)으로 한 쪽 읽음. */
export async function fetchCopySources(query: CopySourceQuery, page: number) {
  const mock = await loadCampaignListMock();
  return transformCopySources(
    campaignListSchema.parse(await mock.listCopySources(query, page)),
  );
}

/** A-4 `DELETE /v3/campaign/{campaignIdx}`. 등록 중(`DRAFT`)만(데모 포함), 아니면 409 `NOT_DELETABLE`, Sub ID는 403. */
export async function deleteCampaign(campaignIdx: number) {
  const mock = await loadCampaignListMock();
  await mock.deleteCampaign(campaignIdx);
}
