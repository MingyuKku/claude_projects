export const MONEY_TABS = ["charge", "usage"] as const;
export type MoneyTab = (typeof MONEY_TABS)[number];

/** MO 충전 내역 탭 안의 세그먼트. */
export const CHARGE_VIEWS = ["balance", "history"] as const;
export type ChargeView = (typeof CHARGE_VIEWS)[number];

/** 하위 화면. `charge`·`charge-detail`은 충전 내역 탭, `usage-detail`은 사용 내역 탭에서만 열림. */
export const MONEY_PANELS = [
  "charge",
  "charge-detail",
  "usage-detail",
] as const;
export type MoneyPanel = (typeof MONEY_PANELS)[number];

export type MoneyLayout = "desktop" | "tablet" | "mobile";
