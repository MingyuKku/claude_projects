# 로그인 (폼 · 소셜 · SNS 연동)

## 목적

광고주(기업 회원)가 아이디/비밀번호 또는 소셜(카카오·네이버·애플·구글)로 로그인한다. 인플루언서 로그인은 범위 밖(PRD: 광고주 전용).

1. 폼 로그인 성공: 권한이 MASTER/ADMIN이면 `/main`(SPA 이동), 그 외(SUB 등)는 구 Vue 앱의 `/account`(전체 페이지 로드).
2. 폼 로그인 실패: 사유별 문구, 계정 잠금 팝업, 또는 비밀번호 만료 화면(`/expired`).
3. 소셜 성공(`C01`): `/main`.
4. 가입된 적 없는 SNS 계정(`C02`): `/sns-link`에서 "가입하기"(`/join`) 또는 "기존 계정에 로그인해 연동".

PRD 5.2의 페이스북 로그인은 구현이 없다. 추가 여부는 미정.

## URL 계약

- 로그인 `/login`, 로그아웃 `/logout`(같은 `LoginPage`, 세션 파기 로직 없음), SNS 연동 `/sns-link`, 메인 `/main`(`AuthGuard`).
- `/login`·`/logout`은 공개이며 로그인된 사용자도 막지 않는다(리다이렉트 없음). `/main`만 `AuthGuard`로 보호된다.
- **OAuth 콜백 경로 4개는 제공자 콘솔에 등록된 값이다.** `/auth/kakao`, `/auth/naver`, `/auth/google`, `/auth/apple`. 이름을 바꾸면 콘솔, `VITE_OAUTH_REDIRECT_URL`, `VITE_APPLE_REDIRECT_URL`(서버 측)도 같이 바꿔야 한다. 구글·애플도 v2의 `/client/auth/*`에서 `/auth/*`로 옮겨 네 경로를 통일했다(제공자 콘솔 변경 필요). 카카오는 SDK가 콜백으로 결과를 주므로 성공 시 `LoginPage`가 `/auth/kakao`로 직접 이동한다.
- 로그인 화면 하단 링크: `/find?service=client&type=id|pw`, `/join?service=client`, `/terms?type=privacy|service`.
- 로그인 화면 "되돌아가기"는 `navigate(-1)`, SNS 연동 화면은 `/login`로 이동.

## 제약

- **`POST /login`은 multipart/form-data만 받는다(JSON이면 400).** 필드명 `username`, `password`.
- 클라이언트 입력 검증은 빈 값뿐이며 서버 호출 전에 막는다.
- 세션은 쿠키 기반이라 토큰을 저장하지 않는다. 백엔드 CORS 허용 목록에 이 앱 origin이 없어 dev proxy/운영 리버스 프록시를 경유한다.
- `/sec` 세션 조회는 `X-Path` 헤더로 경로 인가를 묻고 **캐시된 답을 쓰지 않는다**(권한이 서버에서 바뀔 수 있음). 그래서 `AuthGuard`가 `children(session)`으로 세션을 내려 주고, 화면에서 `useSession`을 또 부르면 요청이 중복된다. 현재 `AuthGuard` 소비처는 `MainPage` 하나다. `result`는 인증이 아니라 해당 경로의 인가 결과다.
- `AuthGuard`는 401과 경로 거부를 동일 취급하며 `/introduction`으로 보낸다(`/logout`·로그인 화면 아님, 원본 가드와 동일).
- `/account`는 아직 구 Vue 앱에 있어 SPA 이동으로는 서버를 거치지 않아 경로 기반 분기를 못 탄다. 이관되면 `landingDestination`의 `legacy`를 `internal`로 바꾸면 호출부는 고치지 않아도 된다.
- 비밀번호 만료 핸드오프: 자격 증명은 라우터 state가 아니라 모듈 변수에 둔다(state는 history 복원 파일로 디스크에 남음). 새로고침하면 사라지고, `ExpiredPasswordForm`이 액션 시점에 `/login`로 돌려보낸다. 비밀번호 변경/연장 성공 경로에서만 지우며 뒤로가기 등 그 외 이탈에서는 지우지 않는다.

### 폼 로그인 에러 매핑

문구 표는 `lib/login-error.ts`와 테스트가 기준이다. 코드에서 읽히지 않는 규칙만 적는다.

