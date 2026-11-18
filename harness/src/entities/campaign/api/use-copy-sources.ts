import { useInfinitePages } from "@/shared/lib";

import { fetchCopySources } from "./campaign-api";

import type { CopySourceQuery } from "../model/types";

/** 이전 캠페인 불러오기 목록. 끝에 닿으면 다음 쪽을 이어 읽고, 조건(검색어)이 바뀌면 처음부터 다시 읽음. */
export function useCopySources(query: CopySourceQuery) {
  return useInfinitePages(["campaign", "copy-sources", query], (page) =>
    fetchCopySources(query, page),
  );
}
