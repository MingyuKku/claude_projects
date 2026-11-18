import useSWR, { useSWRConfig } from "swr";

import { fetchBigbirdMoneyBalance } from "./biz-money-api";

export const BIGBIRD_MONEY_BALANCE_KEY = ["mypage", "bigbird-money", "balance"];

/**
 * 보유 빅버드 머니. 헤더와 빅버드 머니 화면이 같은 키를 읽어 한 번만 요청하고, 충전 뒤에는 두 곳이 같이 갱신됨.
 * 로그인하지 않았거나 잔액을 쓰지 않는 화면은 `isEnabled`를 false로 넘겨 요청하지 않음.
 */
export function useBigbirdMoneyBalance(isEnabled = true) {
  const { data, error, isLoading, mutate } = useSWR(
    isEnabled ? BIGBIRD_MONEY_BALANCE_KEY : null,
    fetchBigbirdMoneyBalance,
  );
  return { balance: data, isLoading, isError: Boolean(error), mutate };
}

/** 충전 복귀 뒤처럼 밖에서 잔액을 다시 읽을 때 씀. */
export function useRefreshBigbirdMoneyBalance() {
  const { mutate } = useSWRConfig();
  return () => mutate(BIGBIRD_MONEY_BALANCE_KEY);
}
