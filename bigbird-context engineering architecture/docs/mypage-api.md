# 마이페이지 API 검토

> V3 Swagger `V3-마이페이지` 그룹(Stage, 2026-10-22 재검토)에서 **Swagger만 봐서는 놓치기 쉬운 점, 아직 없는 API, 스펙과 다른 점, 백엔드 요청**만 적습니다. 엔드포인트·필드·응답 형태의 원본은 Swagger이고, Zod 스키마는 Swagger 필드를 기준으로 만듭니다.
> Swagger JSON은 `https://api.stage.client.bigbird.co.kr:38443/v3/api-docs/V3-마이페이지`에서 받습니다(UI는 `/swagger-ui/index.html?urls.primaryName=V3-마이페이지`).
> 화면 결정은 `specs/mypage/account.md`·`specs/mypage/subscribe.md`·`specs/mypage/money.md`에 있습니다.

## 1. 공개 범위

계정 설정의 Master 정보·정보 수정(휴대폰 인증 연결·이메일)·중복확인·비밀번호 변경·프로필 이미지·회원 탈퇴, 회사정보·서류 업로드·회사 분류, 계좌·은행 목록·통장사본, Sub ID 생성·삭제·본인 정보 수정(휴대폰·이메일·비밀번호)·본인 프로필 이미지, 캠페인 배정·해제·조회, 빅버드 머니 사용 내역이 공개됐습니다. 대부분 v2 API를 그대로 재사용합니다.

## 2. 구현할 때 주의할 점

- **응답 형태가 두 가지입니다.** 비밀번호·프로필·Sub ID·Master 조회는 HTTP 상태 + `V3ErrorResponse {result:false, reason}`이고, 업로드·계좌는 **항상 HTTP 200**에 `result`/`reason`으로만 성공·실패를 구분합니다. 두 형태를 모두 처리합니다.
- **중복확인(`POST /check/{type}`)은 `result: false`가 사용 가능, `true`가 이미 사용 중**입니다(v2 코드 확인, Stage 호출로 재확인 예정). `result`가 없거나 null이면 사용 가능으로 읽지 않습니다. `type=pw`는 반대로 `true`가 현재 비밀번호 일치입니다.
- **`PUT /modify`는 이메일을 비워 보내면 기존 이메일이 지워집니다.** 휴대폰 인증만 바꿀 때도 현재 이메일을 함께 보냅니다. Sub ID는 이 API를 못 쓰고(403) `PUT /sub/{type}`을 씁니다.
- **회사정보 수정(PUT)은 전체 덮어쓰기**입니다. 보내지 않은 필드가 null이 되므로 항상 전체 필드를 보냅니다. 등록(POST)만 필수값(회사명·연락처·사업자 등록 번호·통신판매업 신고번호)을 검증합니다.
- **업로드는 회사정보가 먼저 등록돼 있어야** 됩니다(`extra information is not found`). 처음 등록할 때는 회사정보를 저장한 뒤 파일을 올립니다.
- **계좌 등록의 정산 기간 거부가 `{result:true, reason:"denied"}`**로 옵니다. `result`만 보면 성공으로 착각하므로 `reason`도 확인합니다. 그 밖의 실패는 `{result:false}`만 오고 사유가 없습니다.
- **계좌 조회의 은행은 이름**으로 옵니다. 은행 목록에서 이름으로 `bankIdx`를 찾습니다.
- Master 정보 조회는 **Sub ID면 403**입니다. 간편 로그인 연동 상태는 이 응답의 SNS별 `id*`·`email*` 필드로 읽고(페이스북 포함), 담당자명은 `certification.name`, 가입일은 `user.created`입니다.
- 프로필 이미지는 Master가 `/profile`, **Sub ID 본인이 `/sub/profile`**입니다(서로 상대 경로는 403). 등록·수정·삭제가 각각 POST·PATCH·DELETE이고, 없는 상태에서 PATCH·DELETE는 404입니다.
- 회사 분류는 **최상위 목록 API만** 씁니다. 하위 분류 API는 쓰지 않습니다(시안의 Select 하나, 회원가입과 같음).
- 회원 탈퇴는 비밀번호 확인(`POST /check/pw`) 뒤 `PUT /exit`(응답 `{result, message}`)로 처리합니다. v2가 둘 사이에 부르던 `POST /transfer/false`(2020년 서비스 이관 거부 기록)는 v3에서 필요 없음으로 결정했습니다(2026-10-22). Stage 호출은 계정이 실제로 탈퇴되므로 확인 전입니다.
- 빅버드 머니 사용 내역은 캠페인 값이 없으면 `"-"`가 오고, 금액은 부호가 있습니다. `entrySize` 기본값이 5라서 페이지 크기를 명시합니다.

