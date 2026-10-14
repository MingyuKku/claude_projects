import useSWRMutation from "swr/mutation";

import { memberApi } from "@/shared/api";
import { SERVICE_INDEX } from "@/shared/config";

import { changePasswordResultSchema } from "../model/schema";

async function changePassword(
  _key: readonly string[],
  { arg }: { arg: string },
) {
  const response = await memberApi.patch<unknown>(
    `/changePw/${SERVICE_INDEX}`,
    { pw: arg },
  );
  return changePasswordResultSchema.parse(response);
}

/** Saves the new password using the one-time session issued by the find flow. */
export function useChangePassword() {
  const { trigger, isMutating } = useSWRMutation(
    ["change-password"] as const,
    changePassword,
  );
  return { trigger, isMutating };
}
