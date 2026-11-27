import { isApiError, serverApiV3 } from "@/shared/api";

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
import {
  markCampaignContentChanged,
  markCampaignListChanged,
} from "../model/list-changes";
import { SERVER_STEP_PATHS } from "../model/server-steps";

import type { CampaignProductType, CampaignServiceType } from "../model/codes";
import type { CampaignDetail } from "../model/detail-types";
import type {
  CampaignDraft,
  CampaignDraftStep,
  CampaignPolicyAgreements,
} from "../model/draft";

/** A-1 `POST /v3/campaign`. 등록 진입 주소의 loader가 부름. */
export async function createCampaign(input: {
  serviceType: CampaignServiceType;
  productType: CampaignProductType;
  demo: boolean;
}) {
  const created = campaignCreatedSchema.parse(
    await serverApiV3.post("/campaign", input),
  );
  markCampaignListChanged();
  return created;
}

/** A-3 `GET /v3/campaign/{campaignIdx}`. 이어 쓰기·등록 내역이 함께 씀. */
export async function fetchCampaignDetail(
  campaignIdx: number,
): Promise<CampaignDetail> {
  return transformCampaignDetail(
    campaignDetailSchema.parse(
      await serverApiV3.get(`/campaign/${campaignIdx}`),
    ),
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
  // 정책 동의는 임시저장하지 않음(서버가 결제할 때 기록함).
  if (step === "policy") return;
  const response = await serverApiV3.put(
    `/campaign/${campaignIdx}/${SERVER_STEP_PATHS[step]}`,
    toStepRequest(step, draft),
  );
  markCampaignContentChanged(campaignIdx);
  if (step === "info") campaignInfoSavedSchema.parse(response);
}

/** A-8 `POST /v3/campaign/{campaignIdx}/copy`. 서버가 1~6단계를 복사하고 본문 없이 답함. */
export async function copyCampaign(
  campaignIdx: number,
  sourceCampaignIdx: number,
): Promise<void> {
  await serverApiV3.post(`/campaign/${campaignIdx}/copy`, {
    sourceCampaignIdx,
  });
  markCampaignContentChanged(campaignIdx);
}

/**
 * `POST /v3/campaign/{campaignIdx}/payment`. 빅버드 머니로 결제하고 승인 요청을 겸함. 화면에 보인 총액(부가세 포함)과
 * 정책 동의를 함께 보내고, 서버 계산과 다르면 거절됨(`AMOUNT_CHANGED`). 0원이어도 승인 요청으로 부름.
 */
export async function payCampaign(
  campaignIdx: number,
  body: { expectedTotalAmount: number; agreements: CampaignPolicyAgreements },
) {
  const paid = campaignPaidSchema.parse(
    await serverApiV3.post(`/campaign/${campaignIdx}/payment`, body),
  );
  markCampaignListChanged();
  return paid;
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
  const canceled = campaignApprovalCanceledSchema.parse(
    await serverApiV3.post(`/campaign/${campaignIdx}/payment/cancel`),
  );
  markCampaignListChanged();
  return canceled;
}

/**
 * `POST /v3/campaign/{campaignIdx}/approval`. 반려 뒤 고친 내용으로 다시 승인을 요청함(추가 결제 없음). 반려하면 서버가
 * 정책 동의를 지우므로 결제처럼 동의 4개를 함께 보내고, 하나라도 true가 아니면 거절됨(`POLICY_NOT_AGREED`).
 */
export async function requestCampaignReapproval(
  campaignIdx: number,
  agreements: CampaignPolicyAgreements,
) {
  const requested = campaignReapprovalRequestedSchema.parse(
    await serverApiV3.post(`/campaign/${campaignIdx}/approval`, {
      agreements,
    }),
  );
  markCampaignListChanged();
  return requested;
}

/**
 * 개발 서버 확인 도구: 운영 앱이 V3에 연결되기 전이라 승인 검토중 캠페인을 운영팀처럼 반려·승인함. 서버의 stage 전용
 * API(`/test/approve`·`/test/reject`, prod에서는 404)를 부르며, 이 도구는 개발 서버(`DEV`)에서만 그림.
 */
export async function reviewCampaignForDev(
  campaignIdx: number,
  decision: { type: "reject"; reason: string } | { type: "approve" },
) {
  if (decision.type === "approve") {
    await serverApiV3.post(`/campaign/${campaignIdx}/test/approve`);
  } else {
    await serverApiV3.post(`/campaign/${campaignIdx}/test/reject`, {
      rejectReason: decision.reason,
    });
  }
  markCampaignListChanged();
}

/** `POST /v3/campaign/{campaignIdx}/demo/complete`. 데모 작성을 마침(결제·승인 요청 없음). 이후 수정할 수 없음. */
export async function completeCampaignDemo(campaignIdx: number) {
  await serverApiV3.post(`/campaign/${campaignIdx}/demo/complete`);
  markCampaignContentChanged(campaignIdx);
}

/** `POST /v3/campaign/{campaignIdx}/demo/convert`. 작성을 마친 데모를 실제 등록 중 캠페인으로 바꿈(구독 필요). */
export async function convertCampaignDemo(campaignIdx: number) {
  await serverApiV3.post(`/campaign/${campaignIdx}/demo/convert`);
  markCampaignListChanged();
}
