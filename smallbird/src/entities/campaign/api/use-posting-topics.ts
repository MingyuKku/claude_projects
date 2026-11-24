import useSWR from "swr";

import { fetchPostingTopics } from "./posting-topic-api";

/** 포스팅 주제 선택지. 거의 바뀌지 않아 한 번 읽은 값을 다시 읽지 않음. */
export function usePostingTopics() {
  const { data, error, isLoading, mutate } = useSWR(
    ["campaign", "posting-topics"],
    fetchPostingTopics,
    { revalidateOnFocus: false, revalidateIfStale: false },
  );
  return { topics: data, error, isLoading, mutate };
}
