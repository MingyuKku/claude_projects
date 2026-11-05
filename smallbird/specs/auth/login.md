# 로그인 (폼 · 소셜 · SNS 연동)

## 목적

광고주(기업 회원)가 아이디/비밀번호 또는 소셜(카카오·네이버·애플·구글)로 로그인한다. 인플루언서 로그인은 범위 밖(PRD: 광고주 전용).

1. 폼 로그인 성공: 권한과 관계없이 `/`(SPA 이동). v2는 SUB를 `/account`로 보냈지만 2026-10-22 사용자 결정으로 SUB도 홈으로 통일(v2 정책의 근거는 확인되지 않음).
2. 폼 로그인 실패: 사유별 문구, 계정 잠금 팝업, 또는 비밀번호 만료 화면(`/expired`).
3. 소셜 성공: `/`.
4. 가입된 적 없는 SNS 계정(`404 NEED_SIGNUP`): `/sns-link`에서 "가입하기"(`/join`) 또는 "기존 계정에 로그인해 연동".

페이스북 로그인은 **두지 않는다**(2026-10-29 사용자 결정: 프로젝트에서 페이스북 연동을 하지 않음. 2026-10-21의 "비활성 버튼" 결정을 대체). 소셜 로그인은 카카오·네이버·구글·애플 4개다.

## URL 계약

- 로그인 `/login`, SNS 연동 `/sns-link`, 공개 홈 `/`. 로그아웃 화면(경로)은 없다.
- 로그아웃은 헤더(와 회원 탈퇴 뒤)에서 `POST /v3/auth/logout`으로 세션을 종료한다([메인 스펙](../main.md)). v2의 `/logout` 주소는 세션을 끊지 않고 로그인 화면만 보여 줘 로그아웃된 것처럼 착각하게 하므로 v3에는 두지 않는다(사용자 결정 2026-11-04, 옛 링크는 404).
- `/login`은 공개이며 로그인된 사용자도 막지 않는다(리다이렉트 없음). `/`도 공개이며 세션 조회 결과로 헤더만 바뀐다.
- 고객센터 세 경로(`/customer-center/bigbird`, `/customer-center/bigbird/new`, `/customer-center/buyer`)는 라우트의 세션 middleware(서버 경로 권한 확인)로 보호한다. 공개 홈(`/`)에는 적용하지 않는다.
- **OAuth 리다이렉트 경로는 제공자 콘솔에 등록된 값이다.** 카카오·네이버·구글은 `/auth/kakao`, `/auth/naver`, `/auth/google`로 돌아오는 화면이 있고, 이름을 바꾸면 콘솔과 `VITE_OAUTH_REDIRECT_URL`도 같이 바꿔야 한다(카카오는 REST API 키에 환경별 리다이렉트 URI 등록). 애플은 팝업이라 **돌아오는 화면이 없고**(`/auth/apple` 라우트 삭제), `<도메인>/auth/apple`은 애플 콘솔 Services ID의 Return URL로 등록만 한다(아래).
- 로그인 화면 하단 링크: `/find?service=client&type=id|pw`, `/join?service=client`, `/terms?type=privacy|service`.
- 로그인 화면 "되돌아가기"는 `navigate(-1)`, SNS 연동 화면은 `/login`로 이동.

- 이전 `/main` 주소는 쿼리를 유지하며 `/`로 replace 이동한다.
- 공통 헤더·LNB의 현재 구현 범위는 [메인 화면](../main.md)을 참고한다.

## 제약

