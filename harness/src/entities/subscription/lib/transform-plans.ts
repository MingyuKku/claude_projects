import { isSubscriptionProductType } from "../model/schema";

import type { SubscriptionPlanListResponse } from "../model/schema";
import type { SubscriptionPlanCatalog } from "../model/types";

/** 응답을 화면 모델로 바꿈. 아직 화면이 모르는 상품 유형(서버가 늘린 상품)은 카드를 만들 수 없어 건너뜀. */
export function transformPlans(
  response: SubscriptionPlanListResponse,
): SubscriptionPlanCatalog {
  return {
    yearlyDiscountRate: response.yearlyDiscountRate,
    plans: response.plans.flatMap((plan) =>
      isSubscriptionProductType(plan.productType)
        ? [
            {
              type: plan.productType,
              isAvailable: plan.isAvailable,
              monthlyPrice: plan.monthlyPrice,
              yearlyPrice: plan.yearlyPrice,
            },
          ]
        : [],
    ),
  };
}
