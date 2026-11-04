import useSWR from "swr";

import { fetchSocialLinks } from "./mypage-api";

/**
 * 간편 로그인 연결 상태(카카오·네이버·구글·애플 4개). Master만 읽을 수 있어(Sub ID는 403) `isEnabled`로 요청을 막음.
 * 연결·해제 응답이 해제 뒤 상태 4개를 그대로 주므로 `mutate(links, { revalidate: false })`로 캐시를 바꿈.
 */
export function useSocialLinks(isEnabled: boolean) {
  const { data, error, isLoading, mutate } = useSWR(
    isEnabled ? ["mypage", "sns"] : null,
    fetchSocialLinks,
  );
  return { links: data, isLoading, isError: Boolean(error), mutate };
}
