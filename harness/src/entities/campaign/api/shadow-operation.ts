import { serverApiV3 } from "@/shared/api";
import { isCampaignApiMock } from "@/shared/config";

import { campaignDetailSchema } from "../model/detail-schema";
import { loadCampaignDetailMock, loadCampaignShadowMock } from "./mock-loader";

import type { CampaignDetailResponse } from "../model/detail-schema";
import type { CampaignListResponse } from "../model/schema";

// 서버 연동 모드에서 서버에 아직 없는 기능은 목이 흉내 냄. 목은 서버 캠페인의 그림자(campaign-shadow)를 같은 번호로 두고
// 그 위에서 동작함. 전체 목 모드에서는 목 저장소가 곧 원본이라 그림자가 필요 없음.

/** `GET /v3/campaign/{campaignIdx}` 원본 응답. 그림자를 덮어쓰기 전 값. */
export async function fetchLiveCampaignResponse(
  campaignIdx: number,
): Promise<CampaignDetailResponse> {
  return campaignDetailSchema.parse(
    await serverApiV3.get(`/campaign/${campaignIdx}`),
  );
}

/** 서버 응답에 그림자의 상태를 덮어씀. 배포 빌드에는 그림자가 없어 서버 응답 그대로. */
export async function applyShadowToLiveDetail(
  response: CampaignDetailResponse,
) {
  if (!import.meta.env.DEV) return response;
  const shadow = await loadCampaignShadowMock();
  return shadow.applyShadowToDetail(response);
}

/**
 * 서버에 없는 기능을 목으로 실행함. 서버 연동 모드에서는 먼저 서버의 최신 캠페인으로 그림자를 맞춤. 배포 빌드에서는 목이
 * 없어 실패함.
 */
export async function runShadowOperation<T>(
  campaignIdx: number,
  run: (mock: Awaited<ReturnType<typeof loadCampaignDetailMock>>) => Promise<T>,
) {
  const mock = await loadCampaignDetailMock();
  if (!isCampaignApiMock()) {
    const shadow = await loadCampaignShadowMock();
    shadow.syncShadow(await fetchLiveCampaignResponse(campaignIdx));
  }
  return run(mock);
}

/** 서버 목록에 그림자의 상태·데모만 덮어씀. 배포 빌드에는 그림자가 없어 서버 응답 그대로. */
export async function applyShadowToLiveList(response: CampaignListResponse) {
  if (!import.meta.env.DEV) return response;
  const shadow = await loadCampaignShadowMock();
  return shadow.applyShadowToList(response);
}
