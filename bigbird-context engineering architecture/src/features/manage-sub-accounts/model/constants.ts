/** PC 시안의 한 쪽 행 수. TAB·MO도 같은 값을 씀. */
export const SUB_ACCOUNT_PAGE_SIZE = 8;

/** 생성일 표시. 현재 언어로 같은 형식을 씀(스펙 §3). */
export const DATE_FORMAT = {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
} as const;
