import { parseServerDate } from "@/entities/account";

import { PERMISSION_FIELDS, PERMISSION_KEYS } from "../model/constants";

import type { SubAccountAuthorization, SubAccountList } from "../model/schema";
import type {
  ApiPermissionKey,
  SubAccountPageViewModel,
  SubAccountPermission,
  SubAccountPermissionChange,
} from "../model/types";

export function transformSubAccountList(
  list: SubAccountList,
): SubAccountPageViewModel {
  return {
    accounts: (list.sub ?? []).map((account) => ({
      accountIdx: account.idx,
      identifier: account.identifier,
      name: account.name ?? "",
      email: account.email ?? "",
      createdAt: parseServerDate(account.created),
    })),
    totalCount: list.pagingInfo.totalCount,
    page: list.pagingInfo.page,
    totalPages: list.pagingInfo.totalPage,
  };
}

function isApiPermission(key: string): key is ApiPermissionKey {
  return Object.hasOwn(PERMISSION_FIELDS, key);
}

/** 서버가 주는 권한만 표 순서대로 그림. */
export function transformPermissions(
  authorization: SubAccountAuthorization,
): SubAccountPermission[] {
  return PERMISSION_KEYS.filter(isApiPermission).map((key) => ({
    key,
    isGranted: authorization[PERMISSION_FIELDS[key]],
  }));
}

export function applyPermissionChange(
  permissions: SubAccountPermission[],
  change: SubAccountPermissionChange,
) {
  return permissions.map((permission) =>
    permission.key === change.key
      ? { ...permission, isGranted: change.isGranted }
      : permission,
  );
}

/** `PUT /authorization` 본문. */
export function toAuthorizationBody(
  accountIdx: number,
  change: SubAccountPermissionChange,
) {
  return { accountIdx, [PERMISSION_FIELDS[change.key]]: change.isGranted };
}
