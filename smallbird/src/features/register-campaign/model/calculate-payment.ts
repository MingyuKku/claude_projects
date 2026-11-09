import { ADD_ON_PRICES } from "./add-on-prices";

import type { CampaignAddOn, CampaignDraft } from "@/entities/campaign";

export interface PaymentAddOnLine {
  code: CampaignAddOn;
  unit: "TOTAL" | "PER_INFLUENCER";
  unitPrice: number;
  /** 인원당 단가는 진행 인원, 정액은 1. */
  quantity: number;
  amount: number;
}

export interface PaymentSummary {
  addOns: PaymentAddOnLine[];
  addOnTotal: number;
  /** 모집형 진행 인원(모집 인원). PICK형은 0. */
  headcount: number;
  /** 리워드 행을 보이는지(모집형 제품발송형·구매리뷰형). */
  hasReward: boolean;
  rewardPerInfluencer: number;
  rewardTotal: number;
  /** 총 결제 금액 = 부가서비스 합 + 리워드 총액. 서버가 같은 규칙으로 다시 계산해 다르면 거절함(A-12). */
  total: number;
}

/**
 * 8단계 결제 금액(스펙 §3 8단계). 금액은 서버가 아니라 초안 값으로 계산하고, 화면은 이 결과만 씀.
 * - AI 포스팅 가이드는 정액이고, 그 밖의 부가서비스(AI 원고 컨펌·AI 영수증 리뷰)는 모집형만 진행 인원 × 인원당 단가임.
 * - 리워드는 모집형 제품발송형·구매리뷰형만 1인당 리워드 × 진행 인원임.
 * 비어 있는 값은 0으로 보고 계산함(앞 단계를 채우지 않고 8단계에 와도 있는 값으로 보여 줌).
 */
export function calculatePayment(draft: CampaignDraft): PaymentSummary {
  const isRecruit = draft.serviceType === "RECRUIT";
  const headcount = isRecruit ? (draft.conditions.headcount ?? 0) : 0;

  const addOns = draft.addOns.flatMap((code): PaymentAddOnLine[] => {
    const { unit, amount: unitPrice } = ADD_ON_PRICES[code];
    if (unit === "TOTAL") {
      return [{ code, unit, unitPrice, quantity: 1, amount: unitPrice }];
    }
    if (!isRecruit) return [];
    return [
      {
        code,
        unit,
        unitPrice,
        quantity: headcount,
        amount: unitPrice * headcount,
      },
    ];
  });
  const addOnTotal = addOns.reduce((sum, line) => sum + line.amount, 0);

  const { campaignType } = draft.campaignInfo;
  const hasReward =
    isRecruit &&
    (campaignType === "PRODUCT_DELIVERY" || campaignType === "PURCHASE_REVIEW");
  const rewardPerInfluencer = hasReward
    ? (draft.conditions.rewardPerInfluencer ?? 0)
    : 0;
  const rewardTotal = rewardPerInfluencer * headcount;

  return {
    addOns,
    addOnTotal,
    headcount,
    hasReward,
    rewardPerInfluencer,
    rewardTotal,
    total: addOnTotal + rewardTotal,
  };
}
