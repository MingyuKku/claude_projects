import { serverApiV3 } from "@/shared/api";

import { transformMasterToViewModel } from "../lib/transform-master";
import {
  accountMasterSchema,
  simpleResultSchema,
} from "../model/mypage-schema";

export type DuplicateCheckType = "id" | "email";
export type DuplicateCheckResult = "available" | "taken";

/** `GET /v3/mypage/account/master`. Sub ID는 403이라 호출하지 않음. */
export async function fetchMasterAccount() {
  const response = await serverApiV3.get("/mypage/account/master");
  return transformMasterToViewModel(accountMasterSchema.parse(response));
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
