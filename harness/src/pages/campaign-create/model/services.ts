import type { SubscriptionProductType } from "@/entities/subscription";

export const PRODUCT_TYPES = ["brand", "groupBuy"] as const;
export type ProductType = (typeof PRODUCT_TYPES)[number];

export type ServiceBadgeId =
  "brand" | "groupBuy" | "liveCommerce" | "liveClass" | "ota" | "smallBusiness";

interface ServiceCardDefinition {
  type: SubscriptionProductType;
  badges: readonly ServiceBadgeId[];
}

// 시안 순서. 모집형·PICK형만 선택·구독할 수 있고 나머지는 "준비중" 카드.
export const SERVICE_CARDS: readonly ServiceCardDefinition[] = [
  { type: "recruit", badges: ["brand", "groupBuy"] },
  { type: "pick", badges: ["brand", "groupBuy"] },
  { type: "live", badges: ["liveCommerce", "liveClass"] },
  { type: "applicator", badges: ["ota", "smallBusiness"] },
];

export const SERVICE_FEATURE_LINES = ["1", "2", "3"] as const;
export const PRODUCT_FEATURE_LINES = ["1", "2", "3", "4"] as const;
