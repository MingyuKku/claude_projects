import { serverApiV3 } from "@/shared/api";
import { isCampaignApiMock } from "@/shared/config";

import {
  toCampaignListParams,
  toCopySourceParams,
} from "../lib/to-list-params";
import { transformCampaignList } from "../lib/transform-campaigns";
import { transformCopySources } from "../lib/transform-copy-sources";
import { campaignListSchema } from "../model/schema";
import { loadCampaignListMock, loadCampaignShadowMock } from "./mock-loader";
import { applyShadowToLiveList } from "./shadow-operation";

import type { CampaignListParams } from "../lib/to-list-params";
import type { CampaignListQuery, CopySourceQuery } from "../model/types";

async function fetchLiveCampaignList(params: CampaignListParams) {
  const response = campaignListSchema.parse(
    await serverApiV3.get("/campaign", { params }),
  );
  return applyShadowToLiveList(response);
}

/** A-2 `GET /v3/campaign`. 정렬은 최초 등록일 최신순(서버). */
export async function fetchCampaigns(query: CampaignListQuery) {
  if (!isCampaignApiMock()) {
    return transformCampaignList(
      await fetchLiveCampaignList(toCampaignListParams(query)),
    );
  }
  const mock = await loadCampaignListMock();
  return transformCampaignList(
    campaignListSchema.parse(await mock.listCampaigns(query)),
  );
}

/** A-2 `GET /v3/campaign`을 이전 캠페인 불러오기 조건(서비스·상품 유형, 지금 캠페인 제외, 검색어)으로 한 쪽 읽음. */
export async function fetchCopySources(query: CopySourceQuery, page: number) {
  if (!isCampaignApiMock()) {
    return transformCopySources(
      await fetchLiveCampaignList(toCopySourceParams(query, page)),
    );
  }
  const mock = await loadCampaignListMock();
  return transformCopySources(
    campaignListSchema.parse(await mock.listCopySources(query, page)),
  );
}

/** 목이 결제·승인으로 바꾼 캠페인은 서버가 아직 모르므로 지우기 전에 막음. 배포 빌드에는 그림자가 없음. */
async function assertLiveCampaignDeletable(campaignIdx: number) {
  if (!import.meta.env.DEV) return;
  const shadow = await loadCampaignShadowMock();
  shadow.assertShadowDeletable(campaignIdx);
}

/** A-4 `DELETE /v3/campaign/{campaignIdx}`. 등록 중(`DRAFT`)만(데모 포함), 아니면 409 `NOT_DELETABLE`, Sub ID는 403. */
export async function deleteCampaign(campaignIdx: number) {
  if (isCampaignApiMock()) {
    const mock = await loadCampaignListMock();
    await mock.deleteCampaign(campaignIdx);
    return;
  }
  await assertLiveCampaignDeletable(campaignIdx);
  await serverApiV3.delete(`/campaign/${campaignIdx}`);
}
