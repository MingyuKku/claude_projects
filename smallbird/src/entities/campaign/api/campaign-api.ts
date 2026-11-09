import { toDraftSaveBody } from "../lib/to-save-body";
import {
  campaignCancelResultSchema,
  campaignDetailSchema,
  campaignDraftSaveResultSchema,
  campaignDraftSchema,
  campaignPaymentResultSchema,
  campaignReapprovalResultSchema,
  previousCampaignPageSchema,
} from "../model/schema";
import { loadMockCampaignApi } from "./load-mock-api";

import type {
  CampaignProductType,
  CampaignSection,
  CampaignServiceType,
} from "../model/codes";
import type { CampaignDraft } from "../model/schema";

// 요구 명세 A-1~A-3·A-6·A-7·A-12~A-16. API가 없는 동안은 목이 응답하고, 응답은 실제 API와 같은 스키마로 검증함.

/** A-1 `POST /v3/campaign/drafts`. 캠페인 코드를 발급받은 등록 중 캠페인을 만듦. */
export async function createCampaignDraft(input: {
  serviceType: CampaignServiceType;
  productType: CampaignProductType;
}) {
  const mock = await loadMockCampaignApi();
  return campaignDraftSchema.parse(await mock.createDraft(input));
}

/** A-2 `GET /v3/campaign/{id}/draft`. */
export async function fetchCampaignDraft(campaignIdx: number) {
  const mock = await loadMockCampaignApi();
  return campaignDraftSchema.parse(await mock.getDraft(campaignIdx));
}

/**
 * A-3 `PUT /v3/campaign/{id}/draft`. 전체 덮어쓰기이고 받은 `version`을 함께 보냄(다르면 409 `VERSION_CONFLICT`).
 * 응답은 새 `version`·저장 시각·다시 계산한 종료일이고, 저장 응답으로 입력 중인 값을 되돌리지 않도록 초안 전체는 돌려주지 않음.
 */
export async function saveCampaignDraft(draft: CampaignDraft) {
  const mock = await loadMockCampaignApi();
  return campaignDraftSaveResultSchema.parse(
    await mock.saveDraft(draft.campaignIdx, {
      ...toDraftSaveBody(draft),
      version: draft.version,
    }),
  );
}

/** A-13 `GET /v3/campaign/{id}`. 등록 내역(승인 상태 포함). */
export async function fetchCampaign(campaignIdx: number) {
  const mock = await loadMockCampaignApi();
  return campaignDetailSchema.parse(await mock.getCampaign(campaignIdx));
}

/**
 * A-6 `POST /v3/campaign/previous`. 같은 서비스 유형의 이전 캠페인을 캠페인명·브랜드명으로 찾음(등록일 최신순).
 * 시안에 쪽 이동이 없어 화면은 스크롤로 이어 읽음.
 */
export async function searchPreviousCampaigns(input: {
  serviceType: CampaignServiceType;
  keyword: string | null;
  excludeCampaignIdx: number;
  page: number;
  entrySize: number;
}) {
  const mock = await loadMockCampaignApi();
  return previousCampaignPageSchema.parse(await mock.searchPrevious(input));
}

/**
 * A-7 `POST /v3/campaign/{id}/draft/copy`. 고른 캠페인의 1~6단계 입력값을 지금 초안에 복사하고 새 초안을 돌려줌
 * (캠페인 코드는 유지, 약관 동의·결제는 복사하지 않음).
 */
export async function copyPreviousCampaign(
  campaignIdx: number,
  sourceCampaignIdx: number,
) {
  const mock = await loadMockCampaignApi();
  return campaignDraftSchema.parse(
    await mock.copyDraftFrom(campaignIdx, sourceCampaignIdx),
  );
}

/**
 * A-12 `POST /v3/campaign/{id}/payment`. 빅버드 머니로 결제하고 승인 검토중으로 바꿈(= 승인 요청).
 * 서버가 금액을 다시 계산해 `expectedTotalAmount`와 다르면 409 `AMOUNT_CHANGED`로 거절함. 0원이어도 승인 요청 역할을 함.
 */
export async function payCampaign(
  campaignIdx: number,
  expectedTotalAmount: number,
) {
  const mock = await loadMockCampaignApi();
  return campaignPaymentResultSchema.parse(
    await mock.pay(campaignIdx, expectedTotalAmount),
  );
}

/** A-14 `POST /v3/campaign/{id}/approval/cancel`. 결제 금액을 환불하고 등록 중으로 돌림(검토중·재승인 검토중에서만). */
export async function cancelCampaignApproval(campaignIdx: number) {
  const mock = await loadMockCampaignApi();
  return campaignCancelResultSchema.parse(
    await mock.cancelApproval(campaignIdx),
  );
}

/** A-15 `POST /v3/campaign/{id}/approval/request`. 반려 뒤 수정한 내용으로 재승인을 요청함(최대 2회). */
export async function requestCampaignReapproval(campaignIdx: number) {
  const mock = await loadMockCampaignApi();
  return campaignReapprovalResultSchema.parse(
    await mock.requestReapproval(campaignIdx),
  );
}

/**
 * A-16 `POST /v3/campaign/{id}/test-review`. Stage 전용이라 개발 서버의 확인 버튼만 부름(운영은 404).
 * 운영 앱 없이 승인 완료·반려 화면을 확인하려고 심사 결과를 정함.
 */
export async function testReviewCampaign(
  campaignIdx: number,
  input: {
    result: "APPROVE" | "REJECT";
    rejections: { section: CampaignSection; reason: string }[] | null;
  },
) {
  const mock = await loadMockCampaignApi();
  await mock.testReview(campaignIdx, input);
}
