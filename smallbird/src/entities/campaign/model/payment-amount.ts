import type { CampaignServiceType } from "./codes";
import type { CampaignAddOn, CampaignType } from "./input-codes";

// 서버가 같은 규칙으로 다시 계산해 `expectedTotalAmount`와 비교하므로 화면과 목 서버가 이 함수 하나를 함께 씀.

/** AI 포스팅 가이드 정액(원). */
export const AI_POSTING_GUIDE_PRICE = 10_000;
/** 원고컨펌 인원당 단가(원). 모집형만 등록 때 결제하고, PICK형은 매칭 단계에서 결제함. */
export const MANUSCRIPT_CONFIRM_PRICE_PER_PERSON = 5_000;

/** 금액에 쓰는 입력값(1단계 유형, 4단계 부가서비스, 6단계 인원·리워드). */
export interface CampaignPaymentInput {
  serviceType: CampaignServiceType;
  campaignType: CampaignType | null;
  addOns: readonly CampaignAddOn[];
  headcount: number | null;
  rewardPerInfluencer: number | null;
}

export interface CampaignPaymentItem {
  addOn: CampaignAddOn;
  amount: number;
}

export interface CampaignPayment {
  /** 등록 때 결제하는 부가서비스(고른 순서). */
  addOnItems: CampaignPaymentItem[];
  /** 모집형 제품발송형 리워드 총액(1인당 × 진행 인원). 그 밖은 null(결제 요약에 리워드 행 없음). */
  rewardAmount: number | null;
  totalAmount: number;
}

function toAddOnItem(
  addOn: CampaignAddOn,
  serviceType: CampaignServiceType,
  headcount: number,
): CampaignPaymentItem | null {
  if (addOn === "AI_POSTING_GUIDE") {
    return { addOn, amount: AI_POSTING_GUIDE_PRICE };
  }
  if (serviceType === "RECRUIT") {
    return { addOn, amount: MANUSCRIPT_CONFIRM_PRICE_PER_PERSON * headcount };
  }
  return null;
}

export function calculateCampaignPayment({
  serviceType,
  campaignType,
  addOns,
  headcount,
  rewardPerInfluencer,
}: CampaignPaymentInput): CampaignPayment {
  const people = headcount ?? 0;
  const addOnItems = addOns
    .map((addOn) => toAddOnItem(addOn, serviceType, people))
    .filter((item) => item !== null);
  const hasReward =
    serviceType === "RECRUIT" && campaignType === "PRODUCT_DELIVERY";
  const rewardAmount = hasReward ? (rewardPerInfluencer ?? 0) * people : null;
  const totalAmount =
    addOnItems.reduce((sum, item) => sum + item.amount, 0) +
    (rewardAmount ?? 0);
  return { addOnItems, rewardAmount, totalAmount };
}
