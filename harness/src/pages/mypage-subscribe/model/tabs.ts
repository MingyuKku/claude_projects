export const SUBSCRIBE_TABS = ["plans", "usage", "payments"] as const;
export type SubscribeTab = (typeof SUBSCRIBE_TABS)[number];

/** 하위 화면. `checkout`은 탭 없이 결제 화면(구독 탭에서만 진입), `filter`는 결제내역 탭의 TAB·MO 필터 화면(feature가 소유). */
export const SUBSCRIBE_PANELS = ["checkout", "filter"] as const;
export type SubscribePanel = (typeof SUBSCRIBE_PANELS)[number];
/** 하위 화면 쿼리 이름(`usePanelParam` 기본값). */
export const PANEL_PARAM = "panel";

/** 이용요약 탭의 상품 세그먼트 쿼리 이름. */
export const USAGE_TYPE_PARAM = "type";
/** 결제 화면의 상품 쿼리 이름. */
export const CHECKOUT_PLAN_PARAM = "plan";
/** 결제 화면의 결제 주기(월간·연간) 쿼리 이름. 잘못된 값이면 월간. */
export const CHECKOUT_PERIOD_PARAM = "period";
