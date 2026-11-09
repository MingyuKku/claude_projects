/** "N개 보기" 선택지(사용자 결정 2026-10-28). 서버는 1~100을 받음(Swagger `size`). 기본은 맨 앞 값. */
export const PAGE_SIZE_OPTIONS = [10, 20, 30] as const;
export const DEFAULT_PAGE_SIZE = PAGE_SIZE_OPTIONS[0];

export const PAGE_PARAM = "page";
export const SIZE_PARAM = "size";

/** 필터·쪽·개수 쿼리. 탭을 바꾸면 페이지가 지움. 결제 내역은 검색이 없어 검색어 쿼리를 쓰지 않음. */
export const LIST_QUERY_PARAMS = [
  PAGE_PARAM,
  SIZE_PARAM,
  "dateFrom",
  "dateTo",
  "item",
  "method",
  "status",
] as const;

/**
 * 결제 내역 필터 선택지(시안 11755:97599: 월·연 구독 상품 × PICK형·모집형, 이 순서). 값은 URL 쿼리(`?item=monthly_pick`)에 쓰고,
 * 요청 때 결제 주기와 상품 유형 두 조건으로 나눔.
 */
export const PAYMENT_ITEMS = [
  { value: "monthly_pick", billingPeriod: "monthly", productType: "pick" },
  {
    value: "monthly_recruit",
    billingPeriod: "monthly",
    productType: "recruit",
  },
  { value: "yearly_pick", billingPeriod: "yearly", productType: "pick" },
  { value: "yearly_recruit", billingPeriod: "yearly", productType: "recruit" },
] as const;
