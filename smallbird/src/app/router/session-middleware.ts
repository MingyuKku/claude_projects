import { tryit } from "radash";
import { createContext, data, redirect, replace } from "react-router";

import { fetchSession } from "@/entities/session";
import { isApiError } from "@/shared/api";
import { ROUTES } from "@/shared/config";

import type { SessionViewModel } from "@/entities/session";
import type {
  LoaderFunctionArgs,
  Location,
  MiddlewareFunction,
  ShouldRevalidateFunction,
} from "react-router";

// 화면 진입 여부는 서버만 알고(`GET /v3/sec` + `X-Path`) 권한이 바뀔 수 있어, 이동할 때마다 묻고 캐시하지 않음.
// 권한 확인을 데이터 캐시(SWR)에서 빼야 앞 화면의 거부 결과가 다음 진입에 읽히지 않음.

const sessionContext = createContext<SessionViewModel>();

// 같은 화면(라우트 패턴) 안의 이동(문의 선택, 탭·필터·쪽 변경)은 권한이 같아 다시 묻지 않으려고
// 직전 화면에서 허용된 결과를 들고 있음. 다른 화면으로 옮기면 루트 middleware가 버림.
let lastAllowed: { pattern: string; session: SessionViewModel } | undefined;

// 지금 보고 있는 화면의 주소. 권한 없는 화면으로 옮기려 하면 이 화면에 머무름(RootLayout이 화면을 그릴 때마다 갱신).
let current: { pathname: string; href: string } | undefined;
// 권한이 없어 이동을 막았음을 화면(RootLayout)에 알려 토스트를 띄움. 문구는 렌더 중에 번역하므로 여기서는 표시만 남김.
let hasForbiddenNotice = false;

// Sub ID는 권한과 관계없이 들어갈 수 없는 화면. 서버도 403으로 막으며, 안내 없이 계정 설정으로 보냄(스펙 main.md).
const MASTER_ONLY_PATHS: readonly string[] = [ROUTES.mypageSubscribe];

/** 화면을 그린 뒤 지금 주소를 남김. 권한 없는 이동을 막을 때 돌아올 곳. */
export function rememberCurrentLocation({ pathname, search, hash }: Location) {
  current = { pathname, href: `${pathname}${search}${hash}` };
}

/** 권한이 없어 이동을 막았으면 true를 한 번만 돌려줌. */
export function takeForbiddenNotice() {
  const hasNotice = hasForbiddenNotice;
  hasForbiddenNotice = false;
  return hasNotice;
}

// 로그인했지만 그 경로 권한이 없을 때(403·`result: false`). 로그인으로 보내면 다시 로그인해도 같은 거절이 나므로
// 앱 안의 이동이면 지금 화면에 머물고, 첫 진입이면 홈으로 보낸 뒤 토스트로 알림. 돌아온 화면은 세션을 새로 받아
// LNB 권한 표시도 갱신됨(다른 화면으로 옮기며 직전 결과를 버렸으므로).
function forbidden(pathname: string): never {
  if (MASTER_ONLY_PATHS.includes(pathname))
    throw redirect(ROUTES.mypageAccount);
  // 홈마저 막히면 더 보낼 곳이 없으므로 에러 화면으로 끝냄. 홈이 보호 화면이 되어도 되돌려 보내기가 반복되지 않게 함.
  if (pathname === ROUTES.main) throw data(null, { status: 403 });
  hasForbiddenNotice = true;
  // 돌아갈 화면도 같은 이유로 막히면(그 화면 권한까지 회수됨) 되돌아오기를 반복하므로 홈으로 보냄.
  const backHref =
    current && current.pathname !== pathname ? current.href : ROUTES.main;
  throw replace(backHref);
}

/** 모듈 상태를 비움. 테스트가 앞 테스트의 사용자·화면을 다음 테스트에서 재사용하지 않게 씀. */
export function resetSessionMiddleware() {
  lastAllowed = undefined;
  current = undefined;
  hasForbiddenNotice = false;
}

/** 루트 middleware. 다른 화면으로 옮기면 직전 결과를 버려 같은 화면 안의 이동에서만 재사용되게 함. */
export const forgetOtherPageSession: MiddlewareFunction = ({ pattern }) => {
  if (lastAllowed?.pattern !== pattern) lastAllowed = undefined;
};

/** 로그인이 필요한 화면의 middleware. 로그인 안 됨은 로그인으로, 권한 없음은 막고, 허용되면 세션을 loader에 넘김. */
export const requireSession: MiddlewareFunction = async ({
  request,
  url,
  pattern,
  context,
}) => {
  if (lastAllowed?.pattern === pattern) {
    context.set(sessionContext, lastAllowed.session);
    return;
  }

  const [error, session] = await tryit(fetchSession)(
    url.pathname,
    request.signal,
  );
  if (error) {
    if (isApiError(error) && error.status === 401) {
      throw redirect(ROUTES.login);
    }
    if (isApiError(error) && error.status === 403) forbidden(url.pathname);
    // 서버 오류·네트워크 실패는 로그아웃으로 오해하지 않게 에러 화면(다시 시도)으로 보냄.
    throw error;
  }
  if (!session.isAllowed) forbidden(url.pathname);
  if (session.authority === "SUB" && MASTER_ONLY_PATHS.includes(url.pathname)) {
    throw redirect(ROUTES.mypageAccount);
  }

  // 중간에 다른 곳으로 옮겨 취소된 이동의 결과는 남기지 않음.
  if (!request.signal.aborted) lastAllowed = { pattern, session };
  context.set(sessionContext, session);
};

/** `requireSession`이 확인한 세션을 화면에 넘김. */
export function sessionLoader({ context }: LoaderFunctionArgs) {
  return context.get(sessionContext);
}

/**
 * 로그인이 선택인 화면(홈 등)의 loader. 확인을 기다리지 않고 화면을 먼저 그리도록 응답 Promise를 그대로 넘김.
 * 홈 셸은 경로와 관계없이 `/`의 결과로 로그인 상태만 정함.
 */
export function optionalSessionLoader({ request }: LoaderFunctionArgs) {
  const session = fetchSession(ROUTES.main, request.signal);
  // 받는 화면이 먼저 사라져도 거절이 처리되지 않은 오류로 남지 않게 함. 401(비로그인)은 정상 응답.
  session.catch(() => undefined);
  return { session };
}

// 레이아웃 loader는 기본적으로 자기 경로가 바뀔 때만 다시 실행되므로, 하위 화면을 옮길 때도
// middleware가 새로 확인한 세션을 받도록 매번 다시 실행함.
export const revalidateOnEveryNavigation: ShouldRevalidateFunction = () => true;
