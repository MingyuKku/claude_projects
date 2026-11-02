import useSWR from "swr";
import useSWRMutation from "swr/mutation";

import { serverApi } from "@/shared/api";

import { transformSwitchAccountsToViewModel } from "../lib/transform-switch-accounts";
import {
  switchAccountListSchema,
  switchAccountRequestSchema,
  switchAccountResultSchema,
} from "../model/switch-account-schema";

import type { SwitchAccountRequest } from "../model/switch-account-schema";

async function fetchSwitchAccounts() {
  const response = await serverApi.get("/super");
  return transformSwitchAccountsToViewModel(
    switchAccountListSchema.parse(response),
  );
}

export function useSwitchAccounts() {
  const { data, error, isLoading, mutate } = useSWR(
    ["switch-accounts"],
    fetchSwitchAccounts,
    {
      shouldRetryOnError: false,
      onError: (error: unknown) => {
        console.error(
          "계정 목록 조회 실패",
          error instanceof Error ? error.message : "알 수 없는 오류",
        );
      },
    },
  );
  return { accounts: data, isLoading, isError: Boolean(error), mutate };
}

async function switchAccount(
  _key: readonly string[],
  { arg }: { arg: SwitchAccountRequest },
) {
  // 구 앱은 name도 전송하지만 현재 OpenAPI 요청에는 userIdx만 정의되어 있다.
  const response = await serverApi.post(
    "/super/change",
    switchAccountRequestSchema.parse(arg),
  );
  const result = switchAccountResultSchema.parse(response);
  if (!result.result) throw new Error("계정 전환이 거부되었습니다.");
}

export function useSwitchAccount() {
  const { trigger, isMutating } = useSWRMutation(
    ["switch-account"],
    switchAccount,
  );
  return { trigger, isMutating };
}
