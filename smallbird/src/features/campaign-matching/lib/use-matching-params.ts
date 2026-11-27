import { useSearchParams } from "react-router";

import { isProposalStatus } from "@/entities/campaign-progress";

import {
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
  QUERY,
} from "../model/constants";

import type { ProposalStatus } from "@/entities/campaign-progress";

function toPositiveInt(value: string | null) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}

/** 매칭 목록의 검색어·상태·쪽·개수. 주소 쿼리가 소유함(새로고침·뒤로 가기에도 유지). 모르는 값은 기본값. */
export function useMatchingParams() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawStatus = searchParams.get(QUERY.status) ?? "";
  const status: ProposalStatus | null = isProposalStatus(rawStatus)
    ? rawStatus
    : null;
  const size = toPositiveInt(searchParams.get(QUERY.size));

  function update(change: (params: URLSearchParams) => void) {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      change(params);
      return params;
    });
  }

  function setOrDelete(params: URLSearchParams, key: string, value: string) {
    if (value) params.set(key, value);
    else params.delete(key);
  }

  return {
    keyword: searchParams.get(QUERY.keyword) ?? "",
    status,
    page: toPositiveInt(searchParams.get(QUERY.page)) ?? 1,
    pageSize:
      PAGE_SIZE_OPTIONS.find((option) => option === size) ?? DEFAULT_PAGE_SIZE,
    /** 검색어·상태가 바뀌면 보던 쪽이 의미가 없어 처음 쪽으로. */
    setKeyword: (keyword: string) =>
      update((params) => {
        setOrDelete(params, QUERY.keyword, keyword.trim());
        params.delete(QUERY.page);
      }),
    setStatus: (next: string) =>
      update((params) => {
        setOrDelete(params, QUERY.status, next);
        params.delete(QUERY.page);
      }),
    setPage: (page: number) =>
      update((params) => params.set(QUERY.page, String(page))),
    setPageSize: (next: number) =>
      update((params) => {
        params.set(QUERY.size, String(next));
        params.delete(QUERY.page);
      }),
    buildPageHref: (page: number) => {
      const params = new URLSearchParams(searchParams);
      params.set(QUERY.page, String(page));
      return `?${params.toString()}`;
    },
    /** 새로고침 버튼: 검색·상태를 지우고 처음 쪽으로(개수는 둠). */
    reset: () =>
      update((params) => {
        params.delete(QUERY.keyword);
        params.delete(QUERY.status);
        params.delete(QUERY.page);
      }),
  };
}
