import { createContext, use } from "react";

import type { ReactNode } from "react";

/**
 * 마법사 밖(페이지)이 채워 주는 자리. feature끼리는 서로 가져올 수 없어서 충전 영역은 페이지가 `ChargeInline`으로 채워 내려 줌(스펙 §4).
 * 단계 화면(`STEP_BODIES`)은 props를 받지 않아 context로 읽음.
 */
export interface CampaignRegisterSlots {
  /** 8단계 결제 수단 카드 안의 충전 영역(충전 금액 입력·빠른 금액·"충전하기"). */
  chargeSlot?: ReactNode;
}

export const CampaignRegisterSlotsContext =
  createContext<CampaignRegisterSlots>({});

export function useCampaignRegisterSlots() {
  return use(CampaignRegisterSlotsContext);
}
