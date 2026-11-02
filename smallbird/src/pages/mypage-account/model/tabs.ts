import type { Authority } from "@/entities/session";

// Master(MASTER·ADMIN)와 Sub ID(SUB)의 탭 구성. 첫 값이 기본 탭.
export const MASTER_ACCOUNT_TABS = [
  "master",
  "company",
  "bank",
  "sub",
  "notification",
] as const;

export const SUB_ACCOUNT_TABS = ["self", "notification"] as const;

export type AccountTab =
  (typeof MASTER_ACCOUNT_TABS)[number] | (typeof SUB_ACCOUNT_TABS)[number];

export function getAccountTabs(authority: Authority) {
  return authority === "SUB" ? SUB_ACCOUNT_TABS : MASTER_ACCOUNT_TABS;
}
