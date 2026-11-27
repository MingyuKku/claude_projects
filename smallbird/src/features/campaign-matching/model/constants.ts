/** "N개 보기" 선택지. 목록 API가 전체를 한 번에 줘서 화면에서 나눔. 기본은 맨 앞 값. */
export const PAGE_SIZE_OPTIONS = [10, 20, 30] as const;
export const DEFAULT_PAGE_SIZE = PAGE_SIZE_OPTIONS[0];

export const QUERY = {
  keyword: "q",
  status: "status",
  page: "page",
  size: "size",
} as const;

/** 검색어 최대 글자 수. */
export const SEARCH_MAX_LENGTH = 50;
