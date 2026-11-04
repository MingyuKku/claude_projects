import { toCardKind, toSubscriptionStatus } from "../model/codes";
import { isSubscriptionProductType } from "../model/schema";

import type { SubscriptionListResponse } from "../model/schema";
import type { Subscription } from "../model/types";

/** 응답을 화면 모델로 바꿈. 아직 화면이 모르는 상품 유형은 건너뜀(상품 목록과 같은 규칙). 순서는 서버가 준 대로. */
export function transformSubscriptions(
  response: SubscriptionListResponse,
): Subscription[] {
  return response.flatMap((item) =>
    isSubscriptionProductType(item.productType)
      ? [
          {
            id: item.id,
            type: item.productType,
            productName: item.productName,
            startedAt: item.startedAt,
            endsAt: item.endsAt,
            amount: item.amount,
            paymentMethod: item.paymentMethod,
            cardKind: toCardKind(item.cardKind),
            isCancelScheduled: item.isCancelScheduled,
            status: toSubscriptionStatus(item.status, item.isCancelScheduled),
            nextRetryAt: item.nextRetryAt ?? null,
          },
        ]
      : [],
  );
}
