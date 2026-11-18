import useSWRMutation from "swr/mutation";

import { serverApi } from "@/shared/api";

async function delayExpiredPassword(
  _key: readonly string[],
  { arg }: { arg: string },
) {
  // The body is irrelevant; only success or failure matters.
  await serverApi.get<unknown>(`/login/delay-pw/${arg}`);
}

/** Postpones the change; the user is asked again after the next period. */
export function useDelayExpiredPassword() {
  const { trigger, isMutating } = useSWRMutation(
    ["delay-expired-password"] as const,
    delayExpiredPassword,
  );
  return { trigger, isMutating };
}
