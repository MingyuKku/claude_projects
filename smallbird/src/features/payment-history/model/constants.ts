/** "N개 보기" 선택지(사용자 결정 2026-10-28). 서버는 1~100을 받음(Swagger `size`). 기본은 맨 앞 값. */
export const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;
export const DEFAULT_PAGE_SIZE = PAGE_SIZE_OPTIONS[0];

export const PAGE_PARAM = "page";
export const SIZE_PARAM = "size";

/** 필터·쪽·개수 쿼리. 탭을 바꾸면 페이지가 지움. 검색어는 검색 대상 정책(스펙 §7 P-3)이 정해질 때까지 쿼리를 쓰지 않음. */
export const LIST_QUERY_PARAMS = [
  PAGE_PARAM,
  SIZE_PARAM,
  "dateFrom",
  "dateTo",
  "method",
  "status",
] as const;

/** 결제 내역 표는 PC(1440~)만 씀. TAB은 2열 카드, MO는 1열 카드. */
export const DESKTOP_QUERY = "(min-width: 1440px)";
