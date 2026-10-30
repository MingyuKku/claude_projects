import { serverApiV3 } from "@/shared/api";

import { transformSubAccountList } from "../lib/transform-sub-accounts";
import { SUB_ACCOUNT_PAGE_SIZE } from "../model/constants";
import { subAccountListSchema } from "../model/schema";

const SUB_ACCOUNT_PATH = "/mypage/account/sub";

interface FetchSubAccountsParams {
  keyword: string;
  page: number;
}

/**
 * `GET /v3/mypage/account/sub`. MASTER·ADMIN 전용. 검색은 시안대로 검색어 하나로 아이디·담당자명·이메일을 찾으므로
 * `searchType` 없이 `keyword`만 보냄(백엔드가 이 방식으로 바꿈, 2026-10-27 Swagger 확인).
 */
export async function fetchSubAccounts({
  keyword,
  page,
}: FetchSubAccountsParams) {
  const response = await serverApiV3.get(SUB_ACCOUNT_PATH, {
    params: {
      page,
      size: SUB_ACCOUNT_PAGE_SIZE,
      keyword: keyword || undefined,
    },
  });
  return transformSubAccountList(subAccountListSchema.parse(response));
}

/** `DELETE /v3/mypage/account/sub/{accountIdx}`. 응답은 `{ result }`. */
export function deleteSubAccount(accountIdx: number) {
  return serverApiV3.delete(`${SUB_ACCOUNT_PATH}/${accountIdx}`);
}
