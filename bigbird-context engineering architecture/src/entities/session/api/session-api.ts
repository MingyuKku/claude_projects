import useSWR from "swr";
import useSWRMutation from "swr/mutation";

import { ApiError, serverApi } from "@/shared/api";
import { ENV } from "@/shared/config";

import { clearLoginCredential } from "../lib/login-handoff";
import { transformSessionToViewModel } from "../lib/transform-session";
import { formLoginResultSchema, sessionSchema } from "../model/schema";

import type { FormLoginResult, SessionViewModel } from "../model/schema";

// 다른 레이아웃(예: 홈 → 고객센터)으로 넘어갈 때 셸을 바로 그리기 위한 직전 확인 결과.
// 본문은 새 경로의 확인이 끝난 뒤 그리므로 권한 판단에는 쓰지 않음. 새로고침, 로그인·로그아웃,
// 세션 확인 실패·거부 때 비워서 다른 사용자의 정보가 셸에 남지 않게 함.
let lastAllowedSession: SessionViewModel | undefined;

export function getLastAllowedSession() {
  return lastAllowedSession;
}

async function fetchSession(pathname: string) {
  try {
    const response = await serverApi.get("/sec", {
      headers: { "X-Path": pathname },
    });
    const session = transformSessionToViewModel(sessionSchema.parse(response));
    lastAllowedSession = session.isAllowed ? session : undefined;
    return session;
  } catch (error) {
    lastAllowedSession = undefined;
    throw error;
  }
}

/**
 * `GET /sec`는 마운트할 때마다 요청하고 캐시로 응답하지 않음. 권한은 서버에서
 * 바뀔 수 있어, 오래된 응답은 접근 권한을 잃은 사용자를 화면에 남겨 둠.
 * 서버가 `X-Path`별로 권한을 판단하므로 경로가 키에 들어감.
 *
 * 경로가 바뀌어 다시 확인하는 동안에는 직전 경로의 결과를 유지함(keepPreviousData).
 * 그래야 같은 레이아웃 안에서 이동할 때 셸이 다시 마운트되지 않음. 새 경로의 결과가
 * 거부·오류면 AuthGuard가 그때 로그인으로 보냄.
 */
export function useSession(pathname: string) {
  const { data, error, isLoading, mutate } = useSWR(
    ["session", pathname],
    () => fetchSession(pathname),
    {
      revalidateOnMount: true,
      revalidateIfStale: true,
      dedupingInterval: 0,
      shouldRetryOnError: false,
      keepPreviousData: true,
    },
  );
  return {
    session: data,
    isLoading,
    isError: Boolean(error),
    error,
    mutate,
  };
}

/**
 * 빅버드 백엔드는 이 요청에서 multipart/form-data만 받으며 JSON은 400을 돌려줌.
 */
export async function formLogin(
  username: string,
  password: string,
): Promise<FormLoginResult> {
  lastAllowedSession = undefined;
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

/** 기존 로그아웃은 JSON 대신 쿠키 만료와 302를 반환하므로 외부 Location을 따라가지 않는다. */
export async function logout(): Promise<void> {
  const response = await fetch(`${ENV.apiServerUrl}/logout`, {
    method: "GET",
    credentials: "include",
    redirect: "manual",
  });
  // 브라우저는 수동 리다이렉트 응답의 상태·본문을 감추고 이 타입만 노출한다.
  if (response.type !== "opaqueredirect") {
    throw new ApiError(response.status, undefined);
  }
  clearLoginCredential();
  lastAllowedSession = undefined;
}

export function useLogout() {
  const { trigger, isMutating } = useSWRMutation(["logout"], logout);
  return { trigger, isMutating };
}
