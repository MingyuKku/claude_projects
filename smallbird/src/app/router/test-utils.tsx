import { render } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { SWRConfig } from "swr";

import { serverApiV3 } from "@/shared/api";

import { routes } from "./routes";
import { resetSessionMiddleware } from "./session-middleware";

/**
 * 실제 라우트로 화면을 그림. 경로 배열을 넘기면 그 순서로 방문한 기록을 쌓고 마지막 경로에서 시작함
 * (뒤로가기 동작을 앞 화면을 직접 거치지 않고 검증할 때 씀).
 */
export async function renderRoute(path: string | string[]) {
  const initialEntries = Array.isArray(path) ? path : [path];
  const router = createMemoryRouter(routes, {
    initialEntries,
    initialIndex: initialEntries.length - 1,
  });
  // CI의 첫 모듈 로딩 시간을 요소 조회 제한 시간에 포함하지 않는다.
  // 실제 라우트의 lazy를 실행하고 초기화가 끝난 뒤 화면 동작을 검증한다.
  if (!router.state.initialized) {
    await new Promise<void>((resolve) => {
      const unsubscribe = router.subscribe((state) => {
        if (state.initialized) {
          unsubscribe();
          resolve();
        }
      });
    });
  }
  render(
    <SWRConfig value={{ provider: () => new Map(), shouldRetryOnError: false }}>
      <RouterProvider router={router} />
    </SWRConfig>,
  );
  return router;
}

// 세션(`GET /v3/sec`)과 그 밖의 V3 API가 같은 `serverApiV3.get`을 쓰므로, 테스트는 경로별로 나눠 돌려줌.
type V3Handler = (path: string, ...rest: unknown[]) => Promise<unknown>;
type SessionOutcome =
  | { kind: "value"; value: unknown }
  | { kind: "error"; error: unknown }
  | { kind: "pending"; promise: Promise<unknown> };

let sessionOutcome: SessionOutcome = { kind: "value", value: {} };
let sessionQueue: SessionOutcome[] = [];
let otherHandler: V3Handler = () => Promise.reject(new Error("unmocked"));

function respond(outcome: SessionOutcome) {
  if (outcome.kind === "value") return Promise.resolve(outcome.value);
  if (outcome.kind === "error") return Promise.reject(outcome.error);
  return outcome.promise;
}

function installV3Get() {
  vi.mocked(serverApiV3.get)
    .mockReset()
    .mockImplementation(((path: string, ...rest: unknown[]) =>
      path === "/sec"
        ? respond(sessionQueue.shift() ?? sessionOutcome)
        : otherHandler(path, ...rest)) as never);
}

/** 테스트 시작 때 호출: 세션 응답을 정하고 `serverApiV3.get`을 경로별로 나눠 돌려줌. */
export function resetSession(session: unknown) {
  // 세션 middleware가 직전 결과와 지금 화면을 기억하므로 앞 테스트의 상태가 남지 않게 비움.
  resetSessionMiddleware();
  sessionOutcome = { kind: "value", value: session };
  sessionQueue = [];
  otherHandler = () => Promise.reject(new Error("unmocked"));
  installV3Get();
}

export function mockSession(session: unknown) {
  sessionOutcome = { kind: "value", value: session };
  sessionQueue = [];
}

export function mockSessionError(error: unknown) {
  sessionOutcome = { kind: "error", error };
  sessionQueue = [];
}

/** 다음 한 번의 세션 조회만 실패시킴. */
export function mockSessionErrorOnce(error: unknown) {
  sessionQueue.push({ kind: "error", error });
}

/** 세션 조회를 끝나지 않게 두고, 돌려주는 함수로 나중에 마침. */
export function mockSessionPending() {
  let resolve: (value: unknown) => void = () => {};
  sessionOutcome = {
    kind: "pending",
    promise: new Promise((r) => {
      resolve = r;
    }),
  };
  sessionQueue = [];
  return resolve;
}

/** 세션 밖의 V3 GET 응답을 경로별로 정함. */
export function mockV3Get(handler: V3Handler) {
  otherHandler = handler;
}

export function mockV3GetValue(value: unknown) {
  otherHandler = () => Promise.resolve(value);
}

export function mockV3GetError(error: unknown) {
  otherHandler = () => Promise.reject(error);
}
