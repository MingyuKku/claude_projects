import useSWR from "swr";

import { useListSync } from "@/shared/lib";

import { fetchUsageFilterOptions } from "./usage-api";
import { USAGE_SYNC } from "./use-history-sync";

const USAGE_FILTER_OPTIONS_KEY = [
  "mypage",
  "bigbird-money",
  "usage-filter-options",
];

/**
 * 사용 내역 필터의 캠페인·사용 내역 선택지. 실패하면 선택지가 없어 Select가 비활성이 되고 목록 조회는 계속함.
 * `isLoading`은 처음 읽는 동안만 참(읽어 둔 캐시가 있거나 실패하면 거짓).
 * 캐시가 있으면 다시 그려질 때(TAB·MO에서 상세를 닫을 때 등) 읽지 않고, 빅버드 머니 화면에 다시 들어왔을 때만 다시 읽음
 * (사용 내역 버전을 따름, `useListSync`).
 */
export function useUsageFilterOptions() {
  const { data, isLoading, mutate } = useSWR(
    USAGE_FILTER_OPTIONS_KEY,
    fetchUsageFilterOptions,
    { revalidateIfStale: false },
  );
  useListSync(USAGE_SYNC, "filter-options", {
    isEnabled: true,
    hasData: data !== undefined,
    reload: mutate,
  });
  return {
    isLoading,
    campaigns: data?.campaigns ?? [],
    usageDetails: data?.usageDetails ?? [],
  };
}
