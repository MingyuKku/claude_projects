import { serverApiV3 } from "@/shared/api";

import {
  toAuthorizationBody,
  transformPermissions,
} from "../lib/transform-sub-accounts";
import { subAccountAuthorizationSchema } from "../model/schema";

import type { SubAccountPermissionChange } from "../model/types";

const AUTHORIZATION_PATH = "/mypage/account/authorization";

/** `GET /v3/mypage/account/authorization/{accountIdx}`. 본인 소유가 아닌 Sub ID면 403. */
export async function fetchSubAccountPermissions(accountIdx: number) {
  const response = await serverApiV3.get(`${AUTHORIZATION_PATH}/${accountIdx}`);
  return transformPermissions(subAccountAuthorizationSchema.parse(response));
}

/** 응답이 바뀐 뒤의 전체 권한이라 그대로 캐시로 씀. */
export async function updateSubAccountPermission(
  accountIdx: number,
  change: SubAccountPermissionChange,
) {
  const response = await serverApiV3.put(
    AUTHORIZATION_PATH,
    toAuthorizationBody(accountIdx, change),
  );
  return transformPermissions(subAccountAuthorizationSchema.parse(response));
}