## 3. 아직 없는 API

| 화면 | 필요한 것 | v2 참고 |
|---|---|---|
| Sub ID 관리 | 목록·검색, 권한 조회·저장(v3 권한 6개 + 고정 키) | `GET /account/`, `/account/authorization` |
| Sub ID 본인 | 본인 정보 조회(이름·휴대폰·이메일·가입일) | `GET /account/master`는 SUB 403 |
| 간편 로그인 | 등록·해제(페이스북 포함, v3 필수) | `/auth/link/*`, social 서버. v2는 페이스북 없음 |
| 알림 설정 | 조회·변경 | `/agreement`(member 서버) |
| 빅버드 머니 | 잔액, 충전 내역, 충전 요청(가상계좌 발급), 거래 상세, 거래명세서 | `/biz`, `/biz/charge/list`, `/biz/init` + PG |
| 구독 | 전부 | 없음(v2에 구독 개념 없음) |

캠페인 배정(`POST·DELETE /assign`)과 캠페인 조회(`GET /campaign`)는 공개됐고 조회 응답 스키마(`CampaignListV3Response`)도 반영됐으나(2026-10-22), Sub ID 목록이 없어 `accountIdx`를 얻을 수 없고 표의 열(상품 유형·세부 상품·진행 상태)과 맞는 필드를 확인해야 하므로(§4-5) 목으로 둡니다.

## 4. 백엔드 요청 (스펙과 다른 점)

**이 표가 백엔드에 넘길 질문의 단일 원본입니다.** 답이 오면 행을 지우고 확정 내용은 §2나 `specs/mypage/account.md` §3에 반영합니다. 스펙 §7의 `B-n` 표는 이 행을 가리키는 포인터와 "답 전 화면 처리"만 둡니다(번호 대응은 각 행 끝). 기획·정책 질문(P-n)은 백엔드가 답할 게 아니라서 스펙에 둡니다.

2026-10-22 재검토에서 해결 확인: 비밀번호 변경의 현재 비밀번호 요구(Master), 회사 분류 필수 검증, Sub ID 생성 요청 스키마, 요청 스키마 필수 표시(일부), 회원 탈퇴의 `transfer/false` 불필요(결정), 정산 기간 거부(`{result:true, reason:"denied"}`)는 프론트가 `reason`까지 확인해 처리.

