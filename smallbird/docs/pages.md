# 화면 목록 (pages)

> 현재 구현된 화면의 URL, 담당 슬라이스, 접근 조건, 백엔드 목록, 미해결 항목을 한곳에 모은 인벤토리입니다.
> 기능별 상세(화면 간 이동, 서버 계약, 에러 처리, 엣지 케이스, v2 대비 변경)는 `specs/[<그룹>/]<feature>.md`에, 슬라이스 구성과 Public API는 `src/`와 각 `index.ts`에 있습니다.
> 경로의 단일 출처는 `src/shared/config/routes.ts`의 `ROUTES`이고, 라우트 선언은 `src/app/router/routes.tsx`입니다. 이 문서의 표와 어긋나면 코드가 맞습니다.

## 1. 화면 한눈에 보기

개발 서버(`pnpm dev`) 기본 주소는 `http://localhost:5173`입니다.

### 사용자에게 보이는 화면

| URL                | 페이지 슬라이스 (`src/pages/…`) | 설명                                                       | 접근 조건                                                                                                                            | 스펙                                     |
| :----------------- | :------------------------------ | :--------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------- |
| `/introduction`    | `introduction`                  | 공개 랜딩                                                  | 없음                                                                                                                                 | [introduction](../specs/introduction.md) |
| `/login`           | `login`                         | 로그인                                                     | 없음                                                                                                                                 | [login](../specs/auth/login.md)               |
| `/a/change` | `switch-account` | ADMIN 전용 아이디 변경. 로고에서 진입 | `GET /super`, `POST /super/change` | [switch-account](../specs/auth/switch-account.md) |
| `/find`            | `find`                          | 아이디/비밀번호 찾기. `?type=pw`면 비밀번호 탭으로 시작    | 없음                                                                                                                                 | [find-account](../specs/auth/find-account.md) |
| `/find/email-sent` | `find-email-sent`               | 비밀번호 재설정 링크 발송 안내                             | 없음                                                                                                                                 | [find-account](../specs/auth/find-account.md) |
| `/join`            | `join`                          | 회원가입 5단계 마법사                                      | 없음                                                                                                                                 | [join](../specs/auth/join.md)                 |
| `/welcome`         | `welcome`                       | 가입 완료(승인 대기 안내)                                  | 없음                                                                                                                                 | [join](../specs/auth/join.md)                 |
| `/changePw`        | `change-password`               | 찾기 흐름 뒤 새 비밀번호 설정                              | 화면은 열리지만, 저장은 찾기 흐름에서 발급된 일회용 세션이 있어야 성공                                                               | [password](../specs/auth/password.md)         |
| `/expired`         | `expired`                       | 6개월 경과 비밀번호 변경                                   | 로그인 화면이 넘긴 자격 증명이 메모리에 있어야 동작함. 없어도 화면은 열리고, "변경하기"·"다음에 변경하기"를 누르면 `/login`으로 이동 | [password](../specs/auth/password.md)         |
| `/sns-link`        | `sns-link`                      | 미가입 SNS 계정으로 들어왔을 때 가입하기/기존 계정 연동    | 소셜 로그인 뒤 라우터 state(`snsData`)가 있어야 정상 동작. URL 직접 진입 시 연동 정보 없음                                           | [login](../specs/auth/login.md)               |
| `/terms`           | `terms`                         | 이용약관. `?type=privacy`면 개인정보처리방침               | 없음                                                                                                                                 | [terms](../specs/auth/terms.md)               |
| `/` | `home` | 공개 홈. 로그인 상태별 헤더·좌측 LNB 안에 히어로·인플루언서 검색 입력·카드 3개 | 로그인·비로그인 모두 접근 가능 | [home](../specs/home.md), [main](../specs/main.md) |
| `/influencers/search` | `coming-soon` | 홈 검색의 이동 대상(`?q=…&platform=…`). 결과 화면 전까지 셸 안의 임시 "준비 중" 화면 | 로그인·비로그인 모두 접근 가능 | [home](../specs/home.md) |
| `/mypage/account` | `mypage-account` | 마이페이지 계정 설정. 탭 셸(`?tab=`, Master 5개·SUB 2개, 잘못된 값은 기본 탭)과 모든 탭을 구현: Master ID 관리(간편 로그인 연동, 회원 탈퇴 약관 `?panel=withdraw`)·회사정보·계좌정보·Sub ID 관리(목록·생성 `?panel=create`·권한 부여 `?panel=permission&subId=`·삭제 알럿)·알림 설정·SUB 본인 정보(`?tab=self`). 남은 목은 Sub ID 캠페인 할당뿐이라 그 부분만 개발 서버에서 목으로 그리고 빌드(stage·prod)에서는 "준비 중"(스펙 §1). 셸은 `app/layouts/MypageLayout` | 로그인 필요(`requireSessionRoute`의 세션 middleware), 화면 단위 권한 없음. 헤더 프로필 메뉴·LNB 마이페이지 > 계정 설정에서 진입. 계좌정보 탭은 회사정보 필수 항목이 모두 등록돼야 열리고, 아니면 "회사 정보 등록 필요" 얼럿 | [mypage-account](../specs/mypage/account.md) |
| `/mypage/subscribe` | `mypage-subscribe` | 마이페이지 구독. 구독·이용요약·결제내역 탭(`?tab=`, `plans`·`usage`·`payments`)과 결제 화면(`?panel=checkout&plan=…&period=monthly\|yearly`, 탭 없음), 이용요약 상품 세그먼트(`?type=`), 결제내역 필터 화면(`?panel=filter`, TAB은 본문 대체·MO는 모달)을 구현. 상품·구독·카드(삭제·기본 카드 변경)·결제 내역·해지는 V3 API로, 구독 결제와 카드 추가는 결제 서버로 연결했고 **이용요약만 개발 서버의 목 데이터**. 이용요약 탭은 개발 서버에서만 열려 있고 빌드(stage·prod)에서는 그 탭만 "준비 중" 빈 상태(`IS_USAGE_MOCK_ENABLED`). 결제 화면은 등록 카드 중 기본 카드로만 결제하고(연간은 할부 2~12개월 선택, 다른 카드를 누르면 기본 카드 변경 알럿), 카드가 없으면 구독하기에서 "결제 카드 등록" 알럿으로 먼저 카드를 등록하게 함 | 로그인 필요(세션 middleware), **Master(MASTER·ADMIN)만**. SUB는 세션 middleware가 `/mypage/account`로 보내고, LNB 구독 메뉴도 SUB는 비활성 | [mypage-subscribe](../specs/mypage/subscribe.md) |
| `/mypage/money` | `mypage-money` | 마이페이지 빅버드 머니. 충전/출금 내역·사용 내역 탭(`?tab=`, `charge`·`usage`)과 하위 화면(`?panel=`, `charge`·`withdraw`·`charge-detail`·`usage-detail`과 `id`, 사용 탭 TAB의 필터 화면은 `filter`, MO 충전 탭 세그먼트는 `?view=`, `balance`·`history`)을 구현. 잔액·충전/출금 내역·사용 내역·출금은 V3 API, 충전 요청은 결제 서버를 거쳐 이니시스(PC는 표준결제 창, 휴대폰은 모바일 결제 페이지로 이동). 필터·"N개 보기"·사용 내역 검색은 서버 연결 | 로그인 필요(세션 middleware). SUB는 빅버드 머니 권한(`isBigbirdMoneyAccess`, `GET /v3/sec`)이 있어야 진입하고, 없으면 LNB 메뉴가 흐림 | [mypage-money](../specs/mypage/money.md) |
| `/main` | — | 기존 주소 호환용. 쿼리를 유지하며 `/`로 replace | `/`에서 세션 상태 확인, 비로그인도 접근 가능 | [main](../specs/main.md) |
| `/customer-center/bigbird` | `customer-center-bigbird` | 빅버드 문의 목록·대화 작업 영역. PC는 최신 문의 대화를 함께 표시 | 로그인 및 고객센터 접근 권한 필요. 일반 문의 목록·대화는 V3 API, 실시간 상담 메시지·연결 상태는 Firestore 구독으로 읽고(상담 중·요청 실패 표시), 상담 요청·전송·종료·재시도·전환 쓰기는 `IS_REALTIME_WRITE_ENABLED=true`로 켜져 있음(운영 앱·v2 호환 수정은 후속, 그 전까지 동시 전송 유실 등 알려진 위험을 감수). 쓰기는 주소로 직접 연 문의에만 적용. 열린 일반 문의는 추가 메시지 입력, 종료 버튼 없음(2026-10-28). 복수 문의 등록은 `IS_REGISTRATION_ENABLED = true`로 켜져 있음(서비스 전이라 로컬·stage 테스트용). v2·운영 앱의 열린 기타 문의 여러 개 대응은 검증 전 | [customer-center](../specs/customer-center/customer-center.md) |
| `/customer-center/bigbird/:threadIdx` | `customer-center-bigbird` | 선택한 빅버드 문의의 대화. 열린 일반 문의는 추가 메시지(텍스트·첨부) 입력, 종료된 문의는 읽기 전용(2026-10-28). TAB·MO는 대화만 표시. 안내 카드 아래에서 첫 메시지가 시작되도록 반응형 여백 유지. 첨부 묶음은 발신자 쪽 정렬. 실시간 캠페인 문의도 캠페인 정보 카드 표시 | 로그인 및 고객센터 접근 권한 필요. 목록에 없는 `threadIdx`면 목록으로 돌아가는 안내 | [customer-center](../specs/customer-center/customer-center.md) |
| `/customer-center/bigbird/new` | `customer-center-bigbird-new` | 문의 목록 패널과 새 문의 UI(캠페인은 사각 체크박스로 단일 선택, 긴 이름은 한 줄 말줄임) | 로그인 및 고객센터 접근 권한 필요. 유형·방식 선택·텍스트 입력 구현, 캠페인 목록은 V3 API 연결(5행 초과 시 본문 스크롤). 문의 남기기 등록 연결(`IS_REGISTRATION_ENABLED = true`, 본문 저장 뒤 대화로 이동하고 첨부는 백그라운드 업로드). 복수 문의의 v2·운영 앱 호환은 검증 전. 실시간 상담하기 선택 비활성 | [customer-center](../specs/customer-center/customer-center.md) |
| `/customer-center/buyer` | `customer-center-buyer` | 구매자 문의·상품 Q&A 통합 목록(전체·답변 대기·상담 중·답변 완료 탭, 끝까지 스크롤하면 다음 쪽) | 로그인 및 고객센터 접근 권한 필요. 비로그인 메뉴 클릭 시 `/login` 이동. 목록은 `GET /v3/help/inquiry` 연결(탭은 서버 상태값 `ALL`·`WAITING`·`IN_PROGRESS`·`ANSWERED`로 걸러 받고, 카드는 상태 배지를 항상 표시(Figma 26/10/29)). 문의 유형·캠페인·인플루언서 필터는 URL과 V3 API에 연결. 검색(이름·주문번호, `?q=`)과 적용된 필터 칩 지원, 등록일 범위 필터(`startDate`·`endDate`) 지원 | [customer-center](../specs/customer-center/customer-center.md) |
| `/customer-center/buyer/:inquiryKey` | `customer-center-buyer` | 선택한 문의(임시 키 `{출처}-{inquiryIdx}`)의 대화·상세 패널. 구매자 문의는 구매자 대화(`GET /v3/help/thread?type=client`) 조회, 상품 Q&A는 `/v3/help/qna` 조회, 상세 패널은 `GET /v3/help/inquiry/{inquiryIdx}`. 답장 전송과 Q&A 답변 등록·수정·삭제는 구현돼 있지만 `IS_BUYER_WRITE_ENABLED = true`(2026-10-23 켬)라 답장·Q&A 답변을 보낼 수 있음. 상담 기록 기능은 3.0.6에서 삭제(2026-10-28). 상세는 상품·캠페인 이미지와 문의자 아바타 포함, 모바일 `?panel=detail`로 상세 화면 표시 | 직접 진입한 문의가 현재 목록 페이지에 없으면 준비 중 안내 | [customer-center](../specs/customer-center/customer-center.md) |
| `/customer-center/influencer` | `customer-center-buyer` | 인플루언서 문의·캠페인 Q&A 통합 목록(REQ-34). 구매자 문의와 같은 화면·탭·필터·검색이고 필터 문의 유형만 인플루언서 문의·캠페인 Q&A. 목록은 전용 `GET /v3/help/influencer-inquiry`(요청·응답은 통합 목록과 같음), 전체 탭은 `sourceType=ALL` | 로그인 및 인플루언서 문의 메뉴 권한(`isInfluencerQuestionAccess`) 필요 | [customer-center](../specs/customer-center/customer-center.md) |
| `/customer-center/influencer/:inquiryKey` | `customer-center-buyer` | 선택한 문의의 대화·상세 패널. 인플루언서 문의 대화는 `GET /v3/help/inquiry/influencer-campaign-timeline`(일반·실시간 구간 병합), 캠페인 Q&A는 `/v3/help/qna`. 상세 패널은 주문/상품 정보·공구샵 코드·공구 진행 인플루언서 없음(Figma PC·TAB). 실시간 상담은 구매자 실시간 머지 뒤 연결 | 직접 진입한 문의가 현재 목록 페이지에 없으면 준비 중 안내 | [customer-center](../specs/customer-center/customer-center.md) |

