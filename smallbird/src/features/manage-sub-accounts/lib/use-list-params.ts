import { useSearchParams } from "react-router";

import { KEYWORD_PARAM, PAGE_PARAM } from "../model/constants";

/** 목록의 검색어·쪽. URL 쿼리가 소유함(새로고침·뒤로 가기에도 유지). */
export function useListParams() {
  const [searchParams] = useSearchParams();
  return {
    keyword: searchParams.get(KEYWORD_PARAM) ?? "",
    page: Math.max(1, Number(searchParams.get(PAGE_PARAM)) || 1),
  };
}
