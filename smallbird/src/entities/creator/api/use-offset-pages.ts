import useSWRInfinite from "swr/infinite";

import type { OffsetPage } from "../model/types";

/**
 * offset·hasMore 방식 목록을 스크롤로 이어 읽음. `baseKey`가 null이면 읽지 않음.
 * 앞 묶음의 `hasMore`가 거짓이면 키를 비워 더 읽지 않음.
 */
export function useOffsetPages<T>(
  baseKey: readonly unknown[] | null,
  pageSize: number,
  fetchPage: (offset: number) => Promise<OffsetPage<T>>,
) {
  const { data, error, isLoading, size, setSize, mutate } = useSWRInfinite(
    (index: number, previous: OffsetPage<T> | null) => {
      if (!baseKey || (previous && !previous.hasMore)) return null;
      return [...baseKey, index * pageSize];
    },
    (key) => {
      const offset = key.at(-1);
      return fetchPage(typeof offset === "number" ? offset : 0);
    },
    { revalidateFirstPage: false },
  );

  const loadedPages = data?.length ?? 0;
  const hasMore = Boolean(data?.at(-1)?.hasMore);
  // 다시 읽어 쪽 수가 줄어도 size는 그대로라 더 읽을 쪽이 있는지도 봄.
  const isLoadingMore = hasMore && !isLoading && size > loadedPages && !error;

  return {
    items: data?.flatMap((page) => page.items) ?? [],
    totalCount: data?.[0]?.totalCount,
    hasMore,
    pageCount: loadedPages,
    isLoading,
    isLoadingMore,
    /** 처음 읽기 실패(보여 줄 목록이 없음). */
    isError: Boolean(error) && data === undefined,
    /** 이어 읽기 실패(먼저 읽은 목록은 남아 있음). */
    isLoadMoreError: Boolean(error) && data !== undefined,
    loadMore: () => {
      if (hasMore && !isLoadingMore && !error && size === loadedPages) {
        void setSize(size + 1);
      }
    },
    reload: () => mutate(),
  };
}
