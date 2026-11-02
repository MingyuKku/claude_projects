import { useSearchParams } from "react-router";

import {
  applyFilterValues,
  FILTER_PANEL_PARAM,
  readFilterValues,
} from "@/shared/components/list-filter";

import {
  DETAIL_QUERY_PARAMS,
  KEYWORD_PARAM,
  PAGE_PARAM,
} from "../model/constants";
import { parsePageParam } from "./page-param";

import type {
  FilterField,
  FilterValues,
} from "@/shared/components/list-filter";

/**
 * 목록의 검색어·필터·쪽. URL 쿼리가 소유함(새로고침·뒤로 가기에도 유지).
 * 탭을 바꿀 때 이 쿼리를 지우는 일은 탭을 가진 페이지가 함.
 */
export function useListParams(fields: FilterField[]) {
  const [searchParams, setSearchParams] = useSearchParams();

  const keyword = searchParams.get(KEYWORD_PARAM) ?? "";
  const page = parsePageParam(searchParams.get(PAGE_PARAM));
  const filters = readFilterValues(searchParams, fields);

  function update(change: (params: URLSearchParams) => void) {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      change(params);
      return params;
    });
  }

  return {
    keyword,
    page,
    filters,
    setKeyword: (next: string) =>
      update((params) => {
        if (next) params.set(KEYWORD_PARAM, next);
        else params.delete(KEYWORD_PARAM);
        params.delete(PAGE_PARAM);
      }),
    setFilters: (next: FilterValues) =>
      update((params) => applyFilterValues(params, fields, next, PAGE_PARAM)),
    /**
     * MO 필터 모달의 "적용하기". 필터를 쓰고 모달을 닫는 두 일을 한 기록에서 함: 모달을 연 기록(`?panel=filter`)을
     * 필터가 적용된 목록으로 바꿔, 닫기(뒤로 가기)가 방금 적용한 필터를 되돌리지 않게 함.
     */
    applyFiltersAndClosePanel: (next: FilterValues) =>
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          applyFilterValues(params, fields, next, PAGE_PARAM);
          params.delete(FILTER_PANEL_PARAM);
          return params;
        },
        { replace: true },
      ),
    /** 새로고침 버튼: 검색어·필터를 모두 지우고 처음 쪽으로. */
    reset: () =>
      update((params) => {
        applyFilterValues(params, fields, {}, PAGE_PARAM);
        params.delete(KEYWORD_PARAM);
      }),
    setPage: (next: number) =>
      update((params) => {
        params.set(PAGE_PARAM, String(next));
        for (const key of DETAIL_QUERY_PARAMS) params.delete(key);
      }),
    /** 마지막 쪽의 항목을 지웠거나 주소를 직접 고쳐 범위를 벗어난 쪽을 마지막 쪽으로 당김(기록은 쌓지 않음). */
    clampPage: (lastPage: number) =>
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          params.set(PAGE_PARAM, String(lastPage));
          return params;
        },
        { replace: true },
      ),
    buildPageHref: (target: number) => {
      const params = new URLSearchParams(searchParams);
      params.set(PAGE_PARAM, String(target));
      for (const key of DETAIL_QUERY_PARAMS) params.delete(key);
      return `?${params.toString()}`;
    },
  };
}
