import useSWRInfinite from "swr/infinite";

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
 * 쪽 나눔 API를 스크롤 목록으로 이어 읽음. `baseKey`는 쪽 번호를 뺀 SWR 키이고 `fetchPage`는 1부터 시작하는 쪽을 읽음.
 * 먼저 읽은 쪽은 그대로 두고 `loadMore`가 다음 쪽을 이어 붙임. `isEnabled`가 거짓이면 읽지 않음(화면 폭에 따라 쪽 나눔 목록을 쓰는 동안).
 * 캐시가 있으면 스스로 다시 읽지 않으므로, 다시 읽는 때는 쓰는 훅이 정해 `reload`·`revalidatePages`를 부름.
 */
export function useInfinitePages<T>(
  baseKey: readonly unknown[],
  fetchPage: (page: number) => Promise<PagedResult<T>>,
  {
    isEnabled = true,
    revalidateIfStale = true,
    revalidateFirstPage = false,
  }: {
    isEnabled?: boolean;
    /** false면 이미 읽은 쪽이 캐시에 있을 때 다시 읽지 않음(목록에서 읽은 것을 다른 화면이 그대로 쓸 때). 캐시가 없으면 읽음. */
    revalidateIfStale?: boolean;
    /**
     * true(SWR 기본값)면 화면 복귀·조건 전환·다음 쪽 때 첫 쪽을 다시 확인함. 첫 쪽만 새로 받으면 맨 위에 항목이 생긴 만큼
     * 쪽 경계가 밀려 항목이 빠질 수 있어 기본은 끄고, 다시 읽기는 `reload`·`revalidatePages`로 함.
     * 끈 동안은 전역 `mutate`(SWR `unstable_serialize` 키)로도 읽어 둔 쪽을 다시 읽지 않음(SWR이 모든 쪽을 다시 읽는 표시는 이 훅의 `mutate`만 켬).
     */
    revalidateFirstPage?: boolean;
  } = {},
) {
  const { data, error, isLoading, size, setSize, mutate } = useSWRInfinite(
    createGetKey<T>(baseKey, isEnabled),
    (key) => {
      const page = key.at(-1);
      return fetchPage(typeof page === "number" ? page : 1);
    },
    { revalidateIfStale, revalidateFirstPage },
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
    /** 한 번이라도 읽어 캐시가 있음(0건 포함). */
    hasData: data !== undefined,
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
    /** 읽은 쪽 가운데 `shouldRevalidate`가 참인 쪽만 다시 읽음(SWR "Revalidate Specific Pages"). */
    revalidatePages: (shouldRevalidate: (page: PagedResult<T>) => boolean) =>
      data
        ? mutate(data, {
            revalidate: (page?: PagedResult<T>) =>
              page === undefined || shouldRevalidate(page),
          })
        : Promise.resolve(undefined),
  };
}
