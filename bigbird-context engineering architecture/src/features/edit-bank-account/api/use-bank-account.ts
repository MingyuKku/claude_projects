import useSWR from "swr";
import useSWRImmutable from "swr/immutable";

import { fetchBankAccount, fetchBankList } from "./bank-api";

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

/** 은행 목록은 거의 바뀌지 않는 기준 데이터라 세션당 한 번만 읽음. */
export function useBankList() {
  const { data, error, isLoading } = useSWRImmutable(
    ["mypage", "bank-list"],
    fetchBankList,
  );
  return { banks: data ?? [], isLoading, isError: Boolean(error) };
}
