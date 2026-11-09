import { campaignMockDb } from "./campaign-mock-db";
import { fail, now, requireCampaign } from "./campaign-mock-helpers";

import type { CampaignSection } from "../../model/codes";
import type { CampaignDetail } from "../../model/schema";

// 결제(A-12)·승인 요청 취소(A-14)·재승인 요청(A-15)·테스트 심사(A-16)의 목. 상태 전환은 요구 명세를 따름.
// 목은 빅버드 머니 잔액 API(실제 서버)를 바꿀 수 없어서 결제·환불 뒤 잔액(`balance`)을 알 수 없음. 화면이 잔액 API를 다시 읽으므로 0으로 둠.

// 서버가 결제 때 다시 계산하는 값을 흉내 낸 목 전용 단가임. entities가 features를 가져다 쓸 수 없어 화면의 단가와 따로 둠.
const AI_POSTING_GUIDE_PRICE = 10_000;
const PER_INFLUENCER_ADD_ON_PRICE = 5_000;
const MOCK_BALANCE = 0;

/** 서버가 결제 때 다시 계산하는 금액. 프론트의 `calculatePayment`와 같은 규칙이어야 함(요구 명세 A-11). */
function calculateTotal(campaign: CampaignDetail) {
  const isRecruit = campaign.serviceType === "RECRUIT";
  const headcount = campaign.conditions.headcount ?? 0;
  const addOnPrices: CampaignDetail["addOnPrices"] = [];
  let total = 0;

  for (const code of campaign.addOns) {
    if (code === "AI_POSTING_GUIDE") {
      addOnPrices.push({
        code,
        unitPrice: AI_POSTING_GUIDE_PRICE,
        unit: "FIXED",
      });
      total += AI_POSTING_GUIDE_PRICE;
    } else if (isRecruit) {
      addOnPrices.push({
        code,
        unitPrice: PER_INFLUENCER_ADD_ON_PRICE,
        unit: "PER_INFLUENCER",
      });
      total += PER_INFLUENCER_ADD_ON_PRICE * headcount;
    }
  }

  const hasReward =
    isRecruit &&
    (campaign.campaignInfo.campaignType === "PRODUCT_DELIVERY" ||
      campaign.campaignInfo.campaignType === "PURCHASE_REVIEW");
  if (hasReward) {
    total += (campaign.conditions.rewardPerInfluencer ?? 0) * headcount;
  }
  return { total, addOnPrices };
}

/**
 * A-12 결제(= 승인 요청). 등록 중일 때만 되고, 서버가 금액을 다시 계산해 `expectedTotalAmount`와 다르면 거절함.
 * 목은 입력이 비어 있는지는 검사하지 않음(프론트가 먼저 모든 단계를 검사하고, 약관 동의만 확인).
 */
export async function pay(campaignIdx: number, expectedTotalAmount: number) {
  const campaign = requireCampaign(campaignIdx);
  if (campaign.status !== "DRAFT") fail(409, "ALREADY_PAID");
  const { agreements } = campaign.policy;
  if (!Object.values(agreements).every(Boolean)) {
    fail(400, "POLICY_NOT_AGREED");
  }
  const { total, addOnPrices } = calculateTotal(campaign);
  if (total !== expectedTotalAmount) fail(409, "AMOUNT_CHANGED");

  const paidAt = now();
  campaignMockDb.update((db) => {
    const target = db.campaigns[campaignIdx];
    if (!target) return;
    target.status = "REVIEWING";
    target.payment = {
      paidAmount: total,
      paidAt,
      method: "BIGBIRD_MONEY",
    };
    target.addOnPrices = addOnPrices;
    target.rejections = [];
  });
  return {
    status: "REVIEWING",
    paidAmount: total,
    paidAt,
    balance: MOCK_BALANCE,
  };
}

/** A-14 승인 요청 취소: 결제 금액을 환불하고 등록 중으로 돌림(코드는 유지). 검토중·재승인 검토중에서만 됨. */
export async function cancelApproval(campaignIdx: number) {
  const campaign = requireCampaign(campaignIdx);
  if (campaign.status !== "REVIEWING" && campaign.status !== "RE_REVIEWING") {
    fail(409, "NOT_CANCELABLE", { status: campaign.status });
  }
  const refundedAmount = campaign.payment?.paidAmount ?? 0;
  campaignMockDb.update((db) => {
    const target = db.campaigns[campaignIdx];
    if (!target) return;
    target.status = "DRAFT";
    target.payment = null;
    target.addOnPrices = [];
    target.rejections = [];
  });
  return { status: "DRAFT", refundedAmount, balance: MOCK_BALANCE };
}

/** A-15 재승인 요청(반려 후, 최대 2회). 수정한 내용은 그 전에 초안 저장(A-3)으로 반영돼 있음. */
export async function requestReapproval(campaignIdx: number) {
  const campaign = requireCampaign(campaignIdx);
  if (campaign.status !== "REJECTED") {
    fail(409, "NOT_REQUESTABLE", { status: campaign.status });
  }
  if (campaign.reapprovalRemaining <= 0) fail(409, "REAPPROVAL_LIMIT");

  const reapprovalRemaining = campaign.reapprovalRemaining - 1;
  campaignMockDb.update((db) => {
    const target = db.campaigns[campaignIdx];
    if (!target) return;
    target.status = "RE_REVIEWING";
    target.reapprovalRemaining = reapprovalRemaining;
    target.rejections = [];
  });
  return { status: "RE_REVIEWING", reapprovalRemaining };
}

/** A-16 테스트 심사(Stage 전용): 운영 앱 없이 승인 완료·반려 화면을 확인하려고 심사 결과를 정함. */
export async function testReview(
  campaignIdx: number,
  input: {
    result: "APPROVE" | "REJECT";
    rejections: { section: CampaignSection; reason: string }[] | null;
  },
) {
  const campaign = requireCampaign(campaignIdx);
  if (campaign.status !== "REVIEWING" && campaign.status !== "RE_REVIEWING") {
    fail(409, "NOT_REVIEWING", { status: campaign.status });
  }
  campaignMockDb.update((db) => {
    const target = db.campaigns[campaignIdx];
    if (!target) return;
    target.status = input.result === "APPROVE" ? "APPROVED" : "REJECTED";
    target.rejections =
      input.result === "REJECT" ? (input.rejections ?? []) : [];
    target.reviewedAt = now();
  });
  return { result: true };
}
