# 마이페이지 API 검토

> V3 Swagger `V3-마이페이지` 그룹(Stage)에서 **Swagger만 봐서는 놓치기 쉬운 점, 아직 없는 API, 백엔드에 넘긴 질문**만 적습니다. 엔드포인트·필드·응답 형태의 원본은 Swagger이고 Zod 스키마는 Swagger 필드로 만듭니다.
> Swagger JSON `https://api.stage.client.bigbird.co.kr:38443/v3/api-docs/V3-마이페이지`(UI `/swagger-ui/index.html?urls.primaryName=V3-마이페이지`).
> 화면 결정은 `specs/mypage/account.md`·`subscribe.md`·`money.md`. 구독 API(`/v3/mypage/subscription/…`)의 계약은 [subscribe.md](../specs/mypage/subscribe.md) §7에 있습니다.

## 1. 공개 범위

계정 설정·Sub ID·알림 설정·간편 로그인·빅버드 머니 화면에 필요한 API는 모두 공개됐고 대부분 v2 API를 재사용합니다. 없는 것은 구독 이용요약뿐입니다(§3). Stage에는 충전 건을 입금 완료로 바꾸는 테스트 입금 API가 있어 개발용 버튼으로만 씁니다.

## 2. 구현할 때 주의할 점

### 계정 설정

- **응답 형태가 두 가지입니다.** 비밀번호·프로필·Sub ID·Master 조회·알림 설정은 HTTP 상태 + `V3ErrorResponse {result:false, reason}`이고, 업로드·계좌는 **HTTP 200**에 `result`/`reason`으로만 성공·실패를 구분합니다. 업로드도 용량 초과(파일당 500MB)만은 400 `{reason:"max upload size error"}`입니다.
- **중복확인(`POST /check/{type}`)은 `result: false`가 사용 가능, `true`가 이미 사용 중**입니다. `result`가 없거나 null이면 사용 가능으로 읽지 않습니다. `type=pw`는 반대로 `true`가 현재 비밀번호 일치입니다.
- **`PUT /modify`는 이메일을 비워 보내면 기존 이메일이 지워집니다.** 휴대폰 인증만 바꿀 때도 현재 이메일을 함께 보냅니다. Sub ID는 이 API를 못 쓰고(403) `PUT /sub/{type}`(`phone`·`email`·`pw`)을 씁니다.
- **회사정보 수정(PUT)은 전체 덮어쓰기**라 항상 전체 필드를 보냅니다. 등록(POST)만 필수값을 검증합니다. API 이름은 `extra`→`company`, `/master` 응답 키는 `extraInformation`→`companyInformation`으로 바뀌었습니다.
- **업로드는 회사정보가 먼저 등록돼 있어야** 됩니다(`extra information is not found`). 서버가 받는 형식은 pdf·tiff·png·jpeg·jpg·bmp·heic이고 화면은 JPG·PNG·PDF 10MB로 더 좁게 막습니다.
- **서류 다운로드**: 통장 사본 `GET /account/bank/download`, 사업자 등록증 `GET /account/company/registration/download`, 통신판매업 신고증 `GET /account/company/mailorder/download`. 응답 헤더(`Content-Type`·`Content-Disposition`)는 Stage에서 확인하지 못해 blob으로 받고 파일 이름을 대체 순서로 정합니다. 파일이 없으면 404.
- **계좌 등록의 정산 기간 거부가 `{result:true, reason:"denied"}`**입니다. `reason`도 확인합니다. 그 밖의 실패는 `{result:false}`만 오고 사유가 없습니다.
- **계좌 조회의 은행은 이름**으로 옵니다. 은행 목록에서 이름으로 `bankIdx`를 찾습니다. 통장 사본 파일명은 `bankBookFileName`(옛 등록분은 없음).
- Master 정보 조회는 **Sub ID면 403**입니다. 담당자명은 `certification.name`, 가입일은 `user.created`. 간편 로그인 상태는 이 응답이 아니라 `GET /account/sns`로 읽습니다.
- 프로필 이미지는 Master `/profile`, **Sub 본인 `/sub/profile`**(서로 상대 경로는 403). 등록·수정·삭제가 POST·PATCH·DELETE이고 없는 상태의 PATCH·DELETE는 404입니다.
- 회사 분류는 **최상위 목록 API만** 씁니다(하위 분류 API 안 씀).
- 회원 탈퇴는 `POST /check/pw` 뒤 `PUT /exit`(응답 `{result, message}`)입니다. v2가 둘 사이에 부르던 `POST /transfer/false`(2020년 서비스 이관 거부 기록)는 v3에서 필요 없습니다.
- **알림 설정 수정(`PUT /agreement`)은 부분 수정**이고 응답은 전체 4개 값입니다. 최초 조회면 서버가 4개 모두 `true`로 만듭니다. 응답에 동의·철회 일자가 없습니다.

