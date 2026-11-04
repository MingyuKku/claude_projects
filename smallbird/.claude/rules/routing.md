---
paths:
  - "src/app/**/*.{ts,tsx}"
  - "src/pages/**/*.tsx"
  - "src/shared/config/**/*.ts"
---

# 라우팅 (React Router · FSD)

React Router는 **data mode**(`createBrowserRouter` + `RouterProvider`)로 `app` 레이어에서만 구성합니다. framework mode는 `routes/` 파일 규약과 loader 중심 구조를 강제해 FSD의 `pages`/슬라이스 경계와 충돌하므로 쓰지 않습니다. 버전별 API는 `react-router` skill과 `node_modules/react-router/docs/`를 기준으로 합니다.

## 구조

- `src/app/router/routes.tsx`: 라우트 **선언만** 둡니다. 화면은 `lazy: () => import('@/pages/...')`로 가져오므로 페이지별로 번들이 나뉩니다. 페이지는 항상 Public API(`index.ts`)로 임포트합니다.
- `src/pages/{name}`: 라우트 하나가 보여줄 화면입니다. 다른 페이지를 임포트하지 않습니다(린트가 막습니다). 공유가 필요하면 `widgets`/`features`로 내립니다.
- `src/app/layouts`, `src/app/providers`: 루트 레이아웃, 에러 바운더리, SWR 같은 전역 설정.
- **경로 상수는 `src/shared/config/routes.ts`의 `ROUTES`에 둡니다.** `features`/`widgets`가 링크를 만들 때 `app`을 임포트할 수 없기 때문입니다. 경로 문자열을 코드에 직접 쓰지 않습니다.

## 데이터

서버 데이터는 route `loader`/`action`이 아니라 각 슬라이스의 SWR 훅이 가져옵니다. 데이터의 소유자를 `entities`/`features` 한 곳으로 두고 캐시를 SWR 하나로 통일하기 위해서입니다. `loader`는 리다이렉트나 **화면 진입 여부를 정하는 값(세션)을 화면에 넘기는 용도**에만 씁니다. URL 상태(페이지, 검색어, 탭)는 `useSearchParams`입니다.

## 인증·권한 가드

- 화면 진입 확인(`GET /v3/sec` + `X-Path`)은 레이아웃 라우트의 **middleware**(`src/app/router/session-middleware.ts`)가 화면을 그리기 전에 합니다. 로그인 안 됨(401)은 `throw redirect(ROUTES.login)`, 권한 없음(403·`result: false`)은 지금 화면에 머물거나(첫 진입이면 홈) 토스트로 알리고, 그 밖의 실패는 throw해 라우트 에러 화면으로 보냅니다. 컴포넌트에서 렌더 후 `<Navigate>`로 돌려보내는 가드는 쓰지 않습니다.
- `loader`가 아니라 middleware인 이유: 레이아웃 `loader`는 자기 경로가 바뀔 때만 다시 실행되어 같은 레이아웃 안의 하위 이동에서 새 경로를 확인하지 못합니다. 클라이언트 middleware는 모든 이동마다 실행됩니다.
- 진입 확인 결과는 데이터 캐시(SWR)에 두지 않습니다. 권한은 서버에서 바뀌고, 캐시된 거부 결과가 다음 진입에 읽히기 때문입니다. 같은 라우트 패턴 안의 이동(탭·필터·문의 선택)만 직전 허용 결과를 재사용합니다.
- 확인된 세션은 레이아웃 `loader`가 넘기고 레이아웃이 `<Outlet context>`로 화면에 내립니다. 화면은 `useOutletContext<SessionViewModel>()`로 받고 세션을 다시 요청하지 않습니다.
- 로그인이 선택인 화면(홈 등)은 `loader`가 확인을 기다리지 않고 Promise로 넘겨 화면을 먼저 그리고, 셸만 결과에 따라 바꿉니다.
- 새 보호 화면은 `routes.tsx`의 `requireSessionRoute`로 묶습니다.

## 에러·404

루트 라우트의 `ErrorBoundary`가 라우트 에러를 처리하고, 알 수 없는 경로는 `path: '*'` 라우트가 `not-found` 페이지로 보냅니다. 독립적으로 실패할 수 있는 위젯에는 지역 바운더리를 따로 둡니다(`error-handling.md`).

## 테스트

`routes`를 `createMemoryRouter(routes, { initialEntries })`에 넣어 경로별 렌더링을 검증합니다 (`src/app/router/routes.test.tsx` 참고).