### 기술용 화면 (사용자가 직접 열 일이 거의 없음)

| URL             | 페이지 슬라이스   | 용도                                                                                                                    |
| :-------------- | :---------------- | :---------------------------------------------------------------------------------------------------------------------- |
| `/cert`         | `cert`            | 모바일 KMC 본인인증용 중간 화면(페이지 전체를 KMC로 제출). 현재 코드에서 이 주소로 이동하는 곳이 없어 진입 경로는 미정  |
| `/cert/success` | `cert-success`    | 데스크톱 KMC 팝업이 돌아오는 주소. 부모 창의 `cert_result`를 호출하고 닫힘                                              |
| `/inicis/close` | `inicis-close`    | 이니시스 결제창의 `closeUrl`. 결제창 안에서 열려 이니시스 닫기 스크립트로 결제창만 닫음(화면 없음, 로그인 확인 없음)  |
| `/auth/kakao`   | `social-callback` | 카카오 OAuth 콜백(로그인·마이페이지 연결을 `state`로 구분)                                                                                                       |
| `/auth/naver`   | `social-callback` | 네이버 OAuth 콜백(로그인·마이페이지 연결을 `state`로 구분)                                                               |
| `/auth/google`  | `social-callback` | 구글 OAuth 콜백(로그인·마이페이지 연결을 `state`로 구분)                                                                 |
| `/dev/ui`       | `ui-preview`      | 공통 컴포넌트 미리보기(Figma 디자인 시스템 표와 같은 배치). 개발 서버(`pnpm dev`)에서만 등록되고 프로덕션 빌드에는 없음 |
| `*`             | `not-found`       | 알 수 없는 경로                                                                                                         |