### Sub ID

- **생성(`POST /sub`)은 multipart**(JSON 파트 `request` + 선택 파트 `profileImage`)이고 `phone`은 받지 않습니다. **이미지 저장만 실패해도 계정은 만들어집니다**(400 `이미지 파일만 업로드할 수 있습니다.`·`파일 업로드 도중 예외가 발생하였습니다.`, 롤백 없음). 프론트는 이 둘을 생성 성공으로 처리합니다(다시 보내면 `existing id`). 용량 초과는 계정이 만들어지지 않습니다.
- **Master의 Sub 정보 수정은 `PATCH /sub/{accountIdx}`**(multipart `request` + `profileImage`, 바뀐 필드만). 아이디 중복은 400 `existing id`, 아이디·비밀번호를 바꾸면 그 Sub는 서버에서 로그아웃됩니다. 담당자명 수정은 Master용에만 있습니다.
- **목록(`GET /sub`)은 `size` 기본값이 3**이라 8을 명시합니다. 검색은 `searchType` 없이 `keyword` 하나(아이디·담당자명·이메일·휴대폰 부분 일치). 응답 `sub[].userIdx`는 항상 null입니다.
- **본인 정보는 `GET /sub/self`**(SUB 전용): 아이디·담당자명(`name`)·이메일·휴대폰·`profileImageUrl`·생성일 `created`(`yyyy-MM-dd HH:mm`). **Sub 이미지는 여기서 읽고 `GET /profile`은 부르지 않습니다**(`/profile`은 세션의 회사 기준이라 Sub 토큰에도 Master 이미지가 옴).
- **권한(`GET /authorization/{accountIdx}`·`PUT /authorization`)은 권한별 boolean 6개**(`isCampaignAccess`·`isInfluencerMatchingAccess`·`isInfluencerMarketAccess`·`isCommerceAccess`·`isBigbirdMoneyAccess`·`isPurchaserQuestionAccess`)입니다. `PUT`은 바꾼 필드만(하나도 없으면 400) 보내고 바뀐 뒤 전체 값을 돌려줘 그대로 캐시로 씁니다. 권한 레코드가 없는 Sub는 404 `access menu not found`(§4-8). LNB 메뉴 권한은 세션 `GET /v3/sec`(V2 `/sec`와 같은 키 + 메뉴 권한 6개)에서 읽습니다.

### 빅버드 머니(`/bigbird-money`)

