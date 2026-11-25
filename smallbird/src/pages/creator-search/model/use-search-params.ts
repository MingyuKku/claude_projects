import { useSearchParams } from "react-router";

import type { MatchingPlatformCode } from "@/entities/creator";

const KEYWORD_PARAM = "keyword";
const PLATFORM_PARAM = "platform";
const CATEGORY_PARAM = "category";
const CATEGORY_SEPARATOR = ",";

function parseCategoryIdxs(value: string | null) {
  if (!value) return [];
  const idxs = value
    .split(CATEGORY_SEPARATOR)
    .map(Number)
    .filter((idx) => Number.isInteger(idx) && idx > 0);
  return [...new Set(idxs)];
}

/**
 * 검색어·플랫폼·카테고리를 주소 쿼리가 소유함. 플랫폼이 없거나 모르는 값이면 호출하는 쪽이 전체 플랫폼으로 봄.
 */
export function useSearchPageParams() {
  const [searchParams, setSearchParams] = useSearchParams();
  const keyword = searchParams.get(KEYWORD_PARAM) ?? "";
  const platformCode = searchParams.get(PLATFORM_PARAM);
  const categoryIdxs = parseCategoryIdxs(searchParams.get(CATEGORY_PARAM));
  const hasConditions =
    keyword !== "" || platformCode !== null || categoryIdxs.length > 0;

  function updateParam(key: string, value: string | null) {
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      if (value) next.set(key, value);
      else next.delete(key);
      return next;
    });
  }

  return {
    keyword,
    platformCode,
    categoryIdxs,
    hasConditions,
    submitKeyword: (nextKeyword: string) =>
      updateParam(KEYWORD_PARAM, nextKeyword),
    /** null이면 전체 플랫폼. */
    selectPlatform: (code: MatchingPlatformCode | null) =>
      updateParam(PLATFORM_PARAM, code),
    selectCategories: (idxs: number[]) =>
      updateParam(CATEGORY_PARAM, idxs.join(CATEGORY_SEPARATOR)),
    /** MO 기본 필터처럼 플랫폼·카테고리를 한 번에 바꿈. */
    selectPlatformAndCategories: (
      code: MatchingPlatformCode | null,
      idxs: number[],
    ) =>
      setSearchParams((previous) => {
        const next = new URLSearchParams(previous);
        if (code) next.set(PLATFORM_PARAM, code);
        else next.delete(PLATFORM_PARAM);
        if (idxs.length)
          next.set(CATEGORY_PARAM, idxs.join(CATEGORY_SEPARATOR));
        else next.delete(CATEGORY_PARAM);
        return next;
      }),
    resetConditions: () => setSearchParams({}),
  };
}
