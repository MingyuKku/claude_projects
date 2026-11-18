import { authApi, memberApi } from "@/shared/api";
import { AUTH_SERVICE_ID, SERVICE_INDEX } from "@/shared/config";

import {
  findResponseSchema,
  lookupResponseSchema,
  verifyLoginIdResponseSchema,
  verifyPasswordResponseSchema,
} from "../model/schemas";

// 인증 채널 둘이 백엔드 둘에 나뉨. 이메일은 회원 백엔드(`/find/*`),
// 휴대폰은 통합 인증 서버(카카오톡, `/lookup` 후 `/verification/*`)로 감.

async function postMember(path: string, body: Record<string, unknown>) {
  const response = await memberApi.post<unknown>(path, {
    ...body,
    serviceIdx: SERVICE_INDEX,
  });
  return findResponseSchema.parse(response);
}

export function idEmailSend(name: string, email: string) {
  return postMember("/find/id/email", { name, email });
}

export function idEmailVerify(name: string, email: string, authNumber: string) {
  return postMember("/find/id/email/auth", { name, email, authNumber });
}

export function pwEmailSend(id: string, name: string, email: string) {
  return postMember("/find/pw/email", { id, name, email });
}

// serviceId는 호출부가 넘기지 못하도록 여기서만 지정함. UI가 보내는 값을 고정할 뿐
// 서비스 간 격리는 인증 서버가 맡음.
async function postLookup(
  name: string,
  phoneNumber: string,
  loginId: string | null,
) {
  const response = await authApi.post<unknown>("/lookup", {
    serviceId: AUTH_SERVICE_ID,
    name,
    phoneNumber,
    email: null,
    loginId,
  });
  return lookupResponseSchema.parse(response);
}

export function idKakaoSend(name: string, phoneNumber: string) {
  return postLookup(name, phoneNumber, null);
}

/** 비밀번호 찾기는 가입된 로그인 아이디가 필요함. */
export function pwKakaoSend(
  loginId: string,
  name: string,
  phoneNumber: string,
) {
  return postLookup(name, phoneNumber, loginId);
}

/** @param verificationId `/lookup` 응답의 `data.id` */
export async function idKakaoVerify(verificationId: number, code: string) {
  const response = await authApi.post<unknown>("/verification/loginId", {
    id: verificationId,
    code,
  });
  return verifyLoginIdResponseSchema.parse(response);
}

/** @param verificationId `/lookup` 응답의 `data.id` */
export async function pwKakaoVerify(verificationId: number, code: string) {
  const response = await authApi.post<unknown>("/verification/password", {
    id: verificationId,
    code,
  });
  return verifyPasswordResponseSchema.parse(response);
}
