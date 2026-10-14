import useSWRMutation from "swr/mutation";

import { serverApi } from "@/shared/api";

import { expiredPasswordResultSchema } from "../model/schema";

import type { ExpiredPasswordInput } from "../model/schema";

async function changeExpiredPassword(
  _key: readonly string[],
  { arg }: { arg: ExpiredPasswordInput },
) {
  const response = await serverApi.put<unknown>("/login/expire", arg);
  return expiredPasswordResultSchema.parse(response);
}

/** Confirms the original password and replaces it with a new one. */
export function useChangeExpiredPassword() {
  const { trigger, isMutating } = useSWRMutation(
    ["change-expired-password"] as const,
    changeExpiredPassword,
  );
  return { trigger, isMutating };
}
