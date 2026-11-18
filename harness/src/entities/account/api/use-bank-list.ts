import useSWRImmutable from "swr/immutable";

import { serverApiV3 } from "@/shared/api";

import { bankListSchema } from "../model/bank-schema";

export async function fetchBankList() {
  const response = await serverApiV3.get("/mypage/account/bank/list");
  return bankListSchema.parse(response).bankList;
}

/** 은행 목록은 거의 바뀌지 않는 기준 데이터라 세션당 한 번만 읽음. */
export function useBankList() {
  const { data, error, isLoading, mutate } = useSWRImmutable(
    ["mypage", "bank-list"],
    fetchBankList,
  );
  return { banks: data ?? [], isLoading, isError: Boolean(error), mutate };
}
