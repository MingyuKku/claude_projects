import { useSearchParams } from "react-router";

import {
  applyFilterValues,
  FILTER_PANEL_PARAM,
  readFilterValues,
} from "@/shared/components/list-filter";

import { KEYWORD_PARAM, PAGE_PARAM, SIZE_PARAM } from "../model/constants";
import { parsePageParam, parsePageSizeParam } from "./page-param";

import type {
  FilterField,
  FilterValues,
} from "@/shared/components/list-filter";

/**
 * 목록의 검색어·필터·쪽. URL 쿼리가 소유함(새로고침·뒤로 가기에도 유지).
 * 탭을 바꿀 때 이 쿼리를 지우는 일은 탭을 가진 페이지가 함.
 */
export function useListParams(
  fields: FilterField[],
  /** "N개 보기" 선택지. 맨 앞 값이 기본. */
  pageSizeOptions: readonly [number, ...number[]],
) {
  const [searchParams, setSearchParams] = useSearchParams();

  const keyword = searchParams.get(KEYWORD_PARAM) ?? "";
  const page = parsePageParam(searchParams.get(PAGE_PARAM));
  const pageSize = parsePageSizeParam(
    searchParams.get(SIZE_PARAM),
    pageSizeOptions,
  );
  const filters = readFilterValues(searchParams, fields);

  // 목록 조건(검색어·필터·쪽·개수)이 바뀌어도 열어 둔 상세 보기(`panel`·`id`)는 그대로 둠. PC에서는 상세가 목록 옆에 떠 있어
  // 조건을 바꿔 가며 볼 수 있어야 하고, 대상이 새 목록에 없어도 상세는 열 때의 내용을 유지함(`useKeepDetail`).
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
    pageSize,
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
    /** "N개 보기" 변경. 개수가 바뀌면 보던 쪽이 의미가 없어져 처음 쪽으로 돌아감. */
    setPageSize: (next: number) =>
      update((params) => {
        params.set(SIZE_PARAM, String(next));
        params.delete(PAGE_PARAM);
      }),
    setPage: (next: number) =>
      update((params) => {
        params.set(PAGE_PARAM, String(next));
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
      return `?${params.toString()}`;
    },
  };
}