- **서버는 401에는 camelCase reason, 403에는 SCREAMING_CASE reason을 쓴다.** `ACCOUNT_LOCKED`는 상태 코드와 무관하게 오므로 status 분기보다 먼저 검사한다.
- `accountRejected`(승인 거절/대기)도 `ACCOUNT_LOCKED`와 같은 "검토중" 팝업으로 처리한다(구 앱 동작 유지). 403 `ACCOUNT_EXPIRED`는 문구 없이 자격 증명 핸드오프 후 `/expired`로 간다.
- `accountDestroyed` 문구는 정보통신망법 제29조 휴면 만료 **법적 고지라 줄이지 않는다.**
- `accountLocked`/`accountDestroyed`에 `time`이 없으면 일반 불일치 문구로 떨어진다. 에러 본문이 JSON이 아니어도 reason 없음으로 본다(런타임 검증 없음).
- 메시지가 있으면 두 입력 모두 에러 상태(서버가 어느 필드가 틀렸는지 알려주지 않음). 단 "아이디를 입력해 주세요."이면 비밀번호는, "비밀번호를 입력해 주세요."이면 아이디는 정상 상태.

### 소셜 로그인

- SDK는 번들에 포함하지 않고 클릭/콜백 시점에 런타임 로드한다(첫 화면 로딩 비용 방지).
- 서버 응답 본문은 `{ data: { code, tokenResponse? } }`로 한 겹 더 감싸져 있다.
- 코드 의미: `C01` 성공, `C02` 가입되지 않은 SNS 계정(연동 필요), 그 외 실패.
- 성공 시 `Authorization` 쿠키를 `document.cookie`로 심고(`Path=/; SameSite=Lax`, **`Secure` 의도적 생략**: http dev 서버에서 브라우저가 무시) `GET /jwt/login`으로 세션을 수립한다. 값은 `tokenType + accessToken`이며, 구분 공백은 서버가 `tokenType`에 포함해 준다고 가정한다. 애플은 `"Bearer " + decodeURIComponent(idtoken)`.
- 애플: 서버가 form_post를 받아 쿼리(`status, code, idtoken, uid, email`)로 되돌려 보내므로 SDK·서버 재호출이 없다. 구 앱의 숨은 `<input id="appleid-signin">` 클릭 방식은 SDK 공개 API 호출로 바꿨다.
- 구글: 쿼리 `code`가 없으면 실패. 카카오 `Auth.login`의 `fail`은 무시(아무 표시 없음).
- 콜백 화면은 SWR 키에 `useId()`를 넣어 마운트마다 새 키를 쓴다. 이전 결과 재생을 막고, StrictMode 이중 마운트에서 OAuth 코드(일회용)가 두 번 쓰여 실패하는 것을 막는다.
- 시작 단계 실패(스크립트 로드 실패, SDK 없음)만 폼 아래 에러로 표시한다. **콜백 단계의 모든 실패(예외, 스키마 불일치 포함)는 문구 없이 `/login`로 돌아간다.**

### SNS 연동 (`/sns-link`)

- 입력은 router state의 `snsData`(`{platform, uid?, email?}`)를 Zod로 검증하며, 실패하면 없는 것으로 보고 화면은 그대로 뜬다. 같은 형태가 `/join`의 `tokenData`로 흐른다.
- 연동 탭 제출 순서와 문구:
  1. 빈 값: "아이디/비밀번호를 모두 입력해 주세요"
  2. 로그인 실패(`result:false`): "입력하신 아이디와 비밀번호가 등록된 정보와 일치하지 않습니다"
  3. `snsData` 없음: "SNS 연동 정보가 없습니다"
  4. `userIdx` 없음/0, 또는 연동 응답 `code !== 200`: "연동되지 않았습니다. 관리자에게 문의해주세요"
  5. 성공: `/main`
- 예외: `ApiError`면 "로그인 중 오류가 발생했습니다", 그 외는 4번 문구.
- 이 로그인은 폼 로그인의 에러 매핑을 쓰지 않는다. 잠금/만료/탈퇴 안내가 없고, **`/expired`·권한별 분기 없이 무조건 `/main`으로 간다**(v2 동일).
- "아이디 찾기"/"비밀번호 찾기"는 `/find`로 이동하며 `?service=client&type=...`이 **붙지 않는다**(로그인 화면 링크와 다름).

## 동작 결정

- **브랜드**: 한 배포가 빅버드와 펫플레이 두 도메인을 서비스하며 로고·문구·색·문의 버튼만 다르다. 백엔드·OAuth·리다이렉트는 공유한다. `hostname.includes("petplay")`이면 펫플레이, 아니면 `?brand=petplay`로 강제할 수 있다(QA용 local/stage). 펫플레이는 주 색상 `#f79000`을 `--brand` CSS 변수로 덮고 문의 버튼을 숨긴다.
- 폼 로그인 이동은 `landingDestination`이 판단한다. `MASTER`/`ADMIN`만 비교하고 `authority`는 서버 값을 그대로 쓴다.
- 소셜 로그인 성공은 권한과 무관하게 `/main`(폼 로그인만 `/account` 분기, v2 동일).
- 계정 잠금 팝업은 `LoginForm`이 직접 열지 않고 부모(`LoginPage`)가 상태를 소유한다(`onAccountLocked(userId)`).
- 문의 패널이 열리면 로고/폼/SNS 행은 모두 숨긴다. 모바일은 더보기(`...`) 메뉴에 약관 링크를 담는다.
- 로그인 이동 후 뒤로가기로 로그인 화면에 돌아올 수 있다(막지 않음).

