import useSWRMutation from "swr/mutation";

import {
  serverApi,
  serverApiV3,
  revokeFirebaseToken,
  signOutFirebase,
} from "@/shared/api";

import { clearLoginCredential } from "../lib/login-handoff";
import { transformSessionToViewModel } from "../lib/transform-session";
import {
  formLoginResultSchema,
  logoutResponseSchema,
  sessionSchema,
} from "../model/schema";

import type { FormLoginResult, SessionViewModel } from "../model/schema";

/**
 * `GET /v3/sec`로 `X-Path` 경로의 진입 여부와 세션을 물음. 권한은 서버에서 바뀔 수 있어
 * 데이터 캐시(SWR)에 두지 않고, 라우터가 화면을 옮길 때마다 부름(`app/router`의 세션 middleware).
 * 로그인 안 됨은 401, 경로 권한 없음은 403으로 거절됨.
 */
export async function fetchSession(
  pathname: string,
  signal?: AbortSignal,
): Promise<SessionViewModel> {
  const response = await serverApiV3.get("/sec", {
    headers: { "X-Path": pathname },
    signal,
  });
  return transformSessionToViewModel(sessionSchema.parse(response));
}

/**
 * 빅버드 백엔드는 이 요청에서 multipart/form-data만 받으며 JSON은 400을 돌려줌.
 */
export async function formLogin(
  username: string,
  password: string,
): Promise<FormLoginResult> {
  await signOutFirebase();
  const body = new FormData();
  body.append("username", username);
  body.append("password", password);
  const response = await serverApi.post("/login", body);
  return formLoginResultSchema.parse(response);
}

interface FormLoginArgs {
  username: string;
  password: string;
}

export function useFormLogin() {
  const { trigger, isMutating } = useSWRMutation(
    ["login"],
    (_key, { arg }: { arg: FormLoginArgs }) =>
      formLogin(arg.username, arg.password),
  );
  return { trigger, isMutating };
}

/**
 * `POST /v3/auth/logout`(2026-11-04 Stage). 세션을 끝내고 쿠키를 지운 뒤 `200 { result: true }`를 줌(세션이 없어도 200, 리다이렉트 없음).
 * V2 `/logout`은 설정된 주소로 리다이렉트하므로 쓰지 않고, 화면 이동은 호출하는 쪽이 함.
 */
export async function logout(): Promise<void> {
  // 세션이 살아 있을 때 이 기기의 채팅방 잠금을 먼저 풂. 실패해도 로그아웃은 이어 감.
  await revokeFirebaseToken();
  const response = await serverApiV3.post("/auth/logout");
  logoutResponseSchema.parse(response);
  clearLoginCredential();
  await signOutFirebase();
}

export function useLogout() {
  const { trigger, isMutating } = useSWRMutation(["logout"], logout);
  return { trigger, isMutating };
}
