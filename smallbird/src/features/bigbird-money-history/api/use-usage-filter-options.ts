import useSWR from "swr";

import { fetchUsageFilterOptions } from "./usage-api";

const USAGE_FILTER_OPTIONS_KEY = [
  "mypage",
  "bigbird-money",
  "usage-filter-options",
];

/**
 * 사용 내역 필터의 캠페인·사용 내역 선택지. 실패하면 선택지가 없어 Select가 비활성이 되고 목록 조회는 계속함.
 * `isLoading`은 처음 읽는 동안만 참(읽어 둔 캐시가 있거나 실패하면 거짓).
 */
export function useUsageFilterOptions() {
  const { data, isLoading } = useSWR(
    USAGE_FILTER_OPTIONS_KEY,
    fetchUsageFilterOptions,
  );
  return {
    isLoading,
    campaigns: data?.campaigns ?? [],
    usageDetails: data?.usageDetails ?? [],
  };
}