- **`POST /login`은 multipart/form-data만 받는다(JSON이면 400).** 필드명 `username`, `password`.
- 클라이언트 입력 검증은 빈 값뿐이며 서버 호출 전에 막는다.
- 세션은 쿠키 기반이라 토큰을 저장하지 않는다. 배포 환경은 백엔드 절대 주소로 바로 호출한다(백엔드가 배포 도메인을 CORS 허용). 로컬 개발만 개발 서버 프록시를 거친다(`vite.config.ts`).
- `GET /v3/sec` 세션 조회는 `X-Path` 헤더로 경로 인가를 묻고 **캐시된 답을 쓰지 않는다**(권한이 서버에서 바뀔 수 있음). 그래서 SWR 캐시에 두지 않고 라우트의 세션 middleware(`app/router/session-middleware.ts`)가 이동할 때마다 확인한 뒤 레이아웃이 `Outlet` context로 세션을 내려 준다(화면에서 다시 요청하지 않음). 같은 라우트 패턴 안의 이동(탭·문의 선택)만 직전 허용 결과를 재사용한다. 공개 홈은 loader가 확인을 기다리지 않고 Promise로 넘겨 로그인 상태만 정하며 접근을 막지 않는다. `result`는 인증이 아니라 해당 경로의 인가 결과다.
- 세션 middleware는 401이면 현재 앱의 `/login`으로 보내고, 그 밖의 실패(서버 오류·네트워크)는 라우트 에러 화면(다시 시도)으로 보낸다. 권한 없음(403·`result: false`)은 로그아웃이 아니므로 앱 안의 이동이면 지금 화면에 머물고, 첫 진입이면 홈으로 보낸 뒤 "해당 메뉴에 접근할 권한이 없습니다. Master ID에 권한을 요청해 주세요." 토스트를 띄운다. 돌아온 화면은 세션을 새로 받아 LNB 권한 표시를 갱신한다. Sub ID의 `/mypage/subscribe`는 토스트 없이 계정 설정으로 보낸다. 로컬 개발에서도 같은 로그인 흐름을 유지하며, 401 응답의 외부 `redirectTo`(Stage 회원 사이트)는 사용하지 않는다.
- 로그인 착지점은 권한 분기 없이 홈이라 구 Vue 앱으로 넘어가는 전체 페이지 로드가 없다(`useNavigateToLanding`).
- 비밀번호 만료 핸드오프: 자격 증명은 라우터 state가 아니라 모듈 변수에 둔다(state는 history 복원 파일로 디스크에 남음). 새로고침하면 사라지고, `ExpiredPasswordForm`이 액션 시점에 `/login`로 돌려보낸다. 비밀번호 변경/연장 성공 경로에서만 지우며 뒤로가기 등 그 외 이탈에서는 지우지 않는다.

### 폼 로그인 에러 매핑

문구 표는 `lib/login-error.ts`와 테스트가 기준이다. 코드에서 읽히지 않는 규칙만 적는다.

- **서버는 401에는 camelCase reason, 403에는 SCREAMING_CASE reason을 쓴다.** `ACCOUNT_LOCKED`는 상태 코드와 무관하게 오므로 status 분기보다 먼저 검사한다.
- `accountRejected`(승인 거절/대기)도 `ACCOUNT_LOCKED`와 같은 "검토중" 팝업으로 처리한다(구 앱 동작 유지). 403 `ACCOUNT_EXPIRED`는 문구 없이 자격 증명 핸드오프 후 `/expired`로 간다.
- `accountDestroyed` 문구는 정보통신망법 제29조 휴면 만료 **법적 고지라 줄이지 않는다.**
- `accountLocked`/`accountDestroyed`에 `time`이 없으면 일반 불일치 문구로 떨어진다. 에러 본문이 JSON이 아니어도 reason 없음으로 본다(런타임 검증 없음).
- 메시지가 있으면 두 입력 모두 에러 상태(서버가 어느 필드가 틀렸는지 알려주지 않음). 단 "아이디를 입력해 주세요."이면 비밀번호는, "비밀번호를 입력해 주세요."이면 아이디는 정상 상태.

### 소셜 로그인

카카오·네이버·구글·애플 모두 V3 인가 코드 방식이다. 서버가 인가 코드를 교환해 신원을 직접 확인하고 세션 쿠키를 연다(토큰·`Authorization` 쿠키를 프론트가 다루지 않음).

