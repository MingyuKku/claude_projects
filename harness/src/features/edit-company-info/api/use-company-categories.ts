import useSWRImmutable from "swr/immutable";

import { fetchCompanyCategories } from "./company-api";

/** 회사 분류는 거의 바뀌지 않는 기준 데이터라 세션당 한 번만 읽음. */
export function useCompanyCategories() {
  const { data, isLoading } = useSWRImmutable(
    ["mypage", "company-categories"],
    fetchCompanyCategories,
  );
  return { categories: data ?? [], isLoading };
}
