import { serverApiV3 } from "@/shared/api";

import {
  transformMasterToViewModel,
  transformSubSelfToViewModel,
} from "../lib/transform-master";
import { transformSnsListToLinks } from "../lib/transform-sns";
import {
  accountMasterSchema,
  accountSnsListSchema,
  simpleResultSchema,
  subSelfAccountSchema,
} from "../model/mypage-schema";

import type { SocialProvider } from "../model/mypage-schema";
import type { SocialLinkCredential } from "../model/social-link";

export type DuplicateCheckType = "id" | "email";
export type DuplicateCheckResult = "available" | "taken";

/** `GET /v3/mypage/account/master`. Sub ID는 403이라 호출하지 않음. */
export async function fetchMasterAccount() {
  const response = await serverApiV3.get("/mypage/account/master");
  return transformMasterToViewModel(accountMasterSchema.parse(response));
}

/** `GET /v3/mypage/account/sub/self`. Master는 403이라 Sub ID 화면에서만 호출함. */
export async function fetchSubSelfAccount() {
  const response = await serverApiV3.get("/mypage/account/sub/self");
  return transformSubSelfToViewModel(subSelfAccountSchema.parse(response));
}

/**
 * 아이디·이메일 중복확인. 서버가 존재 여부를 돌려주므로 `result: false`가 사용 가능
 * (v2 동작, Stage 확인 전). `result`가 없거나 boolean이 아니면 파싱이 실패해 사용 가능으로
 * 읽히지 않음.
 */
export async function checkAccountValue(
  type: DuplicateCheckType,
  data: string,
): Promise<DuplicateCheckResult> {
  const response = await serverApiV3.post(`/mypage/account/check/${type}`, {
    data,
  });
  return simpleResultSchema.parse(response).result ? "taken" : "available";
}

/** 현재 비밀번호 일치 확인(`type=pw`). 회원 탈퇴 전 확인에 씀. `result: true`가 일치. */
export async function verifyCurrentPassword(password: string) {
  const response = await serverApiV3.post("/mypage/account/check/pw", {
    data: password,
  });
  return simpleResultSchema.parse(response).result;
}

/** `GET /v3/mypage/account/sns`. 연결 상태 4개(Master만, Sub ID는 403). */
export async function fetchSocialLinks() {
  const response = await serverApiV3.get("/mypage/account/sns");
  return transformSnsListToLinks(accountSnsListSchema.parse(response));
}

/**
 * `DELETE /v3/mypage/account/sns/{platform}`. 아이디·비밀번호 로그인은 그대로 남고, 응답은 해제 뒤 연결 상태 4개.
 * 연결돼 있지 않으면 404 `SNS_NOT_LINKED`(`readFailureReason`으로 읽음).
 */
export async function unlinkSocial(platform: SocialProvider) {
  const response = await serverApiV3.delete(`/mypage/account/sns/${platform}`);
  return transformSnsListToLinks(accountSnsListSchema.parse(response));
}

/**
 * `POST /v3/mypage/account/sns/{platform}`. 카카오·구글은 인가 코드(`{ code, redirectUri }`), 네이버는 인가 코드와 `state`(`{ code, state }`), 애플은 ID 토큰(`{ token }`)만 보내고
 * 서버가 공급자에게 직접 확인해 로그인한 Master에 연결함. 같은 계정이 이미 연결돼 있으면 그대로 200이고, 응답은 처리 뒤 상태 4개.
 * 실패는 `readFailureReason`으로 읽음(409 `SNS_ALREADY_LINKED`·`SNS_LINKED_TO_OTHER_USER`, 400 `SNS_EMAIL_REQUIRED`·`INVALID_SNS_CODE` 등).
 */
export async function linkSocial(
  platform: SocialProvider,
  credential: SocialLinkCredential,
) {
  const response = await serverApiV3.post(
    `/mypage/account/sns/${platform}`,
    credential,
  );
  return transformSnsListToLinks(accountSnsListSchema.parse(response));
}
