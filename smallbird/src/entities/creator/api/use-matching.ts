import { unique } from "radash";
import useSWR, { unstable_serialize, useSWRConfig } from "swr";

import {
  COMMENT_PAGE_SIZE,
  CREATOR_PAGE_SIZE,
  fetchCheckedFolderIdxs,
  fetchBookmarkFolders,
  fetchBookmarkPage,
  fetchCreatorDetail,
  fetchCreatorFeedCommentPage,
  fetchCreatorFeedDetail,
  fetchCreatorFeedPage,
  fetchCreatorFilterOptions,
  fetchCreatorIntro,
  fetchCreatorMetrics,
  fetchCreatorSearchPage,
  fetchMatchingCategories,
  fetchMatchingPlatforms,
  fetchProposalPanel,
} from "./matching-api";
import { useOffsetPages } from "./use-offset-pages";

import type {
  BookmarkListFilters,
  CreatorSearchFilters,
} from "../model/search-query";
import type {
  CreatorDetailTarget,
  CreatorFeedTarget,
  CreatorTarget,
} from "../model/types";

const MATCHING_KEY = "matching";
const BOOKMARK_FOLDER_KEY = [MATCHING_KEY, "bookmark-folder"];
// 무한 목록 쪽 키의 직렬화 앞부분. 끝의 쉼표까지 봐서 `bookmark-folder`와 구분함.
const LIST_PAGE_KEY_PREFIXES = ["search", "bookmark"].map(
  (name) => `${unstable_serialize([MATCHING_KEY, name])}`,
);

// 서버 고정값·옵션 목록이라 화면 복귀 때마다 다시 읽지 않음.
const STATIC_OPTIONS = { revalidateOnFocus: false, revalidateIfStale: false };

export function useMatchingPlatforms() {
  const { data, error, isLoading, mutate } = useSWR(
    [MATCHING_KEY, "platform"],
    fetchMatchingPlatforms,
    STATIC_OPTIONS,
  );
  return {
    platforms: data ?? [],
    isLoading,
    isError: Boolean(error),
    reload: () => mutate(),
  };
}

export function useMatchingCategories() {
  const { data, error, isLoading, mutate } = useSWR(
    [MATCHING_KEY, "category"],
    fetchMatchingCategories,
    STATIC_OPTIONS,
  );
  return {
    categories: data?.categories ?? [],
    allCategoryIdx: data?.allCategoryIdx,
    allCategoryName: data?.allCategoryName,
    isLoading,
    isError: Boolean(error),
    reload: () => mutate(),
  };
}

export function useCreatorFilterOptions() {
  const { data, error, isLoading, mutate } = useSWR(
    [MATCHING_KEY, "filter-options"],
    fetchCreatorFilterOptions,
    STATIC_OPTIONS,
  );
  return {
    options: data,
    isLoading,
    isError: Boolean(error),
    reload: () => mutate(),
  };
}

/** 조건(플랫폼)이나 '전체' 카테고리 idx를 받기 전에는 읽지 않음. */
export function useCreatorSearch(
  filters: CreatorSearchFilters | null,
  allCategoryIdx: number | undefined,
) {
  const pages = useOffsetPages(
    filters === null || allCategoryIdx === undefined
      ? null
      : [MATCHING_KEY, "search", JSON.stringify(filters), allCategoryIdx],
    CREATOR_PAGE_SIZE,
    (offset) => {
      if (filters === null || allCategoryIdx === undefined) {
        throw new Error("search conditions are not ready");
      }
      return fetchCreatorSearchPage(filters, allCategoryIdx, offset);
    },
  );
  // 여러 카테고리·플랫폼을 합친 검색은 같은 크리에이터가 카테고리마다 따로 와서 첫 행만 남김.
  return { ...pages, items: unique(pages.items, (item) => item.key) };
}

/** 조건(플랫폼)을 정하기 전에는 null을 넘겨 읽지 않음. */
export function useBookmarkList(filters: BookmarkListFilters | null) {
  return useOffsetPages(
    filters && [MATCHING_KEY, "bookmark", JSON.stringify(filters)],
    CREATOR_PAGE_SIZE,
    (offset) => {
      if (!filters) throw new Error("bookmark conditions are not ready");
      return fetchBookmarkPage(filters, offset);
    },
  );
}

export function useBookmarkFolders() {
  const { data, error, isLoading, mutate } = useSWR(
    BOOKMARK_FOLDER_KEY,
    fetchBookmarkFolders,
  );
  return {
    folders: data ?? [],
    isLoading,
    isError: Boolean(error) && data === undefined,
    reload: () => mutate(),
  };
}

/**
 * 즐겨찾기 저장·해제·이동·폴더 변경 뒤 폴더 목록(인원 수)과 크리에이터 목록을 다시 읽음.
 * 무한 목록은 쪽 캐시가 있으면 서버를 부르지 않으므로 쪽 캐시를 지운 뒤, 지금 보는 목록을 알림(안 보이는 목록은 다음에 열 때 읽음).
 */
