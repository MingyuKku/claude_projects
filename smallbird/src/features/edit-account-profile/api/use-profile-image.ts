import useSWR from "swr";

import { fetchProfileImageUrl } from "./profile-api";

/**
 * 현재 프로필 이미지를 어디서 읽는지. Sub ID는 본인 정보(`GET /sub/self`)에 담겨 오고, Master는 `GET /master`에 없어
 * `GET /profile`로 따로 읽음. `/profile`은 회사(Master) 기준이라 Sub가 부르면 Master 이미지가 옴(2026-11-03 백엔드 확인).
 */
export type ProfileImageSource =
  { accountType: "master" } | { accountType: "sub"; url: string | null };

/** 지금 보일 프로필 이미지 주소. 등록한 적이 없으면 null. Sub는 저장 뒤 화면이 본인 정보를 다시 읽어 갱신되므로 `refresh`가 할 일이 없음. */
export function useProfileImage(source: ProfileImageSource) {
  const isMaster = source.accountType === "master";
  const { data, mutate } = useSWR(
    isMaster ? ["mypage", "profile-image"] : null,
    fetchProfileImageUrl,
  );
  return {
    profileUrl: isMaster ? (data ?? null) : source.url,
    refresh: mutate,
  };
}
