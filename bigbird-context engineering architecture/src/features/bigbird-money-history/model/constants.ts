/** 목록 한 쪽의 건수. 서버 기본값(사용 8·충전 5)과 달라 요청마다 명시함. */
export const LIST_PAGE_SIZE = 10;

export const PAGE_PARAM = "page";
export const KEYWORD_PARAM = "keyword";
/** 상세 보기(`?panel=…&id=…`) 쿼리. `id`가 쪽 안의 순서라 쪽을 바꾸면 다른 건을 가리키게 되어 함께 지움. */
export const DETAIL_QUERY_PARAMS = ["panel", "id"] as const;

/** 필터·검색·쪽 쿼리. 탭이나 세그먼트를 바꾸면 페이지가 지움. */
export const LIST_QUERY_PARAMS = [
  PAGE_PARAM,
  KEYWORD_PARAM,
  "dateFrom",
  "dateTo",
  "status",
  "campaign",
  "usage",
] as const;

export const TABLET_QUERY = "(min-width: 768px)";
