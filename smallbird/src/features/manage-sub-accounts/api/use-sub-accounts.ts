import useSWR, { useSWRConfig } from "swr";

import { useListParams } from "../lib/use-list-params";
import { deleteSubAccount, fetchSubAccounts } from "./list-api";

const SUB_ACCOUNTS_KEY = "sub-accounts";

interface UseSubAccountsParams {
  keyword: string;
  page: number;
}

function isSubAccountsKey(key: unknown) {
  return (
    Array.isArray(key) && key[0] === "mypage" && key[1] === SUB_ACCOUNTS_KEY
  );
}

/**
 * Sub ID 목록·검색 한 쪽. 쪽을 넘기는 동안에는 이전 쪽을 그대로 보여 깜빡이지 않게 함.
 * `null`이면 읽지 않음(MASTER·ADMIN 전용 API라 Sub 로그인에서 부르면 403).
 */
export function useSubAccounts(params: UseSubAccountsParams | null) {
  const { data, error, isLoading, mutate } = useSWR(
    params && ["mypage", SUB_ACCOUNTS_KEY, params.keyword, params.page],
    ([, , keyword, page]) => fetchSubAccounts({ keyword, page }),
    { keepPreviousData: true },
  );
  return { list: data, isLoading, isError: Boolean(error), mutate };
}

/**
 * 권한 부여·수정 대상 Sub ID. 지금 보고 있는 쪽에서 찾음(쪽을 넘기면 권한 부여가 닫히므로 다른 쪽은 볼 일이 없음).
 * 대상이 없으면 목록을 읽지 않음. 계정 설정 페이지가 탭과 상관없이 부르므로 Sub 로그인에서도 실행됨.
 */
export function useSubAccount(accountIdx: number | null) {
  const listParams = useListParams();
  const { list } = useSubAccounts(accountIdx === null ? null : listParams);
  if (accountIdx === null) return null;
  return (
    list?.accounts.find((account) => account.accountIdx === accountIdx) ?? null
  );
}

/** 생성·삭제 뒤 모든 검색어·쪽의 목록을 다시 읽음. */
export function useRefreshSubAccounts() {
  const { mutate } = useSWRConfig();
  return () => mutate(isSubAccountsKey);
}

/** 삭제 요청 후 목록을 다시 읽음. 실패는 던지거나 `{ result: false }`로 옴. */
export function useDeleteSubAccount() {
  const refresh = useRefreshSubAccounts();
  return async (accountIdx: number) => {
    const response = await deleteSubAccount(accountIdx);
    await refresh();
    return response;
  };
}
