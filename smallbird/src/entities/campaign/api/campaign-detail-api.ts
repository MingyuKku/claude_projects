import { isApiError } from "@/shared/api";

import { toStepRequest } from "../lib/to-step-request";
import { transformCampaignDetail } from "../lib/transform-campaign-detail";
import {
  campaignCreatedSchema,
  campaignDetailSchema,
  campaignApprovalCanceledSchema,
  campaignInfoSavedSchema,
  campaignPaidSchema,
  campaignPaymentErrorSchema,
  campaignReapprovalRequestedSchema,
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

/**
 * `POST /v3/campaign/{campaignIdx}/payment`. 빅버드 머니로 결제하고 승인 요청을 겸함. 화면에 보인 총액을 함께 보내
 * 서버 계산과 다르면 거절됨(`AMOUNT_CHANGED`). 0원이어도 승인 요청으로 부름.
 */
export async function payCampaign(
  campaignIdx: number,
  expectedTotalAmount: number,
) {
  const mock = await loadCampaignDetailMock();
  return campaignPaidSchema.parse(
    await mock.payCampaign(campaignIdx, { expectedTotalAmount }),
  );
}

/** 결제 실패 본문의 오류 코드와 빈 단계(서버 경로 이름). API 오류가 아니거나 모양이 다르면 null. */
export function readCampaignPaymentError(error: unknown) {
  if (!isApiError(error)) return null;
  const parsed = campaignPaymentErrorSchema.safeParse(error.data);
  if (!parsed.success) return null;
  return {
    reason: parsed.data.reason,
    missingSteps: parsed.data.missingSteps ?? [],
  };
}

/** `POST /v3/campaign/{campaignIdx}/payment/cancel`. 결제 금액 전액을 빅버드 머니로 환불하고 등록 중으로 돌림. */
export async function cancelCampaignApproval(campaignIdx: number) {
  const mock = await loadCampaignDetailMock();
  return campaignApprovalCanceledSchema.parse(
    await mock.cancelCampaignApproval(campaignIdx),
  );
}

/** `POST /v3/campaign/{campaignIdx}/approval`. 반려 뒤 고친 내용으로 다시 승인을 요청함(추가 결제 없음). */
export async function requestCampaignReapproval(campaignIdx: number) {
  const mock = await loadCampaignDetailMock();
  return campaignReapprovalRequestedSchema.parse(
    await mock.requestCampaignReapproval(campaignIdx),
  );
}

/**
 * 개발 서버 확인 도구: 운영 화면이 없어 승인 검토중 캠페인을 운영팀처럼 반려·승인함. 배포 빌드에는 목이 없어 늘 실패함.
 */
export async function reviewCampaignForDev(
  campaignIdx: number,
  decision: { type: "reject"; reason: string } | { type: "approve" },
) {
  const mock = await loadCampaignDetailMock();
  await mock.reviewCampaignForDev(campaignIdx, decision);
}

/** `POST /v3/campaign/{campaignIdx}/demo/complete`. 데모 작성을 마침(결제·승인 요청 없음). 이후 수정할 수 없음. */
export async function completeCampaignDemo(campaignIdx: number) {
  const mock = await loadCampaignDetailMock();
  await mock.completeCampaignDemo(campaignIdx);
}

/** `POST /v3/campaign/{campaignIdx}/demo/convert`. 작성을 마친 데모를 실제 등록 중 캠페인으로 바꿈(구독 필요). */
export async function convertCampaignDemo(campaignIdx: number) {
  const mock = await loadCampaignDetailMock();
  await mock.convertCampaignDemo(campaignIdx);
}
