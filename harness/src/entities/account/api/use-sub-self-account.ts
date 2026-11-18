import useSWR from "swr";

import { fetchSubSelfAccount } from "./mypage-api";

/** Sub ID 본인 정보(아이디·담당자명·휴대폰·이메일·생성일)와 프로필 이미지. 저장한 뒤에는 `mutate()`로 다시 읽음. */
export function useSubSelfAccount() {
  const { data, error, isLoading, mutate } = useSWR(
    ["mypage", "sub-self"],
    fetchSubSelfAccount,
  );
  return { account: data, isLoading, isError: Boolean(error), mutate };
}