## 엣지 케이스

- `/sns-link`를 URL로 직접 열면 `snsData`가 없다. "가입하기"는 `tokenData: null`이라 **소셜 가입이 아닌 일반 가입으로 조용히 바뀌고**, 연동은 로그인 성공 후 "SNS 연동 정보가 없습니다"로 끝난다.
- `loadNaverScript`/`loadKakaoScript`는 호출마다 `<script>`를 추가한다(구글·애플만 id로 중복 방지). 한 로드 안에서 여러 번 누르면 중복되며 v2와 동일하다.
- 콜백 `Navigate`는 `replace`가 없어 콜백 URL이 history에 남고, 뒤로가기 시 콜백이 새 키로 다시 실행될 수 있다.
- 문의 버튼의 `icon-questions` CSS 클래스는 v2 원본에도 정의가 없어 **아이콘이 그려지지 않는다**(`aria-label="문의"`인 빈 버튼). `QuestionPanel`은 원본의 스타일 미정의를 대체한 임시 구현이다(카카오 상담, `tel:1661-6213`, 운영시간).
- 로그인 화면 진입 시 이미 로그인됐는지는 감지하지 않는다.

## v2 대비

- 로그인 경로 `/client`에서 `/login`으로 변경. `/client`는 리다이렉트도 두지 않고 제거했다(이전 링크·북마크는 404).
- SNS 연동 경로 `/client/detail`에서 `/sns-link`로 변경. 제공자 콘솔에 등록된 경로가 아니라 이름 변경이 안전했다. 이전 URL의 호환 리다이렉트는 **없다**.
- SNS 신원(router state)을 Zod로 검증해 잘못된 state를 무시한다(v2는 타입 단언만).
- 콜백 1회 실행을 `useEffect([])` + eslint-disable에서 `useSWRImmutable` + `useId` 키, 선언적 `<Navigate>`로 교체(이중 마운트 안전, lint 우회 제거).
- 애플 SDK를 `index.html`에 박아 전 화면에서 받던 것을 클릭 시점 로드로 개선했다. 4종 SDK 모두 타입 미제공이라 쓰는 표면만 직접 선언한다.
- axios에서 자체 fetch 클라이언트로 교체하고 `/login`은 FormData를 유지한다.
- 세션 가드(`AuthGuard`)가 서버 권한을 단일 출처로 쓰도록 새로 추가했다.
- `landingDestination`·`mapLoginError` 규칙, `onAccountLocked` prop 이름, 자격 증명 핸드오프(모듈 변수), 런타임 SDK 로드는 v2와 동일하다.

## 범위 밖 · 미해결

범위 밖: 회원가입(`features/join`), 아이디/비밀번호 찾기(`features/find`), 비밀번호 만료 변경 폼(`features/expired-password`), 약관, 로그아웃 처리, 세션 만료 후 자동 재로그인, 인플루언서 로그인, 메인 화면 내용.

미정 / 확인 필요:

- 페이스북 로그인 추가 여부.
- 로그인 후 대시보드의 경로·구성(PRD 8장). 현재 `/main`은 세션 요약 임시 화면이며 `/account` 이관 시점도 미정.
- 소셜 로그인 성공 시 권한별 분기 적용 여부. 소셜 로그인한 SUB 계정이 `/main`에서 `AuthGuard`로 막히는지는 **미확인**.
- 문의 버튼 아이콘, `QuestionPanel` 디자인.
- 콜백 실패 사유 표시, 콜백 `Navigate`의 `replace` 여부, 로그인된 사용자가 `/login`에 올 때의 동작.
- `/client/detail` 호환 리다이렉트 필요 여부.
- 도메인 키워드가 `petplay`라는 가정은 실제 운영 도메인과 대조 필요.
- i18n: PRD상 모든 문구가 다국어 대상이나 한국어 상수 하드코딩 상태. `i18next` 적용 시 이관.
- 환경 값(`VITE_OAUTH_REDIRECT_URL`, 각 클라이언트 ID/키, `VITE_APPLE_REDIRECT_URL`)의 운영/스테이징 값은 `.env.*`에 비어 있다. 출처는 인프라 담당 확인 필요.