- **계약**: `POST /v3/auth/sns/{platform}/login`. 카카오·구글·애플은 `{ code, redirectUri }`, 네이버는 `{ code, state }`(`redirectUri`는 보내지 않음)를 보낸다. `{ token }`을 보내면 `400 INVALID_SNS_CODE`. 성공은 `{ userIdx, authority }` + 세션 쿠키, 오류는 `{ result, reason }`.
- **미가입**: `404 NEED_SIGNUP` 본문 `{ reason, platform, email, snsLinkToken }`. `snsLinkToken`은 서버가 확인한 신원을 서명한 값(10분 유효)이고 프론트는 읽지 않고 `/sns-link`의 router state(`snsData`)로 넘긴다. 토큰이 없는 `NEED_SIGNUP`과 다른 거절(`ACCOUNT_BANNED`·`ACCOUNT_EXPIRED`·`ACCOUNT_NOT_APPROVED`·`ACCOUNT_NOT_ALLOWED`·`INVALID_SNS_CODE`)은 문구 없이 실패로 본다(사유별 문구는 미정).
- **리다이렉트 공급자(카카오·네이버·구글)**: 시작할 때 임의 `state`와 시각을 `sessionStorage`에 남기고 공급자 화면으로 전체 이동한다. 로그인과 마이페이지 연결은 저장 키를 따로 써서 같은 콜백(`/auth/{platform}`)에서 구분한다. 돌아온 `state`가 남겨 둔 값과 같고 10분 안일 때만 서버를 부르고, 아니면(우리가 시작하지 않은 복귀) 서버를 부르지 않고 `/login`으로 보낸다. 의도는 읽는 즉시 지우고, 인가 코드가 주소·방문 기록에 남지 않게 쿼리도 지운다.
- **SDK**: 번들에 넣지 않는다. 카카오·네이버는 SDK 없이 인가 주소로 이동하고, 구글(GIS code client, redirect 모드)은 클릭할 때 불러오고, 애플은 팝업이 막히지 않게 로그인 화면·계정 설정 화면이 열릴 때 미리 불러 둔다. 구글·애플 SDK는 타입 미제공이라 쓰는 표면만 직접 선언한다.
- **공급자별 함정**
  - 카카오: 인가와 교환이 같은 **REST API 키**(`VITE_KAKAO_REST_API_KEY`)여야 한다. JS SDK v1은 2026-12-31 종료이고 v2에는 토큰 팝업이 없어 SDK를 쓰지 않는다. 키가 비면 인가 주소가 `client_id=undefined`가 되어 `KOE101`.
  - 네이버: 개발자센터 Callback URL이 `<도메인>/auth/naver`와 한 글자도 다르면 안 된다.
  - 구글: 스코프는 `openid email profile`만(서버가 ID 토큰의 `sub`·이메일만 씀, `openid` 필수). 사설 IP(`192.168.x.x`)는 리다이렉트로 받지 않아 로컬은 `localhost`나 도메인이어야 한다.
  - 애플: 팝업(`usePopup: true`)이라 콜백 화면이 없다. `signIn()` 응답의 `authorization.code`를 보내고, `redirectUri`는 `AppleID.auth.init`에 넣은 `redirectURI`와 글자까지 같아야 한다(다르면 `INVALID_SNS_CODE`). `state`는 시작할 때 만든 값과 비교하고 `nonce`는 서버가 검증하지 않아 보내지 않는다. 스코프는 `email`만. `redirectURI`는 애플 콘솔 Return URL과 같아야 하고 호스트는 도메인이어야 해서(IP·`localhost` 불가) Stage 등록 대상(`stage.client.bigbird.co.kr`·`stage.biz.bigbird.co.kr`의 `/auth/apple`) 배포본에서만 시험할 수 있다. 운영은 서버 설정 전이라 `SNS_PLATFORM_NOT_SUPPORTED`. 팝업을 닫거나 취소(`popup_closed_by_user`·`user_cancelled_authorize`)하면 안내 없이 끝난다.
- 콜백 화면은 SWR 키에 `useId()`를 넣어 마운트마다 새 키를 쓴다. StrictMode 이중 마운트에서 일회용 인가 코드가 두 번 쓰여 실패하는 것을 막는다.
- **실패 표시**: 공급자 화면·팝업을 열지 못한 시작 실패(스크립트 로드 실패, SDK 없음)는 "로그인을 시작하지 못했습니다.", 공급자를 거친 뒤의 실패(서버 거절·네트워크 오류·응답 형태 불일치, 우리가 시작하지 않은 복귀 포함)는 "로그인하지 못했습니다. 다시 시도해 주세요."를 폼 아래에 보인다(사용자 결정 2026-11-04, 네 공급자 공통). 리다이렉트 공급자는 복귀 화면이 실패 router state와 함께 `/login`으로 보내고, 로그인 화면은 안내를 띄운 뒤 방문 기록의 state를 지운다(새로고침에 다시 뜨지 않게). 애플은 팝업 뒤 같은 화면에서 알린다. 창을 닫은 취소는 안내하지 않는다. 사유별 문구(정지·승인 대기 등)는 기획 확인 대기.