OAuth 콜백 3개(카카오·네이버·구글. 애플은 팝업이라 화면 없음), `/changePw`(백엔드가 만드는 재설정 링크), `/cert/success`(KMC 반환 주소), `/inicis/close`(결제 서버를 거쳐 이니시스에 넘기는 닫기 주소)는 앱 밖의 설정과 연결된 경로입니다. 이 경로를 바꿀 때는 제공자 콘솔·백엔드·KMC 쪽도 함께 갱신해야 합니다. `/v3/mypage/bigbird-money/pay/result`는 화면이 아니라 배포 nginx(`deploy/nginx/default.conf.template`)가 결제 서버로 넘기는 이니시스 결과 수신 경로이므로 클라이언트 라우트로 쓰지 않습니다.

## 2. 백엔드와 API

백엔드는 4개이며, API 클라이언트는 `VITE_API_*_URL`에 설정된 접두사 경로를 사용합니다. 개발 서버는 `vite.config.ts`의 `server.proxy`를 통해 `VITE_API_*_URL` 접두사와 `VITE_PROXY_*_URL` 대상 주소가 모두 설정된 백엔드만 프록시합니다. 백엔드별 대상 설정 상태는 §4를 참고합니다.

| 클라이언트                 | 환경변수              | 용도                                           | 주요 호출                                                                                                                                                                                                                                                                              |
| :------------------------- | :-------------------- | :--------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `serverApi` (광고주 BE)    | `VITE_API_SERVER_URL` | 폼 로그인, 만료 비밀번호, ADMIN 아이디 변경, 휴대폰 인증 복호화       | `GET /super`, `POST /super/change`, `POST /login`(multipart), `PUT /login/expire`, `GET /login/delay-pw/{id}`, `GET /cert/decrypte`                                                                                                                                              |
| `serverApiV3` (광고주 BE `/v3`) | `VITE_API_SERVER_URL` + `/v3` | 세션(`GET /v3/sec`, 메뉴 권한 6개 포함), 소셜 로그인·로그아웃, 마이페이지·고객센터 V3 API | `GET /v3/sec`(헤더 `X-Path`), `POST /v3/auth/logout`, `POST /v3/auth/sns/{kakao·naver·google·apple}/login`(소셜 로그인, 세션 쿠키), `POST /v3/auth/sns/link`(미가입 SNS 연동), `GET /v3/mypage/account/sns`·`POST·DELETE /v3/mypage/account/sns/{platform}`(간편 로그인 연결), `GET·PUT /v3/mypage/account/authorization`, `/v3/mypage/**`, `/v3/help/**` |
| `memberApi` (멤버 BE)      | `VITE_API_MEMBER_URL` | 회원가입, 이메일 찾기, 본인인증, 비밀번호 변경 | `POST /check/id/{n}`, `POST /check/email/{n}`, `POST /valid/pw`, `GET /cert/decrypte/{n}`, `GET /campaign/category`, `POST /file/upload/*`, `POST /join/{n}`, `POST /find/id/email`, `POST /find/id/email/auth`, `POST /find/pw/email`, `PATCH /changePw/{n}` |
| `authApi` (통합 인증 서버) | `VITE_API_AUTH_URL`   | 카카오톡 플러스친구 인증                       | `POST /lookup`, `POST /verification/loginId`, `POST /verification/password`                                                                                                                                                                                                            |
| `payApi` (결제 서버) | `VITE_API_PAY_URL` | 빅버드 머니 충전의 결제 요청, 구독 기본 카드 결제·카드 추가 요청(쿠키 없이 요청). 이니시스 스크립트 주소는 `VITE_INICIS_STDPAY_URL` | `POST /v3/mypage/bigbird-money/pay`(요청의 `deviceType` `PC`·`MOBILE`로 응답이 갈림), `POST /v3/subscription/billing/subscribe/saved-card`, `POST /v3/subscription/billing/cards/register` |