| # | 내용 | 요청 |
|---|---|---|
| 2 | 업로드 용량 한도가 문서에 없음. 프론트는 업로드 전에 시안 기준(JPG·PNG·PDF, 10MB)으로 먼저 막음. 형식 불일치는 `{result:false, reason:"fail image upload"}`. 사업자 등록 번호·등록증을 등록 뒤에도 서버가 수정 허용하는지(v2는 잠금) `[B-5]` | 서버 한도가 10MB 이상인지, 용량 초과 시 응답 형태, 등록 뒤 수정 허용 여부 |
| 3 | 중복확인(`check/{type}`)의 `result` 의미가 Swagger에 없음. v2 코드로는 `id`·`email`은 `false`가 사용 가능, `pw`는 `true`가 일치. 프론트는 이 해석으로 구현했고 Stage 호출로 확인 전 `[B-4]` | 의미 명시 |
| 4 | 응답 스키마 없음(예시만 있음): `GET`·`POST /bank`, 업로드 3종(`extra/registration/upload`, `extra/mailorder/upload`, `bank/upload`)의 200 응답 `[B-9]` | 응답 스키마 정의 |
| 5 | `GET /account/campaign` 응답(`CampaignListItemV3Response`)에 화면 열(캠페인명·상품 유형·세부 상품·진행 상태·담당 여부)을 채울 값이 없거나 뜻이 불명확함. **v2도 이 값을 계산·매핑하지 않았음**(v2 할당 모달은 `productName`·`serviceName` 문자열을 그대로 출력하고 `matchStatus`·`postingStatus`·`shopStatus`·`serviceIdx`는 읽지 않음). 확인할 것: ① 상품 유형(모집형/PICK형)·세부 상품(브랜드형/공구형)을 알 수 있는 필드와 값 목록(`serviceName` 예시가 "베이직형"), ② "진행 완료/대기중/진행중"의 정의와 판별 값(`startDate`·`endDate`는 모집 기간이라 캠페인 진행과 같은 뜻인지 불명), ③ 값은 표시명이 아니라 **코드(enum)**로(권한 키 6개도 같음, 임시 코드값이 `use-code-label.ts`에 있음), ④ 전체 조회 방법(v2는 `size=10` + 페이지, 기본 `size`는 5이고 상한 불명), ⑤ 정렬(최신순) 기준, ⑥ `location`·`serviceIdx` 파라미터에 이 화면이 보낼 값 `[B-3 일부, B-6]` | 위 6가지 답변과 응답 필드 보완. 진행 상태는 서버가 계산한 단일 코드를 권장 |
| 6 | 회원 탈퇴 `PUT /exit` 성공 뒤 서버가 세션을 무효화하는지(프론트가 `GET /logout`을 따로 불러야 하는지), 응답 `message` 값. `transfer` 없이 단독으로 동작하는 것은 결정됨. 프론트는 v2처럼 `GET /logout`을 불러 정리하되 실패해도 로그인 화면으로 이동. 실제 Stage 호출은 계정이 탈퇴되므로 확인 전 `[B-11]` | 동작과 응답 값 명시, 테스트용 계정 또는 탈퇴 취소 방법 |
| 7 | 요청 스키마에 필수 표시(`required`) 없음: `UserBankInformation`, `BizMoneySearchRequest` `[B-9]` | 필수 필드 표시 |
| 8 | **아직 없는 API(§3)**: Sub ID 목록·검색(`accountIdx`를 얻을 수 없어 권한·캠페인 할당·삭제도 못 연결), Sub ID 권한 조회·저장(권한 6개 + 고정 키), **Sub 본인 정보 조회**, 알림 동의 조회·변경(광고성·야간 × 알림톡·푸시, 변경 때 수신 동의·철회 일자를 응답으로 받아 토스트에 씀). 프론트는 지금 이 4곳을 목으로 그림 `[B-3, B-8]`. Sub 본인 정보는 `GET /master`가 SUB 403이고, Sub 토큰으로 되는 `GET /profile`(2026-10-22 Stage 확인: `identity`·`userId`·`profileUrl`·`nickname`·`snsPlatform`)에는 **아이디만 쓸 수 있음**: `nickname`이 담당자명(실명)이 아니라 "빅버드_광고주_일반회원" 같은 닉네임이고 **담당자명(본인인증 실명)·휴대폰 번호·이메일·가입일이 없음**. 세션(`/sec`)에도 가입일·휴대폰은 없음 | 공개 일정. Sub 본인 조회에 담당자명·휴대폰·이메일·가입일 포함(`GET /master`의 `user` 필드와 같은 구성 권장) |
| 9 | Sub ID 생성(`POST /sub`)이 프로필 이미지를 받지 않고, `POST /sub/profile`은 로그인한 Sub 본인만 가능해 Master가 만들 때 이미지를 올릴 수 없음 `[B-7]` | 생성 때 이미지를 받거나 Master용 업로드 경로 제공 |
| 10 | **통장 사본의 파일명을 조회로 알 수 없음.** 사업자 등록증·통신판매업 신고증은 `GET /master`가 `companyRegistrationFileName`·`mailorderBusinessFileName`을 줘 해결됨(2026-10-22 Swagger). 통장 사본은 `GET /master`의 `bankBookFileNum`(번호뿐)과 `GET /bank`의 `isExistsBankBookFile`(true/false)만 있고 파일명이 없음. 사업자 등록증·통신판매업 신고증을 내려받는 API도 없음(통장 사본 `GET /bank/download`만 있음). 화면은 "파일명.확장자"를 보이길 원함 `[P-5]` | 통장 사본 파일명 필드 추가(`GET /master`의 `bankBookFileName` 또는 `GET /bank`). 필요하면 서류 다운로드 API |
| 11 | **Sub ID 프로필 이미지 조회는 `GET /profile`로 해결**(2026-10-22 Stage, Sub 토큰 200·`profileUrl` 반환, 프론트가 호출함). 남은 것: 이미지 삭제 `DELETE /sub/profile`·`/profile`을 화면에서 쓸지는 시안 없음 `[B-8]` | 없음(답 오면 이 행 삭제) |
| 12 | **간편 로그인 연동·해제와 페이스북(v3 필수, 사용자 결정 2026-10-21).** 연동 상태는 `GET /master`의 SNS별 `id*`·`email*`로 읽지만 등록·해제 API가 없음. v2·v3 앱 모두 페이스북 OAuth가 없음(v2 연동 4개, v3 로그인 4개). 필요한 것: ① 페이스북 앱 ID와 콜백 주소 등록(다른 제공자처럼 `/auth/facebook`이면 제공자 콘솔에 등록), ② 제공자별 연동 등록·해제 API와 인증 뒤 돌아오는 경로·결과 값(결과 토스트에 씀, 문구는 스펙 §6에 정함) `[B-10, B-3 일부]` | 위 ①② 공개 일정 |
| 13 | **휴대폰 변경의 KMC 경로.** v2는 메인 서버 `GET /cert/init`(서비스 값 없음)·`GET /cert/decrypte`로 `certIdx`를 받아 인증 직후가 아니라 "수정 완료"에서 `PUT /account/modify {certIdx, email}`을 보냄(중복 번호 응답 `same`·`exist`). v3 회원가입은 member 서버 `/cert/init/client`·`/cert/decrypte/1`(`same`·`exists`)이라, 회원가입 쪽에서 받은 `certIdx`를 `PUT /v3/mypage/account/modify`가 받는지 알 수 없음. 콜백(`window.cert_result`)과 수신 라우트(`/cert/success`)는 같음. Sub ID는 `PUT /sub/phone`이 번호 문자열만 받아 인증을 어떻게 증명하는지 알 수 없음 `[B-12]` | 마이페이지가 쓸 KMC 초기화·결과 경로와 `certIdx` 연결 방식, Sub의 인증 증명 방식 |

| 14 | **`profileUrl`의 이미지 주소가 열리지 않음(2026-10-22 확정).** Stage `GET /profile`이 준 `https://stage.image.bigbird.co.kr/assets/2026-10/….png`(방금 업로드한 이미지)가 브라우저와 서버 양쪽에서 약 10초 뒤 **504 Gateway Timeout**. DNS는 풀리고(`43.202.118.81`) 응답이 게이트웨이에서 막힘. 이전에 받은 `https://static.sspicc.co.kr/assets/2024-11/….png`(SNS 연동 계정의 기존 이미지로 보임)는 DNS 자체가 `NXDOMAIN`이라 열리지 않음. 업로드(POST·PATCH)는 200으로 성공하므로 저장은 되나 표시할 수 없음 `[B-8 일부]` | Stage 이미지 서버(`stage.image.bigbird.co.kr`)의 504 원인 확인(업로드한 파일 서빙 경로), 기존 `static.sspicc.co.kr` 주소가 계속 유효한지 |