### SNS 연동 (`/sns-link`)

- 입력은 router state의 `snsData`(`{platform, email?, snsLinkToken}`)를 Zod로 검증하며, 실패하면 없는 것으로 보고 화면은 그대로 뜬다. 같은 형태가 `/join`의 `tokenData`로 흐른다.
- 신원 증명은 서버가 서명한 `snsLinkToken` 하나다. 프론트는 `uid`를 들고 있지도 보내지도 않는다.
  - 가입하기: `/join`에서 가입이 성공하면 방금 입력한 아이디·비밀번호와 토큰으로 `POST /v3/auth/sns/link`를 부른다. 계정은 이미 만들어졌으므로 연동이 실패해도 가입은 성공으로 본다(승인 전이어도 연결되고, 승인 뒤 SNS로 로그인된다).
  - 기존 계정 연동 탭: `POST /v3/auth/sns/link { id, password, snsLinkToken }`가 서버에서 아이디·비밀번호를 확인해 연결한다(세션은 열지 않음). 성공하면 이어서 폼 로그인으로 세션을 열고 `/`로 간다. 이 API는 세션을 열지 않고 승인 여부도 보지 않는다. **승인 전 계정은 연동이 200으로 저장되고 뒤이은 폼 로그인만 실패하므로, 이때는 연동 실패 문구 없이 `/login`으로 보낸다**(연결은 이미 저장됐고 승인 뒤 SNS로 로그인됨). 승인 대기 안내 문구는 시안에 없어 만들지 않았다.
  - 오류 매핑: `401 INVALID_CREDENTIALS`는 "입력하신 아이디와 비밀번호가 …" 문구로, 그 밖(`400 INVALID_SNS_LINK_TOKEN`, `403 ACCOUNT_LOCKED`·`ACCOUNT_BANNED`·`ACCOUNT_EXPIRED`, `409 SNS_ALREADY_LINKED`·`SNS_LINKED_TO_OTHER_USER`)은 모두 "연동되지 않았습니다. 관리자에게 문의해주세요"로 보인다. 토큰 만료·잠금·이미 연결됨의 별도 문구는 디자인·기획에 없어 만들지 않았다(확인 필요).
- 연동 탭 제출: 빈 값이면 "아이디/비밀번호를 모두 입력해 주세요", `snsData`가 없으면(직접 URL로 연 경우) 서버를 부르지 않고 "SNS 연동 정보가 없습니다".
- 이 로그인은 폼 로그인의 에러 매핑을 쓰지 않는다. 잠금/만료/탈퇴 안내가 없고 `/expired`·권한별 분기도 없다. 세션이 열리면 `/`, 승인 전 계정처럼 폼 로그인만 실패하면 `/login`으로 간다(위 기존 계정 연동 탭).
- "아이디 찾기"/"비밀번호 찾기"는 `/find`로 이동하며 `?service=client&type=...`이 **붙지 않는다**(로그인 화면 링크와 다름).

## 동작 결정

- **브랜드**: 한 배포가 빅버드와 펫플레이 두 도메인을 서비스하며 로고·문구·색·문의 버튼만 다르다. 백엔드·OAuth·리다이렉트는 공유한다. `hostname.includes("petplay")`이면 펫플레이, 아니면 `?brand=petplay`로 강제할 수 있다(QA용 local/stage). 펫플레이는 주 색상 `#f79000`을 `--brand` CSS 변수로 덮고 문의 버튼을 숨긴다.
- 로그인 성공(폼·소셜)은 권한과 무관하게 `/`(`useNavigateToLanding`).
- 계정 잠금 팝업은 `LoginForm`이 직접 열지 않고 부모(`LoginPage`)가 상태를 소유한다(`onAccountLocked(userId)`).
- 문의 패널이 열리면 로고/폼/SNS 행은 모두 숨긴다. 모바일은 더보기(`...`) 메뉴에 약관 링크를 담는다.
- 로그인 이동 후 뒤로가기로 로그인 화면에 돌아올 수 있다(막지 않음).

