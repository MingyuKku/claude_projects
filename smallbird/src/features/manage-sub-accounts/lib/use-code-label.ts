import { useTranslation } from "@/shared/i18n";

import type { PermissionKey } from "../model/constants";

// 권한 이름. 권한은 서버가 필드로 주고 프론트가 키를 정하므로(model/constants의 PERMISSION_FIELDS) 모든 키에 번역이 있음.
const PERMISSION_LABEL_KEYS = {
  campaign: "access.permission.name.campaign",
  influencerMatching: "access.permission.name.influencerMatching",
  influencerMarket: "access.permission.name.influencerMarket",
  commerce: "access.permission.name.commerce",
  buyerInquiry: "access.permission.name.buyerInquiry",
  bigbirdMoney: "access.permission.name.bigbirdMoney",
} as const satisfies Record<PermissionKey, string>;

// 서버가 코드(enum)로 주는 값 → 번역 키 표(스펙 §6, i18n 규칙 "서버 데이터"). 코드는 임시이고 백엔드 확정 뒤(§7 B-6) 맞춤.
// 표에 없는 코드는 화면을 깨지 않고 서버가 준 값을 그대로 보임.

const PRODUCT_TYPE_KEYS = {
  recruit: "access.campaign.productType.recruit",
  pick: "access.campaign.productType.pick",
} as const;

const DETAIL_TYPE_KEYS = {
  brand: "access.campaign.detailType.brand",
  groupBuy: "access.campaign.detailType.groupBuy",
} as const;

const STATUS_KEYS = {
  completed: "access.campaign.status.completed",
  waiting: "access.campaign.status.waiting",
  running: "access.campaign.status.running",
} as const;

function isKnown<T extends object>(
  table: T,
  code: string,
): code is keyof T & string {
  return Object.hasOwn(table, code);
}

export function useCodeLabel() {
  const { t } = useTranslation("features/manage-sub-accounts");

  return {
    permission: (key: PermissionKey) => t(PERMISSION_LABEL_KEYS[key]),
    productType: (code: string) =>
      isKnown(PRODUCT_TYPE_KEYS, code) ? t(PRODUCT_TYPE_KEYS[code]) : code,
    detailType: (code: string) =>
      isKnown(DETAIL_TYPE_KEYS, code) ? t(DETAIL_TYPE_KEYS[code]) : code,
    status: (code: string) =>
      isKnown(STATUS_KEYS, code) ? t(STATUS_KEYS[code]) : code,
  };
}

/** 진행 상태 배지 색(Figma: 진행 완료 slate·대기중 blue·진행중 green). 모르는 코드는 회색. */
export function getStatusBadgeVariant(status: string) {
  if (status === "waiting") return "blue";
  if (status === "running") return "green";
  return "gray";
}
