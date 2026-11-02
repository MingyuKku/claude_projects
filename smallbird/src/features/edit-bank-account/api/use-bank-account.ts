import useSWR from "swr";

import { fetchBankAccount } from "./bank-api";

/** 등록된 계좌. 아직 없으면 `account`가 null이고 `isLoading`이 끝난 상태. */
export function useBankAccount() {
  const { data, error, isLoading, mutate } = useSWR(
    ["mypage", "bank-account"],
    fetchBankAccount,
  );
  return {
    account: data ?? null,
    hasLoaded: data !== undefined,
    isLoading,
    isError: Boolean(error),
    mutate,
  };
}
