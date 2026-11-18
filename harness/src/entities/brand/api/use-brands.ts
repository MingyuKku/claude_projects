import useSWR from "swr";

import { fetchBrands } from "./brand-api";

export const BRANDS_KEY = ["campaign", "brands"] as const;

/** 광고주의 브랜드 목록. 브랜드를 추가한 뒤에는 `mutate`로 다시 읽음. */
export function useBrands() {
  const { data, error, isLoading, mutate } = useSWR(BRANDS_KEY, fetchBrands);
  return { brands: data, error, isLoading, mutate };
}
