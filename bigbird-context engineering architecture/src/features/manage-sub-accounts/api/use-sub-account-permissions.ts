import useSWR from "swr";
import useSWRMutation from "swr/mutation";

import { applyPermissionChange } from "../lib/transform-sub-accounts";
import { MOCK_CAMPAIGN_ASSIGNMENTS } from "../model/mock-permission";
import {
  fetchSubAccountPermissions,
  updateSubAccountPermission,
} from "./permission-api";

import type {
  SubAccountPermission,
  SubAccountPermissionChange,
} from "../model/types";

function permissionKey(accountIdx: number) {
  return ["mypage", "sub-permission", accountIdx] as const;
}

/** Sub ID의 메뉴 권한. */
export function useSubAccountPermissions(accountIdx: number) {
  const { data, error, isLoading, mutate } = useSWR(
    permissionKey(accountIdx),
    () => fetchSubAccountPermissions(accountIdx),
  );
  return { permissions: data, isLoading, isError: Boolean(error), mutate };
}

/** 스위치를 바꾸는 즉시 화면에 반영하고, 실패하면 이전 값으로 되돌림. 실패는 반환한 함수가 던짐. */
export function useUpdateSubAccountPermission(accountIdx: number) {
  const { trigger } = useSWRMutation(
    permissionKey(accountIdx),
    (_key, { arg }: { arg: SubAccountPermissionChange }) =>
      updateSubAccountPermission(accountIdx, arg),
  );

  /** `current`는 화면에 그린 현재 권한(스위치는 조회가 끝난 뒤에만 그려짐). */
  return (
    current: SubAccountPermission[],
    change: SubAccountPermissionChange,
  ) =>
    trigger(change, {
      optimisticData: applyPermissionChange(current, change),
      rollbackOnError: true,
      populateCache: true,
      revalidate: false,
    });
}

/**
 * Master의 캠페인과 이 Sub ID의 담당 여부(페이지 없이 전부). `GET /campaign`이 있으나 화면의 "진행 상태"가 어느 상태 코드인지
 * 정해지지 않아(docs/mypage-api.md §4-5) 개발 서버에서만 목 데이터를 돌려줌. 빌드에서는 빈 목록. 실제 훅은 `accountIdx`를 받음.
 */
export function useCampaignAssignments() {
  return { campaigns: MOCK_CAMPAIGN_ASSIGNMENTS, isLoading: false };
}
