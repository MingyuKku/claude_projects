import { toCardKind } from "../model/codes";
import { sortDefaultCardFirst } from "./sort-default-card-first";

import type { BillingCardListResponse } from "../model/schema";
import type { BillingCard } from "../model/types";

/** 응답을 화면 모델로 바꿈. 기본 카드가 맨 앞이고 나머지는 서버가 준 순서. */
export function transformBillingCards(
  response: BillingCardListResponse,
): BillingCard[] {
  return sortDefaultCardFirst(
    response.map((card) => ({
      id: card.id,
      issuer: card.issuer,
      maskedNumber: card.maskedNumber,
      isDefault: card.isDefault,
      cardKind: toCardKind(card.cardKind),
    })),
  );
}
