import type { CampaignServiceType } from "./codes";
import type { CampaignAddOn } from "./input-codes";

// 서버가 같은 규칙으로 다시 계산해 `expectedTotalAmount`와 비교하므로 화면과 목 서버가 이 함수 하나를 함께 씀.

/** AI 포스팅 가이드 정액(원, 공급가). */
export const POSTING_GUIDE_PRICE = 10_000;
/** 원고컨펌 인원당 단가(원, 공급가). 모집형만 등록 때 결제하고, PICK형은 매칭 단계에서 결제함. */
export const MANUSCRIPT_CONFIRM_PRICE_PER_PERSON = 5_000;
const VAT_RATE = 0.1;

/** 공급가에 부가세 10%를 더함(소수점 버림). 서버가 결제 줄마다 같은 식으로 계산함. */
export function addVat(supplyAmount: number) {
  return supplyAmount + Math.floor(supplyAmount * VAT_RATE);
}

/** 금액에 쓰는 입력값(서비스 유형, 4단계 부가서비스, 6단계 인원·리워드). */
export interface CampaignPaymentInput {
  serviceType: CampaignServiceType;
  addOns: readonly CampaignAddOn[];
  headcount: number | null;
  rewardPerCreator: number | null;
}

/** 금액은 부가세를 포함한 실제 차감액. */
export interface CampaignPaymentItem {
  addOn: CampaignAddOn;
  amount: number;
}

export interface CampaignPayment {
  /** 등록 때 결제하는 부가서비스(고른 순서). */
  addOnItems: CampaignPaymentItem[];
  /** 모집형 리워드 총액(1인당 × 진행 인원). 그 밖은 null(결제 요약에 리워드 행 없음). */
  rewardAmount: number | null;
  /** 줄마다 부가세를 더한 합계. */
  totalAmount: number;
}

function toAddOnItem(
  addOn: CampaignAddOn,
  serviceType: CampaignServiceType,
  headcount: number,
): CampaignPaymentItem | null {
  if (addOn === "POSTING_GUIDE") {
    return { addOn, amount: addVat(POSTING_GUIDE_PRICE) };
  }
  if (serviceType === "RECRUIT") {
    return {
      addOn,
      amount: addVat(MANUSCRIPT_CONFIRM_PRICE_PER_PERSON * headcount),
    };
  }
  return null;
}

export function calculateCampaignPayment({
  serviceType,
  addOns,
  headcount,
  rewardPerCreator,
}: CampaignPaymentInput): CampaignPayment {
  const people = headcount ?? 0;
  const addOnItems = addOns
    .map((addOn) => toAddOnItem(addOn, serviceType, people))
    .filter((item) => item !== null);
  const rewardAmount =
    serviceType === "RECRUIT" ? addVat((rewardPerCreator ?? 0) * people) : null;
  const totalAmount =
    addOnItems.reduce((sum, item) => sum + item.amount, 0) +
    (rewardAmount ?? 0);
  return { addOnItems, rewardAmount, totalAmount };
}
