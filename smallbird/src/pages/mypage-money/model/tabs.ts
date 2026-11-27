export const MONEY_TABS = ["charge", "usage"] as const;
export type MoneyTab = (typeof MONEY_TABS)[number];

/** MO 상단 탭. 충전(잔액·충전·출금)이 따로 있고, 충전 내역·결제 내역은 `tab`(`charge`·`usage`)과 `view`로 주소에 담김. */
export const MOBILE_TABS = ["charge", "history", "usage"] as const;
export type MobileTab = (typeof MOBILE_TABS)[number];

/** `view` 쿼리. MO에서 `tab=charge`일 때 `history`면 충전 내역 탭, 아니면 충전 탭. PC·TAB에는 보기 선택이 없음. */
export const CHARGE_VIEWS = ["balance", "history"] as const;
export type ChargeView = (typeof CHARGE_VIEWS)[number];

/** 하위 화면. `charge`·`withdraw`는 두 탭 모두, `charge-detail`은 충전 내역 탭, `usage-detail`은 사용 내역 탭에서만 열림. */
export const MONEY_PANELS = [
  "charge",
  "withdraw",
  "charge-detail",
  "usage-detail",
] as const;
export type MoneyPanel = (typeof MONEY_PANELS)[number];

export type MoneyLayout = "desktop" | "tablet" | "mobile";
