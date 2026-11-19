import { ApiError } from "@/shared/api";
import { toIsoDate } from "@/shared/lib";

import { CAMPAIGN_SERVICE_TYPES } from "../../model/codes";
import {
  CAMPAIGN_ADD_ONS,
  filterKnownCodes,
  toKnownCode,
} from "../../model/input-codes";
import { calculateCampaignPayment } from "../../model/payment-amount";
import { findCampaignRecord, updateCampaignRecord } from "./campaign-db";
import { toDateTime } from "./campaign-record";

import type { CampaignPolicyAgreements } from "../../model/draft";

// 서버가 하는 상태·금액 검사를 흉내 냄.

/** 결제할 수 있는 상태. 승인 요청을 취소한 캠페인도 등록 중으로 돌아와 다시 결제함. */
const PAYABLE_STATUS = "DRAFT";

/**
 * 서버처럼 상태·정책 동의·희망 시작일·금액을 다시 검사하고, 통과하면 승인 검토중으로 바꿈.
 * 단계별 필수값 검사(`INCOMPLETE_DRAFT`)·잔액·구독은 흉내 내지 않음(필수값은 화면이 먼저 막고, 잔액·구독은 실제 서버 값이라).
 */
export async function payCampaign(
  campaignIdx: number,
  body: {
    expectedTotalAmount: number;
    agreements: CampaignPolicyAgreements;
  },
) {
  const record = findCampaignRecord(campaignIdx);
  if (record.status !== PAYABLE_STATUS || record.demo) {
    throw new ApiError(409, { reason: "ALREADY_PAID" });
  }
  if (!Object.values(body.agreements).every(Boolean)) {
    throw new ApiError(400, { reason: "POLICY_NOT_AGREED" });
  }
  const { startDate } = record.info;
  if (startDate !== null && startDate < toIsoDate(new Date())) {
    throw new ApiError(400, { reason: "INVALID_START_DATE" });
  }
  const { totalAmount } = calculateCampaignPayment({
    serviceType:
      toKnownCode(CAMPAIGN_SERVICE_TYPES, record.serviceType) ?? "PICK",
    addOns: filterKnownCodes(CAMPAIGN_ADD_ONS, record.addOns),
    headcount: record.conditions.headcount,
    rewardPerCreator: record.conditions.rewardPerInfluencer,
  });
  if (totalAmount !== body.expectedTotalAmount) {
    throw new ApiError(409, { reason: "AMOUNT_CHANGED" });
  }
  const paidAt = toDateTime(new Date());
  updateCampaignRecord(campaignIdx, (target) => {
    target.status = "REVIEWING";
    target.policy = { agreements: { ...body.agreements } };
    target.payment = { paidAmount: totalAmount, paidAt };
  });
  return { status: "REVIEWING", paidAmount: totalAmount, paidAt, balance: 0 };
}

/** 승인 검토중·반려만 취소할 수 있고, 결제 금액을 환불한 것으로 보고 등록 중으로 돌림. */
export async function cancelCampaignApproval(campaignIdx: number) {
  const record = findCampaignRecord(campaignIdx);
  if (record.status !== "REVIEWING" && record.status !== "REJECTED") {
    throw new ApiError(409, {
      reason: "NOT_CANCELABLE",
      status: record.status,
    });
  }
  const refundedAmount = record.payment?.paidAmount ?? 0;
  updateCampaignRecord(campaignIdx, (target) => {
    target.status = "DRAFT";
    target.payment = null;
    target.rejectReason = null;
    target.policy = null;
  });
  return { status: "DRAFT", refundedAmount, balance: 0 };
}

/** 반려만 요청할 수 있고, 동의 4개를 다시 받아 기록하며 반려 사유를 지우고 승인 검토중으로 바꿈. */
export async function requestCampaignReapproval(
  campaignIdx: number,
  agreements: CampaignPolicyAgreements,
) {
  const record = findCampaignRecord(campaignIdx);
  if (record.status !== "REJECTED") {
    throw new ApiError(409, {
      reason: "NOT_REQUESTABLE",
      status: record.status,
    });
  }
  if (!Object.values(agreements).every(Boolean)) {
    throw new ApiError(400, { reason: "POLICY_NOT_AGREED" });
  }
  updateCampaignRecord(campaignIdx, (target) => {
    target.status = "REVIEWING";
    target.rejectReason = null;
    target.policy = { agreements: { ...agreements } };
  });
  return { status: "REVIEWING" };
}

/** 개발 서버 확인 도구: 운영팀 반려·승인. 승인하면 진행 중(종료일 전)으로 봄. */
export async function reviewCampaignForDev(
  campaignIdx: number,
  decision: { type: "reject"; reason: string } | { type: "approve" },
) {
  const record = findCampaignRecord(campaignIdx);
  if (record.status !== "REVIEWING") {
    throw new ApiError(409, { reason: "NOT_REVIEWING" });
  }
  updateCampaignRecord(campaignIdx, (target) => {
    target.status = decision.type === "reject" ? "REJECTED" : "IN_PROGRESS";
    target.rejectReason = decision.type === "reject" ? decision.reason : null;
    // 서버처럼 반려하면 7단계 정책 동의 기록을 지움(승인은 그대로).
    if (decision.type === "reject") target.policy = null;
  });
}

/** 필수값 검사는 화면이 먼저 하므로 흉내 내지 않음. */
export async function completeCampaignDemo(campaignIdx: number) {
  const record = findCampaignRecord(campaignIdx);
  if (!record.demo) throw new ApiError(409, { reason: "NOT_DEMO" });
  if (record.demoCompleted) {
    throw new ApiError(409, { reason: "ALREADY_COMPLETED" });
  }
  updateCampaignRecord(campaignIdx, (target) => {
    target.demoCompleted = true;
  });
}

/**
 * 같은 캠페인을 실제 등록 중으로 바꾸고 7단계 동의를 비움. 구독 검사는 실제 서버 값이라 흉내 내지 않음.
 */
export async function convertCampaignDemo(campaignIdx: number) {
  const record = findCampaignRecord(campaignIdx);
  if (!record.demo || !record.demoCompleted) {
    throw new ApiError(409, { reason: "NOT_CONVERTIBLE" });
  }
  updateCampaignRecord(campaignIdx, (target) => {
    target.demo = false;
    target.demoCompleted = false;
    target.policy = null;
  });
}