잔액 `GET`, 충전/출금 내역 `POST /charge`, 사용 내역 `POST /usage`, 충전 초기 데이터 `GET /init`은 v2 `/biz/*` 재사용이고, 사용 내역 필터 선택지 `GET /usage/filter-options`와 출금 `POST /withdraw`는 v3 신규입니다. 화면에 필요한데 없는 API·필드·오류 형태는 [빅버드 머니 API 요구 명세](https://claude.ai/artifact/5qtCtjfY7hqEaigyv3xJk7)에 모았습니다.

- **권한**: 빅버드 머니 권한이 없는 Sub ID는 충전 내역·사용 내역·`init`·출금이 403입니다. 잔액 `GET`은 헤더 표시용이라 막지 않습니다.
- **잔액 `GET`**: `{bigbirdMoney, withdrawable, withdrawUnavailableReason}`(금액은 원 단위 정수, 옛 `bizMoney`·`name`·`companyName`은 없어짐). 사유는 `ZERO_BALANCE`·`PENDING_WITHDRAWAL`이고 출금 409와 같은 기준입니다. 프론트는 `withdrawable`로 버튼만 막고 사유는 쓰지 않습니다.
- **충전/출금 내역 `POST /charge`**: 충전·출금 건을 요청 일시 최신순 한 목록으로 줍니다. 요청 `page`·`entrySize`(10·20·50)·`type`(`CHARGE`·`WITHDRAWAL`)·`startDate`·`endDate`(`yyyy-MM-dd`, 양 끝 포함)·`status`, 조건은 AND, 검색어 없음. 항목 키는 `{id, type}`(번호가 겹칠 수 있음). `status`는 `PENDING`·`DEPOSIT_COMPLETED`·`DEPOSIT_EXPIRED`(입금 기한이 지난 미입금)·`WITHDRAWAL_COMPLETED`. `amount`는 부호 없는 양수이고 미입금 취소 건도 요청 금액. `payMethod`는 `VBANK`·`VCARD` 등(출금은 null), `holderName`은 충전 입금자 명 / 출금 예금주 명, `receiptUrl`은 이니시스 호스팅(출금은 null). 값이 없으면 null. 오류 400 `INVALID_PAGE`·`INVALID_FILTER`·`INVALID_DATE_RANGE`. 승인 일자 필드와 상세 조회 API는 두지 않기로 했습니다.
- **사용 내역 `POST /usage`**: 사용·환급·충전·출금 건이 한 목록(완료된 충전, 처리된 출금만). 요청 `page`·`entrySize`·`type`·`startDate`·`endDate`·`campaignIdx`·`usageDetailCode`(AND)·`keyword`(캠페인 명·캠페인 코드·사용 내역 문구 부분 일치, 대소문자 무시, 최대 100자, 넘으면 400 `INVALID_FILTER`). 항목 `id`(예 `BC-12345678901234`)는 충전·출금까지 고유합니다(Q-7). `type`은 `USE`·`REFUND`·`CHARGE`·`WITHDRAWAL`(옛 "환불"은 `WITHDRAWAL`, Q-9), `campaignType`은 `recruit`·`pick`, `usageDetailCode`는 4가지이고 옛 건·충전·출금은 `null` + `usageDetailName`(서버 문구). `usageAmount`는 부호가 있고 충전·출금은 캠페인 값이 모두 null. `mainImageUrl`은 공구샵이 없는 캠페인이면 null. `contractTarget`(`{name, influencerId}`, 한 명, PICK형은 대상마다 행이 따로)은 **연결 데이터가 없어 지금 항상 null**입니다.
- **사용 내역 필터 선택지** `GET /usage/filter-options`: `campaigns[{campaignIdx, campaignName}]`, `usageDetails[{code, name}]`. 사용 내역 옵션 값은 서버 `code`(요청 `usageDetailCode`에 그대로).
- **충전 요청은 V3가 프록시하지 않습니다.** `GET /init`의 `encryptUserIdx`로 결제 서버 `bigbird-pay-be`의 `POST /v3/mypage/bigbird-money/pay`를 프론트가 직접 부릅니다(`isSSPayFlag: false` 필수, `paymentMethodType: "BIZ"`, 금액 10만~1억 원 1원 단위). `deviceType`으로 응답이 갈립니다: **PC**는 이니시스 표준결제 폼 값(가공 없이 `INIStdPay.pay()`에 넘김, `closeUrl` 보냄), **MOBILE**은 `closeUrl` 없이 보내면 `{ paymentUrl, form }`(모바일 폼 값 `P_*`)을 주고 프론트가 **EUC-KR**로 같은 창 POST. 복귀 쿼리는 `isPaid=true&gopaymethod&goodName` 또는 `isPaid=false&code=PAYMENT_FAILED|USER_CANCELED`. Swagger `init` 설명은 아직 옛 `POST /client/pay` 기준입니다.
- **출금 `POST /withdraw`**: 보유 잔액 **전액**, **multipart**. JSON 파트 `request`(`bankIdx`(`GET /account/bank/list`의 `idx`)·`accountNumber`(숫자만)·`accountHolder`·`amount`(화면에 보여 준 잔액)) + **필수 파일 파트 `bankBook`**. 응답 `{id, requestDate, amount, status:"PENDING", balance}`. **잔액은 요청 때가 아니라 운영자가 처리할 때 빠집니다**(응답 `balance`도 요청 전과 같음). 오류 `reason`: 400 `INVALID_BANK`·`INVALID_ACCOUNT_NUMBER`·`INVALID_ACCOUNT_HOLDER`·`BANK_BOOK_REQUIRED`·`INVALID_BANK_BOOK_FILE`, 409 `ZERO_BALANCE`·`PENDING_WITHDRAWAL_EXISTS`(대기 중 출금·연타)·`BALANCE_CHANGED`(`amount`가 서버 잔액과 다름), 500(통장 사본 업로드 실패 포함). 예금주 일치 검증은 없습니다.

## 3. 아직 없는 API

| 화면 | 필요한 것 | 비고 |
|---|---|---|
| 구독 이용요약 | 이용요약 탭 데이터 | v2에 구독 개념 없음. [subscribe.md](../specs/mypage/subscribe.md) §7 B-1 |

캠페인 배정(`POST·DELETE /assign`)·캠페인 조회(`GET /campaign`)는 공개됐고 유형·상태 값이 있습니다: 상품 유형 `serviceIdx`(PICK형 = 10·14, 나머지 모집형), 세부 상품 `mainServiceIdx`·`mainServiceName`(1 브랜드형, 2·6 공구형 등), 상태 코드 `matchStatusCode`(WAITING·IN_PROGRESS·COMPLETED·FAILED)·`postingStatusCode`(NONE·WAITING·IN_PROGRESS·COMPLETED)·`shopStatusCode`(WAITING·IN_PROGRESS·COMPLETED). 화면의 "진행 상태"가 어느 상태인지 정해지지 않아(§4-5) 캠페인 할당은 목입니다.

## 4. 백엔드 요청

**백엔드에 넘길 질문의 단일 원본입니다.** 답이 오면 행을 지우고 확정 내용은 §2나 스펙 §3에 반영합니다. 스펙 §7의 `B-n` 표는 이 행을 가리키는 포인터와 답 전 처리만 둡니다. 행 번호(`§4-n`)와 행 안의 하위 번호(①②…)는 스펙과 코드 주석이 참조하므로 다시 매기지 않습니다. 기획·정책 질문(P-n)은 스펙에 둡니다.

| # | 내용 | 요청 |
|---|---|---|
| 5 | `GET /account/campaign`(캠페인 할당). ① 화면의 "진행 상태"(진행 완료/대기중/진행중)가 `matchStatusCode`·`postingStatusCode`·`shopStatusCode` 중 무엇인지 또는 조합 규칙, ② 세부 상품을 `mainServiceIdx` 숫자로 판별해도 되는지(공구형이 2·6이고 운영에서 늘 수 있음), ④ 전체 조회 방법(기본 `size` 5, 상한 불명), ⑤ 정렬(최신순) 기준, ⑥ `location` 파라미터에 보낼 값 `[B-3 일부, B-6]` | 답변. 진행 상태·세부 상품은 서버가 계산한 문자 코드 권장 |
| 6 | 회원 탈퇴 `PUT /exit` 성공 뒤 서버가 세션을 무효화하는지(프론트가 `POST /v3/auth/logout`을 따로 불러야 하는지), 응답 `message` 값. Stage 호출은 계정이 탈퇴되므로 확인 전 `[B-11]` | 동작과 응답 값 명시, 테스트용 계정 또는 탈퇴 취소 방법 |
| 8 | ② 권한 레코드가 없는 Sub ID는 404 `access menu not found`. 기존 Sub ID에도 레코드가 다 있는지, 없으면 기본값(권한 없음)으로 만들어 줄 수 있는지(지금 프론트는 권한 자리에 오류 안내) `[B-3 일부]` | 답변 |
| 11 | 프로필 이미지 삭제 `DELETE /sub/profile`·`/profile`을 화면에서 쓸지(시안 없음) `[B-8]` | 시안 확인 후 이 행 삭제 |
| 12 | **간편 로그인 연동·해제.** Master만(Sub 403). `GET /account/sns`는 `{ items: [{ platform, linked, email }] }`를 카카오·네이버·구글·애플 순서로 항상 4개. `POST /account/sns/{platform}`은 인가 코드만: 카카오·구글·애플 `{ code, redirectUri }`, 네이버 `{ code, state }`(`token`이면 400 `INVALID_SNS_CODE`, 코드 누락·만료·재사용·`redirectUri` 불일치도 같은 코드). 서버가 공급자에게 코드를 교환하고 `redirectUri` 허용 목록은 두지 않음(공급자 콘솔 등록값이 유일한 검사). 로그인한 뒤면 `{ snsLinkToken }`만으로도 연결. 같은 계정이 이미 연결돼 있으면 200. 오류: 409 `SNS_ALREADY_LINKED`(다른 계정이 연결됨)·`SNS_LINKED_TO_OTHER_USER`, 400 `SNS_EMAIL_REQUIRED`·`INVALID_PLATFORM`·`INVALID_SNS_TOKEN`(인가 코드 전환 뒤에도 남은 코드인지 확인 대기)·`SNS_PLATFORM_NOT_SUPPORTED`(서버에 앱 설정 없음), 500 `SNS_PROVIDER_ERROR`. `DELETE`는 연결만 지우고(아이디·비밀번호 로그인 유지) 없으면 404 `SNS_NOT_LINKED`. 세 응답 모두 상태 4개를 돌려줌. 페이스북은 연동하지 않음 `[B-10]` | 공급자 콘솔에 환경별 리다이렉트 URI(카카오·네이버 Callback URL·구글) 등록, 애플 Services ID Return URL 등록과 운영 Services ID·서버 설정(지금 운영은 `SNS_PLATFORM_NOT_SUPPORTED`) |
| 13 | **휴대폰 변경의 KMC 경로.** Master는 `GET /v3/auth/cert/init?trUrl=…`(프론트가 현재 출처의 `/cert/success`를 보냄, 허용 도메인만 받고 아니면 400) → KMC 팝업 → `/cert/success`가 오프너의 `window.cert_result` 호출 → v2 `GET /cert/decrypte`로 `certIdx` → "저장"에서 `PUT /v3/mypage/account/modify {certIdx, email}`. ① **KMC에 v3 도메인 등록 필수**: KMC는 요청 페이지의 도메인을 검사함(같은 요청값이 `localhost`에서는 "요청 정보가 유효하지 않습니다.(7-3)", `stage.client.bigbird.co.kr`에서는 정상). v3 Stage·운영 도메인을 KMC 관리자(`https://www.kmcert.com/admin/adminLogin.jsp`)에 등록하고 URL 코드가 바뀌면 서버 설정에 반영, ② member 서버 `/cert/init/{slug}`(회원가입)는 아직 v2 주소를 주는지 확인 전, ③ 모바일 페이지 이동은 프론트가 처리함, ④ `modify`가 decrypte의 `certIdx`를 받는지, 그 `certIdx`가 이 사용자의 것·미사용·유효 시간 안인지와 `certNum`이 init 때 발급한 값인지 검증하는지, ⑤ decrypte `result`가 Swagger에는 `success`·`fail`뿐인데 v2·v3는 `same`·`exist`도 중복으로 처리함. 실제 값과 의미를 Swagger에 추가, ⑥ `PUT /sub/phone {phone}`은 인증 증명이 없어 API만 불러도 번호가 바뀜. `{certIdx}`만 받고 번호는 인증 기록에서 저장하도록 수정 필요(Sub 시안에서 휴대폰 변경이 빠져 시안 유지 시 불필요, §4-20 ③), ⑦ Stage 백엔드는 요청에 `X-Forwarded-For`가 있으면 값과 무관하게 `GET /sec`가 500(로컬 우회 `docs/kmc-local-test.md`는 이 헤더를 뺌) `[B-12]` | ① KMC 설정, ②④⑤ 답변, ⑥ 서버 변경 여부, ⑦ 원인 확인 |
| 14 | **이미지 주소가 열리지 않음.** Stage `https://stage.image.bigbird.co.kr/assets/…`(방금 올린 이미지)가 약 10초 뒤 504 Gateway Timeout(DNS는 풀림). 옛 `https://static.sspicc.co.kr/assets/…`는 DNS `NXDOMAIN`. 업로드(POST·PATCH)는 200이라 저장은 되나 표시할 수 없음 `[B-8]` | 이미지 서버 504 원인, `static.sspicc.co.kr` 주소 유효 여부 |
| 16 | **빅버드 머니 목록.** 요청 원본은 [API 요구 명세](https://claude.ai/artifact/5qtCtjfY7hqEaigyv3xJk7) A-2·A-4·A-6. 남은 것: 계약 대상(`contractTarget`) 데이터 연결(지금 항상 null), 미입금 취소 건 금액(Q-12) | 데이터 연결 |
| 17 | **빅버드 머니 충전(결제 서버)과 출금.** 요청 원본은 명세 A-7·A-8, Q-1~Q-12. 남은 것: ① 결제 서버가 **v2용 도메인으로 배포됨**. v3 도메인(`stage.client`·`stage.biz`)용 배포·라우팅과 `{v3 도메인}{VITE_API_PAY_URL}` 연결(인프라), `returnUrl`을 v3 `origin` 기준으로 만드는 변경, ② 결과 수신(`/pay/result`)의 500(`UnexpectedRollbackException`) 재확인과 오류 때도 `redirectUri`로 복귀, ⑥ 입금 확인 뒤 잔액·상태 반영 시점(화면 안내 "최대 5분"), ⑦ 출금 반려·취소 여부, ⑧ 결제창 안 "취소"가 `USER_CANCELED`로 오는지(지금 `PAYMENT_FAILED`)와 휴대폰 결제 실기기 확인 | 답변. 실제 결제는 Stage에서 미확인 |
| 20 | **Sub ID 본인 정보.** ① 시안은 담당자 명을 수정 모드에서 입력하나 `PUT /sub/{type}`은 `phone`·`email`·`pw`만 받음. 이름 수정 API(예: `type=name`) 필요, ② Sub 시안 PC·TAB 수정 모드에 "회원 탈퇴" 버튼이 있으나 `PUT /exit`는 Master 탈퇴라고만 되어 있어 Sub가 부를 수 있는지·동작 불명, ③ 시안에서 Sub 휴대폰 변경이 빠져 §4-13 ⑥은 시안 유지 시 불필요 `[B-20]` | ①② 답변. 답 전 담당자 명 읽기 전용, Sub 탈퇴 버튼 없음 |
