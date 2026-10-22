import useSWR from "swr";

import { fetchMasterAccount } from "./mypage-api";

/**
 * Master 정보(기본 정보·회사정보·간편 로그인 연동). 정보 수정·회사정보·간편 로그인 카드가
 * 함께 읽으므로 같은 키로 한 번만 요청함. Sub ID는 403이라 `isEnabled`를 false로 넘겨
 * 요청하지 않음. 저장한 뒤에는 `mutate()`로 다시 읽음.
 */
export function useMasterAccount(isEnabled: boolean) {
  const { data, error, isLoading, mutate } = useSWR(
    isEnabled ? ["mypage", "master"] : null,
    fetchMasterAccount,
  );
  return { master: data, isLoading, isError: Boolean(error), mutate };
}
