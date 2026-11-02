import { toCardKind } from "../model/codes";

import type { BillingCardListResponse } from "../model/schema";
import type { BillingCard } from "../model/types";

/** 응답을 화면 모델로 바꿈. 순서는 서버가 준 대로. */
export function transformBillingCards(
  response: BillingCardListResponse,
): BillingCard[] {
  return response.map((card) => ({
    id: card.id,
    issuer: card.issuer,
    maskedNumber: card.maskedNumber,
    isDefault: card.isDefault,
    cardKind: toCardKind(card.cardKind),
  }));
}
