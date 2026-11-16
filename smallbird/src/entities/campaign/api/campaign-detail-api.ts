import { toStepRequest } from "../lib/to-step-request";
import { transformCampaignDetail } from "../lib/transform-campaign-detail";
import {
  campaignCreatedSchema,
  campaignDetailSchema,
  campaignInfoSavedSchema,
} from "../model/detail-schema";
import { loadCampaignDetailMock } from "./mock-loader";

import type { CampaignProductType, CampaignServiceType } from "../model/codes";
import type { CampaignDetail } from "../model/detail-types";
import type { CampaignDraft, CampaignDraftStep } from "../model/draft";

/** A-1 `POST /v3/campaign`. 등록 화면에 들어올 때 한 번 부름(서버가 중복 생성을 막지 않음). */
export async function createCampaign(input: {
  serviceType: CampaignServiceType;
  productType: CampaignProductType;
  demo: boolean;
}) {
  const mock = await loadCampaignDetailMock();
  return campaignCreatedSchema.parse(await mock.createCampaign(input));
}

/** A-3 `GET /v3/campaign/{campaignIdx}`. 이어 쓰기·등록 내역이 함께 씀. */
export async function fetchCampaignDetail(
  campaignIdx: number,
): Promise<CampaignDetail> {
  const mock = await loadCampaignDetailMock();
  return transformCampaignDetail(
    campaignDetailSchema.parse(await mock.getCampaignDetail(campaignIdx)),
  );
}

/**
 * A-5.x `PUT /v3/campaign/{campaignIdx}/{단계}`. 초안에서 그 단계 값만 골라 보냄. 응답 본문이 없어(1단계만 `endDate`)
 * 저장 뒤 값은 상세를 다시 읽어 얻음.
 */
export async function saveCampaignStep(
  campaignIdx: number,
  step: CampaignDraftStep,
  draft: CampaignDraft,
): Promise<void> {
  const mock = await loadCampaignDetailMock();
  const response = await mock.saveCampaignStep(
    campaignIdx,
    step,
    toStepRequest(step, draft),
  );
  if (step === "info") campaignInfoSavedSchema.parse(response);
}

/** A-8 `POST /v3/campaign/{campaignIdx}/copy`. 서버가 1~6단계를 복사하고 본문 없이 답함. */
export async function copyCampaign(
  campaignIdx: number,
  sourceCampaignIdx: number,
): Promise<void> {
  const mock = await loadCampaignDetailMock();
  await mock.copyCampaign(campaignIdx, sourceCampaignIdx);
}
