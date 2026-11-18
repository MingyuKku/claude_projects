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

/** 찾기 흐름에서 발급된 일회용 세션으로 새 비밀번호를 저장함. */
export function useChangePassword() {
  const { trigger, isMutating } = useSWRMutation(
    ["change-password"] as const,
    changePassword,
  );
  return { trigger, isMutating };
}
