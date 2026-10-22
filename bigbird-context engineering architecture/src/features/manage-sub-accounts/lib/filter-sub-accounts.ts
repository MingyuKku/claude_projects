import type { SubAccountViewModel } from "../model/types";

/** 아이디·담당자명·이메일에 검색어가 들어 있는 항목(대소문자 무시). 검색어가 비면 전부. */
export function filterSubAccounts(
  accounts: SubAccountViewModel[],
  keyword: string,
) {
  const needle = keyword.trim().toLowerCase();
  if (!needle) return accounts;
  return accounts.filter((account) =>
    [account.identifier, account.name, account.email].some((value) =>
      value.toLowerCase().includes(needle),
    ),
  );
}
