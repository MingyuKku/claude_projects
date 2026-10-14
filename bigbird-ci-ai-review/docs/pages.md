# 화면 목록 (pages)

> 현재 구현된 화면의 URL, 담당 슬라이스, 접근 조건, 백엔드 목록, 미해결 항목을 한곳에 모은 인벤토리입니다.
> 기능별 상세(화면 간 이동, 서버 계약, 에러 처리, 엣지 케이스, v2 대비 변경)는 `specs/<feature>.md`에, 슬라이스 구성과 Public API는 `src/`와 각 `index.ts`에 있습니다.
> 경로의 단일 출처는 `src/shared/config/routes.ts`의 `ROUTES`이고, 라우트 선언은 `src/app/router/routes.tsx`입니다. 이 문서의 표와 어긋나면 코드가 맞습니다.

## 1. 화면 한눈에 보기

개발 서버(`pnpm dev`) 기본 주소는 `http://localhost:5173`입니다.

### 사용자에게 보이는 화면

| URL                | 페이지 슬라이스 (`src/pages/…`) | 설명                                                       | 접근 조건                                                                                                                            | 스펙                                     |
| :----------------- | :------------------------------ | :--------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------- |
| `/`                | `home`                          | 임시 홈("bigbird" 제목만). 이번 이식 대상이 아님           | 없음                                                                                                                                 | —                                        |
| `/introduction`    | `introduction`                  | 공개 랜딩                                                  | 없음                                                                                                                                 | [introduction](../specs/introduction.md) |
| `/login`           | `login`                         | 로그인                                                     | 없음                                                                                                                                 | [login](../specs/login.md)               |
| `/logout`          | `login`                         | 로그인과 같은 화면(별칭). 로그아웃 전용 화면은 아직 없음   | 없음                                                                                                                                 | [login](../specs/login.md)               |
| `/find`            | `find`                          | 아이디/비밀번호 찾기. `?type=pw`면 비밀번호 탭으로 시작    | 없음                                                                                                                                 | [find-account](../specs/find-account.md) |
| `/find/email-sent` | `find-email-sent`               | 비밀번호 재설정 링크 발송 안내                             | 없음                                                                                                                                 | [find-account](../specs/find-account.md) |
| `/join`            | `join`                          | 회원가입 5단계 마법사                                      | 없음                                                                                                                                 | [join](../specs/join.md)                 |
| `/welcome`         | `welcome`                       | 가입 완료(승인 대기 안내)                                  | 없음                                                                                                                                 | [join](../specs/join.md)                 |
| `/changePw`        | `change-password`               | 찾기 흐름 뒤 새 비밀번호 설정                              | 화면은 열리지만, 저장은 찾기 흐름에서 발급된 일회용 세션이 있어야 성공                                                               | [password](../specs/password.md)         |
| `/expired`         | `expired`                       | 6개월 경과 비밀번호 변경                                   | 로그인 화면이 넘긴 자격 증명이 메모리에 있어야 동작함. 없어도 화면은 열리고, "변경하기"·"다음에 변경하기"를 누르면 `/login`으로 이동 | [password](../specs/password.md)         |
| `/sns-link`        | `sns-link`                      | 미가입 SNS 계정으로 들어왔을 때 가입하기/기존 계정 연동    | 소셜 로그인 뒤 라우터 state(`snsData`)가 있어야 정상 동작. URL 직접 진입 시 연동 정보 없음                                           | [login](../specs/login.md)               |
| `/terms`           | `terms`                         | 이용약관. `?type=privacy`면 개인정보처리방침               | 없음                                                                                                                                 | [terms](../specs/terms.md)               |
| `/main`            | `main`                          | 임시 메인(세션·권한 확인용). 대시보드는 디자인과 기획 대기 | 로그인 필요. 미인증이면 `/introduction`으로 이동                                                                                     | [password](../specs/password.md)         |

### 기술용 화면 (사용자가 직접 열 일이 거의 없음)

| URL             | 페이지 슬라이스   | 용도                                                                                                                   |
| :-------------- | :---------------- | :--------------------------------------------------------------------------------------------------------------------- |
| `/cert`         | `cert`            | 모바일 KMC 본인인증용 중간 화면(페이지 전체를 KMC로 제출). 현재 코드에서 이 주소로 이동하는 곳이 없어 진입 경로는 미정 |
| `/cert/success` | `cert-success`    | 데스크톱 KMC 팝업이 돌아오는 주소. 부모 창의 `cert_result`를 호출하고 닫힘                                             |
| `/auth/kakao`   | `social-callback` | 카카오 OAuth 콜백                                                                                                      |
| `/auth/naver`   | `social-callback` | 네이버 OAuth 콜백                                                                                                      |
| `/auth/google`  | `social-callback` | 구글 OAuth 콜백                                                                                                        |
| `/auth/apple`   | `social-callback` | 애플 OAuth 콜백                                                                                                        |
| `*`             | `not-found`       | 알 수 없는 경로                                                                                                        |

OAuth 콜백 4개, `/changePw`(백엔드가 만드는 재설정 링크), `/cert/success`(KMC 반환 주소)는 앱 밖의 설정과 연결된 경로입니다. 이 경로를 바꿀 때는 제공자 콘솔·백엔드·KMC 쪽도 함께 갱신해야 합니다.

