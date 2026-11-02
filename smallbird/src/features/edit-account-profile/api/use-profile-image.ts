import useSWR from "swr";

import { fetchProfileImageUrl } from "./profile-api";

/** Master·Sub ID 모두 `GET /profile`로 현재 이미지를 읽음(Swagger에 권한 제한 없음, Sub 동작은 Stage 확인 전). */
export function useProfileImage() {
  const { data, isLoading, mutate } = useSWR(
    ["mypage", "profile-image"],
    fetchProfileImageUrl,
  );
  return { profileUrl: data ?? null, isLoading, mutate };
}
