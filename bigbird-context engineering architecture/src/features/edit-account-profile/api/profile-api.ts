import { serverApiV3 } from "@/shared/api";

import { profileImageResponseSchema } from "../model/schema";

/** 현재 프로필 이미지 주소. 등록한 적이 없으면 null. */
export async function fetchProfileImageUrl() {
  const response = await serverApiV3.get("/mypage/account/profile");
  return profileImageResponseSchema.parse(response).profileUrl || null;
}

/** 새 비밀번호만 보냄. 현재 비밀번호 확인은 서버에 없음(Master). */
export function changeMasterPassword(password: string) {
  return serverApiV3.put("/mypage/account/password", { pw: password });
}

/**
 * 이메일 변경. 서버는 본인인증(`certIdx`)을 함께 요구하고, `email`을 비워 보내면 기존
 * 이메일이 지워지므로 항상 값을 채워 보냄.
 */
export function changeMasterEmail(params: { certIdx: number; email: string }) {
  return serverApiV3.put("/mypage/account/modify", params);
}

/** 이미지가 이미 있으면 수정(PATCH), 없으면 등록(POST). 없는 상태의 PATCH는 404. */
export function uploadProfileImage(file: File, hasExistingImage: boolean) {
  const body = new FormData();
  body.append("file", file);
  return hasExistingImage
    ? serverApiV3.patch("/mypage/account/profile", body)
    : serverApiV3.post("/mypage/account/profile", body);
}

/**
 * Sub ID 본인 변경은 Master와 경로가 달라(`/sub/*`, 서로 상대 경로는 403) 따로 둠. 이메일은 본인인증 없이 값만 보냄.
 * 휴대폰 변경(`/sub/phone`)은 본인인증 경로 확인 전(스펙 §7 B-12)이라 연결하지 않음.
 */
export function changeSubPassword(password: string) {
  return serverApiV3.put("/mypage/account/sub/pw", { pw: password });
}

export function changeSubEmail(email: string) {
  return serverApiV3.put("/mypage/account/sub/email", { email });
}

export function uploadSubProfileImage(file: File, hasExistingImage: boolean) {
  const body = new FormData();
  body.append("file", file);
  return hasExistingImage
    ? serverApiV3.patch("/mypage/account/sub/profile", body)
    : serverApiV3.post("/mypage/account/sub/profile", body);
}
