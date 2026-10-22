import { filterSubAccounts } from "../lib/filter-sub-accounts";
import { SUB_ACCOUNT_PAGE_SIZE } from "../model/constants";
import { MOCK_SUB_ACCOUNTS } from "../model/mock";

interface UseSubAccountsParams {
  keyword: string;
  page: number;
}

/**
 * Sub ID 목록·검색. 목록 API가 공개되기 전이라 목 데이터를 돌려줌(스펙 §7 B-3).
 * API가 나오면 SWR 훅으로 바꾸고 이 목 분기와 model/mock.ts를 지움.
 */
export function useSubAccounts({ keyword, page }: UseSubAccountsParams) {
  const matched = filterSubAccounts(MOCK_SUB_ACCOUNTS, keyword);
  const totalPages = Math.ceil(matched.length / SUB_ACCOUNT_PAGE_SIZE);
  // 범위를 벗어난 쪽(주소 직접 수정 등)은 마지막 쪽으로 당김.
  const currentPage = Math.min(Math.max(1, page), Math.max(1, totalPages));
  const start = (currentPage - 1) * SUB_ACCOUNT_PAGE_SIZE;

  return {
    accounts: matched.slice(start, start + SUB_ACCOUNT_PAGE_SIZE),
    totalCount: matched.length,
    page: currentPage,
    totalPages,
    isLoading: false,
  };
}

/** 권한 부여 대상 Sub ID를 인덱스로 찾음. 목 데이터 전체에서 찾으므로 다른 쪽(page)에 있는 항목도 열 수 있음. */
export function useSubAccount(accountIdx: number | null) {
  if (accountIdx === null) return null;
  return (
    MOCK_SUB_ACCOUNTS.find((account) => account.accountIdx === accountIdx) ??
    null
  );
}