export function useRefreshBookmarkFolders() {
  const { cache, mutate } = useSWRConfig();
  return () => {
    const hasPrefix = (key: string, lead = "") =>
      LIST_PAGE_KEY_PREFIXES.some((prefix) => key.startsWith(lead + prefix));
    const keys = [...cache.keys()];
    for (const key of keys) if (hasPrefix(key)) cache.delete(key);
    for (const key of keys) if (hasPrefix(key, "$inf$")) void mutate(key);
    return mutate(BOOKMARK_FOLDER_KEY);
  };
}

/** 고른 크리에이터가 모두 들어 있는 폴더. 다른 화면에서 바뀔 수 있어 열 때마다 새로 읽고, 다 읽기 전에는 값을 주지 않음. */
export function useBookmarkFolderMembership(targets: CreatorTarget[]) {
  const { data, error, isValidating, mutate } = useSWR(
    [
      MATCHING_KEY,
      "folder-membership",
      ...targets.map((item) => `${item.platformIdx}:${item.platformId}`),
    ],
    () => fetchCheckedFolderIdxs(targets),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 0,
    },
  );
  return {
    checkedFolderIdxs: isValidating ? undefined : data,
    isError: Boolean(error) && !isValidating,
    reload: () => mutate(),
  };
}

export function useCreatorDetail(target: CreatorDetailTarget) {
  const { data, error, isLoading, mutate } = useSWR(
    [
      MATCHING_KEY,
      "detail",
      target.platformIdx,
      target.platformId,
      target.categoryIdx,
    ],
    () => fetchCreatorDetail(target),
  );
  return {
    detail: data,
    isLoading,
    isError: Boolean(error) && data === undefined,
    reload: () => mutate(),
  };
}

/** 즐겨찾기를 바꾼 뒤 열려 있는 상세의 저장 표시를 다시 읽음. */
export function useRefreshCreatorDetail() {
  const { mutate } = useSWRConfig();
  return () =>
    mutate(
      (key) =>
        Array.isArray(key) && key[0] === MATCHING_KEY && key[1] === "detail",
    );
}

export function useCreatorMetrics(target: CreatorDetailTarget) {
  const { data, error, isLoading, mutate } = useSWR(
    [
      MATCHING_KEY,
      "metrics",
      target.platformIdx,
      target.platformId,
      target.categoryIdx,
    ],
    () => fetchCreatorMetrics(target),
  );
  return {
    metrics: data,
    isLoading,
    isError: Boolean(error) && data === undefined,
    reload: () => mutate(),
  };
}

export function useCreatorIntro(target: CreatorTarget) {
  const { data, error, isLoading, mutate } = useSWR(
    [MATCHING_KEY, "intro", target.platformIdx, target.platformId],
    () => fetchCreatorIntro(target),
  );
  return {
    intro: data,
    isLoading,
    isError: Boolean(error) && data === undefined,
    reload: () => mutate(),
  };
}

export function useCreatorFeed(target: CreatorTarget) {
  return useOffsetPages(
    [MATCHING_KEY, "feed", target.platformIdx, target.platformId],
    CREATOR_PAGE_SIZE,
    (offset) => fetchCreatorFeedPage(target, offset),
  );
}

export function useCreatorFeedDetail(target: CreatorFeedTarget) {
  const { data, error, isLoading, mutate } = useSWR(
    [
      MATCHING_KEY,
      "feed-detail",
      target.platformIdx,
      target.tmiIdx,
      target.articleUrl,
    ],
    () => fetchCreatorFeedDetail(target),
  );
  return {
    post: data,
    isLoading,
    isError: Boolean(error) && data === undefined,
    reload: () => mutate(),
  };
}

export function useCreatorFeedComments(target: CreatorFeedTarget) {
  return useOffsetPages(
    [
      MATCHING_KEY,
      "feed-comment",
      target.platformIdx,
      target.tmiIdx,
      target.articleUrl,
    ],
    COMMENT_PAGE_SIZE,
    (offset) => fetchCreatorFeedCommentPage(target, offset),
  );
}

/** 캠페인 목록은 바뀔 수 있어 창을 열 때마다 읽음. */
export function useProposalPanel(targets: CreatorDetailTarget[]) {
  const { data, error, isLoading, mutate } = useSWR(
    [
      MATCHING_KEY,
      "proposal-panel",
      ...targets.map(
        (item) => `${item.platformIdx}:${item.platformId}:${item.categoryIdx}`,
      ),
    ],
    () => fetchProposalPanel(targets),
    { revalidateOnFocus: false },
  );
  return {
    panel: data,
    isLoading,
    isError: Boolean(error) && data === undefined,
    reload: () => mutate(),
  };
}
