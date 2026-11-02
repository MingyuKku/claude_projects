import useSWRInfinite, { unstable_serialize } from "swr/infinite";

/** 쪽 단위로 나뉜 목록 응답. 쪽을 이어 붙일 때 필요한 값만 둠. */
export interface PagedResult<T> {
  records: T[];
  totalCount: number;
  totalPages: number;
}

// 앞 쪽의 전체 쪽 수를 넘으면 키를 비워 더 읽지 않음.
function createGetKey<T>(baseKey: readonly unknown[], isEnabled = true) {
  return (index: number, previous: PagedResult<T> | null) => {
    if (!isEnabled) return null;
    return previous && index >= previous.totalPages
      ? null
      : [...baseKey, index + 1];
  };
}

/**
 * `useInfinitePages`가 쓰는 SWR 캐시 키. 목록 화면이 닫혀 있는 동안에도 `mutate(infinitePagesCacheKey(key))`로
 * 낡았다고 표시해 두면 다음에 열 때 다시 읽음.
 */
export function infinitePagesCacheKey(baseKey: readonly unknown[]) {
  return unstable_serialize(createGetKey(baseKey));
}

/**
 * 쪽 나눔 API를 스크롤 목록으로 이어 읽음(MO 목록). `baseKey`는 쪽 번호를 뺀 SWR 키이고 `fetchPage`는 1부터 시작하는 쪽을 읽음.
 * 먼저 읽은 쪽은 그대로 두고 `loadMore`가 다음 쪽을 이어 붙임. `isEnabled`가 거짓이면 읽지 않음(PC·TAB에서는 쪽 나눔 목록을 씀).
 */
export function useInfinitePages<T>(
  baseKey: readonly unknown[],
  fetchPage: (page: number) => Promise<PagedResult<T>>,
  {
    isEnabled = true,
    revalidateIfStale = true,
  }: {
    isEnabled?: boolean;
    /** false면 이미 읽은 쪽이 캐시에 있을 때 다시 읽지 않음(목록에서 읽은 것을 다른 화면이 그대로 쓸 때). 캐시가 없으면 읽음. */
    revalidateIfStale?: boolean;
  } = {},
) {
  const { data, error, isLoading, size, setSize, mutate } = useSWRInfinite(
    createGetKey<T>(baseKey, isEnabled),
    (key) => {
      const page = key.at(-1);
      return fetchPage(typeof page === "number" ? page : 1);
    },
    // 다음 쪽을 붙일 때마다 첫 쪽을 다시 읽지 않음(새로고침·화면 복귀 때만 다시 읽음).
    { revalidateFirstPage: false, revalidateIfStale },
  );

  const loadedPages = data?.length ?? 0;
  const totalPages = data?.[0]?.totalPages ?? 0;
  // 요청은 했지만 아직 도착하지 않은 쪽이 있으면 이어 읽는 중.
  const isLoadingMore =
    !isLoading && size > loadedPages && data !== undefined && !error;
  const hasMore = loadedPages > 0 && loadedPages < totalPages;

  return {
    records: data?.flatMap((page) => page.records) ?? [],
    totalCount: data?.[0]?.totalCount ?? 0,
    hasMore,
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
    /** 읽은 쪽을 모두 다시 읽음. */
    reload: () => mutate(),
  };
}
