import { useSearchParams } from "react-router";

import type { MatchingPlatformCode } from "@/entities/creator";

const FOLDER_PARAM = "folder";
const KEYWORD_PARAM = "q";
const PLATFORM_PARAM = "platform";
const CATEGORY_PARAM = "category";
const CATEGORY_SEPARATOR = ",";

function parseFolderIdx(value: string | null) {
  const folderIdx = Number(value);
  return Number.isInteger(folderIdx) && folderIdx > 0 ? folderIdx : null;
}

function parseCategoryIdxs(value: string | null) {
  if (!value) return [];
  const idxs = value
    .split(CATEGORY_SEPARATOR)
    .map(Number)
    .filter((idx) => Number.isInteger(idx) && idx > 0);
  return [...new Set(idxs)];
}

/** 폴더·검색어·플랫폼·카테고리를 주소 쿼리가 소유함. 폴더가 없으면 `전체`(null). */
export function useManageParams() {
  const [searchParams, setSearchParams] = useSearchParams();
  const folderIdx = parseFolderIdx(searchParams.get(FOLDER_PARAM));
  const keyword = searchParams.get(KEYWORD_PARAM) ?? "";
  const platformCode = searchParams.get(PLATFORM_PARAM);
  const categoryIdxs = parseCategoryIdxs(searchParams.get(CATEGORY_PARAM));

  function updateParam(key: string, value: string | null) {
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      if (value) next.set(key, value);
      else next.delete(key);
      return next;
    });
  }

  return {
    folderIdx,
    keyword,
    platformCode,
    categoryIdxs,
    selectFolder: (nextFolderIdx: number | null) =>
      updateParam(
        FOLDER_PARAM,
        nextFolderIdx === null ? null : String(nextFolderIdx),
      ),
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
    /** 보고 있는 폴더는 남김. */
    resetConditions: () =>
      setSearchParams((previous) => {
        const next = new URLSearchParams(previous);
        next.delete(KEYWORD_PARAM);
        next.delete(PLATFORM_PARAM);
        next.delete(CATEGORY_PARAM);
        return next;
      }),
  };
}