모든 요청은 쿠키 세션 기반이라 `credentials: "include"`로 나가고(결제 서버만 쿠키 없이 `"omit"`), 토큰은 저장하지 않습니다. 응답은 Zod로 검증한 뒤 사용합니다.

로컬 설정: 팀에서 전달받은 `VITE_PROXY_*_URL` 대상과 소셜 로그인 키(`VITE_OAUTH_REDIRECT_URL`, `VITE_KAKAO_REST_API_KEY`, `VITE_NAVER_CLIENT_ID`, `VITE_GOOGLE_CLIENT_ID`, `VITE_APPLE_CLIENT_ID`)를 Git에서 제외되는 `.env.local`에 넣습니다.

## 3. 공통 사항

- **반응형**: 모바일 우선(`w-80`)이며 `tablet:`(768px 이상)과 `desktop:`(1440px 이상) 브레이크포인트를 씁니다. 랜딩만 별도로 `introtab`(1240px)을 씁니다. 정의는 `src/app/styles/index.css`.
- **다크 모드 없음**: 라이트 테마만 지원합니다.
- **다국어**: `ko`(기본)·`en`·`ja`·`zh-CN`을 지원합니다(`docs/prd.md`, `.claude/rules/i18n.md`). 런타임은 `@/shared/i18n`이고 언어는 시작할 때 한 번 정합니다(`specs/i18n.md`). 이관된 화면은 `not-found`, `welcome`, `find-email-sent`, `cert-success`, `main`(+공통 셸), `switch-account`, `login`, `sns-link`, `find`, `expired`, `change-password`, `join`(+`welcome`·`cert`), `introduction`, `terms`(본문은 Claude 번역본, 법무 검수 미정)이며, 개발 전용 `ui-preview`를 제외한 모든 화면이 이관됐습니다. 진행 순서는 `specs/i18n.md`, 용어 질의는 `docs/glossary-questions.md`.
- **에러 처리**: 라우트 에러는 `src/app/providers/ErrorBoundary.tsx`가, 서버 에러는 각 폼이 해당 필드 근처에 문구로 보여줍니다.
- **페이지 제목**: 각 페이지가 React 19 `<title>`을 렌더링합니다. `cert`, `cert-success`, 소셜 콜백 페이지에는 없습니다.

## 4. 알려진 공백 (미해결)

| 항목                             | 상태                                                                                                                                                                           |
| :------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 모바일 본인인증(`/cert`)         | 이 주소로 이동하는 코드가 없고, 제출 후 결과가 가입 마법사로 돌아오는 방식도 불분명함(`specs/auth/join.md` "범위 밖 · 미해결")                                                      |
| 랜딩 "이용 가이드" 링크          | `/clientguide`는 이식되지 않은 구 앱 경로                                                                                                                                      |
| 랜딩 문의 폼                     | 전송 기능 없음(안내 문구만 표시). v2도 동일                                                                                                                                    |
| OG 미리보기                      | SPA 모드라 프리렌더가 없어, JS를 실행하지 않는 크롤러는 랜딩의 og 태그를 읽지 못함                                                                                             |
| i18n | 화면 문구 이관 완료. 남은 것: 약관 번역본 법무 검수, 용어집 확정(`docs/glossary-questions.md`), 이미지에 박힌 한국어 텍스트(랜딩), 한글 리터럴 금지 ESLint 규칙 |