## 2. 백엔드와 API

백엔드는 4개이며, 코드에는 접두사 경로(`VITE_API_*`)만 있습니다. 실제 주소로 넘기는 개발 프록시는 아직 설정되어 있지 않습니다(§4 참고).

| 클라이언트                 | 환경변수              | 용도                                           | 주요 호출                                                                                                                                                                                                                                                                              |
| :------------------------- | :-------------------- | :--------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `serverApi` (광고주 BE)    | `VITE_API_SERVER_URL` | 세션, 폼 로그인, 만료 비밀번호, SNS 연결       | `GET /sec`, `POST /login`(multipart), `PUT /login/expire`, `GET /login/delay-pw/{id}`, `GET /jwt/login`, `PUT /auth/{platform}/{userIdx}`                                                                                                                                              |
| `memberApi` (멤버 BE)      | `VITE_API_MEMBER_URL` | 회원가입, 이메일 찾기, 본인인증, 비밀번호 변경 | `POST /check/id/{n}`, `POST /check/email/{n}`, `POST /valid/pw`, `GET /cert/init/{slug}`, `GET /cert/decrypte/{n}`, `GET /campaign/category`, `POST /file/upload/*`, `POST /join/{n}`, `POST /find/id/email`, `POST /find/id/email/auth`, `POST /find/pw/email`, `PATCH /changePw/{n}` |
| `socialApi`                | `VITE_API_SOCIAL_URL` | 소셜 로그인 중계(4개 제공자 공용)              | `POST /api/v1/bigbird/login/client`, `POST /api/v1/bigbird/oauth/client/google`                                                                                                                                                                                                        |
| `authApi` (통합 인증 서버) | `VITE_API_AUTH_URL`   | 카카오톡 플러스친구 인증                       | `POST /lookup`, `POST /verification/loginId`, `POST /verification/password`                                                                                                                                                                                                            |

모든 요청은 쿠키 세션 기반이라 `credentials: "include"`로 나가고, 토큰은 저장하지 않습니다. 응답은 Zod로 검증한 뒤 사용합니다.

## 3. 공통 사항

- **반응형**: 모바일 우선(`w-80`)이며 `tablet:`(768px 이상)과 `desktop:`(1440px 이상) 브레이크포인트를 씁니다. 랜딩만 별도로 `introtab`(1240px)을 씁니다. 정의는 `src/app/styles/index.css`.
- **다크 모드 없음**: 라이트 테마만 지원합니다.
- **다국어**: 아직 적용 전입니다. `i18next`·`react-i18next` 의존성만 추가됐고 `src/`에서 쓰는 곳은 없으며, 문구는 컴포넌트에 한국어로 들어 있습니다(`docs/prd.md` 참고).
- **에러 처리**: 라우트 에러는 `src/app/providers/ErrorBoundary.tsx`가, 서버 에러는 각 폼이 해당 필드 근처에 문구로 보여줍니다.
- **페이지 제목**: 각 페이지가 React 19 `<title>`을 렌더링합니다. `cert`, `cert-success`, 소셜 콜백 페이지에는 없습니다.

## 4. 알려진 공백 (미해결)

| 항목                             | 상태                                                                                                                                                                           |
| :------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 개발 서버 프록시                 | `vite.config.ts`에 `server.proxy` 없음. 백엔드 주소를 받아 `VITE_PROXY_*`로 설정해야 로컬에서 API 호출이 동작함. 그 전에는 서버 통신이 필요 없는 화면만 `pnpm dev`로 확인 가능 |
| 소셜 로그인 키                   | `.env.example`의 `VITE_*_CLIENT_ID` 등이 비어 있음. 환경별로 채워야 함                                                                                                         |
| 모바일 본인인증(`/cert`)         | 이 주소로 이동하는 코드가 없고, 제출 후 결과가 가입 마법사로 돌아오는 방식도 불분명함(`specs/join.md` "범위 밖 · 미해결")                                                      |
| 랜딩 "시작하기"(`/main?login=1`) | `?login=1`을 읽는 코드가 없어, 미인증 방문자는 `/main`에서 다시 `/introduction`으로 돌아옴. 의도한 목적지 미정                                                                 |
| 랜딩 "이용 가이드" 링크          | `/clientguide`는 이식되지 않은 구 앱 경로                                                                                                                                      |
| 랜딩 문의 폼                     | 전송 기능 없음(안내 문구만 표시). v2도 동일                                                                                                                                    |
| `/account`                       | 구 앱 경로. 로그인 성공 뒤 MASTER·ADMIN이 아닌 계정이 이동하는 곳                                                                                                              |
| OG 미리보기                      | SPA 모드라 프리렌더가 없어, JS를 실행하지 않는 크롤러는 랜딩의 og 태그를 읽지 못함                                                                                             |
| i18n                             | 라이브러리는 `i18next`로 정해졌으나 아직 적용 전                                                                                                                               |
| 로그인 뒤 대시보드               | 경로와 구성 미정(`docs/prd.md`). 현재 `/main`은 임시                                                                                                                           |
