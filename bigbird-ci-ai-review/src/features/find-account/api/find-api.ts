import { authApi, memberApi } from "@/shared/api";
import { AUTH_SERVICE_ID, SERVICE_INDEX } from "@/shared/config";

import {
  findResponseSchema,
  lookupResponseSchema,
  verifyLoginIdResponseSchema,
  verifyPasswordResponseSchema,
} from "../model/schemas";

// Two verification channels on two backends: email goes to the member backend
// (`/find/*`), phone goes to the unified auth server (Kakao Talk, `/lookup` then
// `/verification/*`).

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

// serviceId is set only here so callers cannot pass it. This pins what the UI
// sends; it does not isolate services, that depends on the auth server.
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

/** The password flow needs the registered login id. */
export function pwKakaoSend(
  loginId: string,
  name: string,
  phoneNumber: string,
) {
  return postLookup(name, phoneNumber, loginId);
}

/** @param verificationId `data.id` of the `/lookup` response */
export async function idKakaoVerify(verificationId: number, code: string) {
  const response = await authApi.post<unknown>("/verification/loginId", {
    id: verificationId,
    code,
  });
  return verifyLoginIdResponseSchema.parse(response);
}

/** @param verificationId `data.id` of the `/lookup` response */
export async function pwKakaoVerify(verificationId: number, code: string) {
  const response = await authApi.post<unknown>("/verification/password", {
    id: verificationId,
    code,
  });
  return verifyPasswordResponseSchema.parse(response);
}