## 엣지 케이스

- `/sns-link`를 URL로 직접 열면 `snsData`가 없다. "가입하기"는 `tokenData: null`이라 **소셜 가입이 아닌 일반 가입으로 조용히 바뀌고**, 연동 탭은 서버를 부르지 않고 "SNS 연동 정보가 없습니다"를 보인다.
- 콜백 `Navigate`는 `replace`가 없어 콜백 URL이 history에 남고, 뒤로가기 시 콜백이 새 키로 다시 실행될 수 있다.
- 문의 버튼의 `icon-questions` CSS 클래스는 v2 원본에도 정의가 없어 **아이콘이 그려지지 않는다**(`aria-label="문의"`인 빈 버튼). `QuestionPanel`은 원본의 스타일 미정의를 대체한 임시 구현이다(카카오 상담, `tel:1661-6213`, 운영시간).
- 로그인 화면 진입 시 이미 로그인됐는지는 감지하지 않는다.

## v2 대비

- 로그인 경로 `/client`에서 `/login`으로 변경. `/client`는 리다이렉트도 두지 않고 제거했다(이전 링크·북마크는 404).
- SNS 연동 경로 `/client/detail`에서 `/sns-link`로 변경. 제공자 콘솔에 등록된 경로가 아니라 이름 변경이 안전했다. 이전 URL의 호환 리다이렉트는 **없다**.
- SNS 신원(router state)을 Zod로 검증해 잘못된 state를 무시한다(v2는 타입 단언만).
- 소셜 로그인은 V2(`login/client/{platform}`·`oauth/client/google`, 애플 서버 `form_post`의 `uid`·`email` 쿼리, `C01`/`C02` 코드)에서 V3 인가 코드로 바꿨다. V2는 서버가 `uid`를 검증하지 않았다. SNS 연동도 V2 `PUT /auth/{platform}/{userIdx}`에서 `snsLinkToken` + `POST /v3/auth/sns/link`로 바꿨다.
- 애플 SDK를 `index.html`에 박아 전 화면에서 받던 것을 필요한 화면(로그인·계정 설정)에서만 불러온다.
- axios에서 자체 fetch 클라이언트로 교체하고 `/login`은 FormData를 유지한다.
- 세션 가드가 서버 권한을 단일 출처로 쓰도록 새로 추가했다(라우터 middleware).
- `mapLoginError` 규칙, `onAccountLocked` prop 이름, 자격 증명 핸드오프(모듈 변수), 런타임 SDK 로드는 v2와 동일하다. 착지점은 v2와 달리 권한과 무관하게 홈이다(위 목적 1).

## 범위 밖 · 미해결

범위 밖: 회원가입(`features/join`), 아이디/비밀번호 찾기(`features/find`), 비밀번호 만료 변경 폼(`features/expired-password`), 약관, 세션 만료 후 자동 재로그인, 인플루언서 로그인, 메인 화면 내용.

미정 / 확인 필요:

- 문의 버튼 아이콘, `QuestionPanel` 디자인.
- 콜백 실패 사유별 문구(기획 확인 대기), 콜백 `Navigate`의 `replace` 여부, 로그인된 사용자가 `/login`에 올 때의 동작.
- 도메인 키워드가 `petplay`라는 가정은 실제 운영 도메인과 대조 필요.
- 휴면 만료 법적 고지(`error.destroyed`)의 en·ja·zh-CN 번역 법무 검수(한국어 원문은 그대로 유지, 법령 이름은 한국어 병기).
- 환경 값(`VITE_OAUTH_REDIRECT_URL`, 각 클라이언트 ID/키)의 운영·스테이징 값 출처(인프라 담당 확인). 공급자 콘솔의 환경별 리다이렉트 URI·애플 Return URL 등록.
