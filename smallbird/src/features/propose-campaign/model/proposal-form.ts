import type { ProposalCampaign } from "@/entities/creator";

const AMOUNT_MAX_DIGITS = 9;
const FEE_MAX = 100;

export interface ProposalForm {
  campaign: ProposalCampaign | null;
  amount: number | null;
  feeRate: number | null;
}

export const EMPTY_PROPOSAL_FORM: ProposalForm = {
  campaign: null,
  amount: null,
  feeRate: null,
};

function parseDigits(text: string, maxDigits: number) {
  const digits = text.replace(/\D/g, "").replace(/^0+/, "");
  return digits === "" ? null : Number(digits.slice(0, maxDigits));
}

/** 숫자만 남기고 0·빈 값은 null. */
export function parseAmount(text: string) {
  return parseDigits(text, AMOUNT_MAX_DIGITS);
}

export function parseFeeRate(text: string) {
  const feeRate = parseDigits(text, String(FEE_MAX).length);
  return feeRate === null ? null : Math.min(feeRate, FEE_MAX);
}

/** 시안은 캠페인을 고르기 전에도 수수료 칸을 보이고 브랜드형을 골랐을 때만 숨김. */
export function isFeeVisible({ campaign }: ProposalForm) {
  return campaign === null || campaign.isGroupBuy;
}

/** 다 채웠으면 보낼 값, 아니면 null. 공구형이 아니면 수수료를 보내지 않음(보내면 서버가 거절함). */
export function toProposalValues({ campaign, amount, feeRate }: ProposalForm) {
  if (!campaign || amount === null) return null;
  const values = { campaignIdx: campaign.campaignIdx, amount };
  if (!campaign.isGroupBuy) return values;
  return feeRate === null ? null : { ...values, groupBuyFeeRate: feeRate };
}

/** 인사말에서 처음 나오는 닉네임을 강조·치환하려고 나눔. 없으면 null. */
export function splitGreeting(message: string, nickname: string) {
  const index = nickname ? message.indexOf(nickname) : -1;
  if (index === -1) return null;
  return {
    before: message.slice(0, index),
    after: message.slice(index + nickname.length),
  };
}
