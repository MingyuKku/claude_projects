import { toCardKind } from "../model/codes";

import type { SubscriptionPaymentListResponse } from "../model/schema";
import type { PaymentList } from "../model/types";

/** 응답을 화면 모델로 바꿈. 거래명세서는 https 주소만 남김. */
export function transformPayments(
  response: SubscriptionPaymentListResponse,
): PaymentList {
  return {
    totalCount: response.totalCount,
    records: response.items.map((item) => ({
      id: item.id,
      paidAt: item.paidAt,
      name: item.name,
      amount: item.amount,
      method: item.method,
      cardKind: toCardKind(item.cardKind),
      status: item.status,
      receiptUrl: item.receiptUrl?.startsWith("https://")
        ? item.receiptUrl
        : null,
    })),
  };
}
