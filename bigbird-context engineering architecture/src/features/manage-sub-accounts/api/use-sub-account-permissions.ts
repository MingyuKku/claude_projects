import {
  MOCK_CAMPAIGN_ASSIGNMENTS,
  MOCK_PERMISSIONS,
} from "../model/mock-permission";

/**
 * Sub ID의 메뉴 권한. 조회·저장 API가 공개되기 전이라 목 데이터를 돌려줌(스펙 §7 B-3).
 * API가 나오면 `accountIdx`를 받는 SWR 훅으로 바꾸고 이 목 분기와 model/mock-permission.ts를 지움.
 */
export function useSubAccountPermissions() {
  return { permissions: MOCK_PERMISSIONS, isLoading: false };
}

/**
 * Master의 캠페인과 이 Sub ID의 담당 여부(페이지 없이 전부). `GET /campaign` 응답 스키마가 반영됐으나(2026-10-22)
 * 화면 열(상품 유형·세부 상품·진행 상태)에 맞는 필드가 불명확하고 Sub ID 목록 API가 없어 `accountIdx`를 얻지 못하므로
 * 목 데이터를 돌려줌(docs/mypage-api.md §4-5). 실제 훅은 `accountIdx`를 받음.
 */
export function useCampaignAssignments() {
  return { campaigns: MOCK_CAMPAIGN_ASSIGNMENTS, isLoading: false };
}
