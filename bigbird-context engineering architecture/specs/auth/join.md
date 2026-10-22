# 광고주 회원가입 (join)

## 목적

광고주 담당자가 KMC(PASS) 휴대폰 본인인증 → 계정(아이디/비밀번호) → 회사 정보(이메일·사업자 서류) → 약관 동의 순으로 가입을 신청한다. 가입 직후 로그인되지 않고 **운영 승인 대기**(승인 시 문자 안내)이며 `/welcome`에서 이를 알린다.

- 일반 가입: 로그인 화면 링크(`/join?service=client`) → `/join` → 본인인증 → info → company → terms → `/welcome`.
- SNS 가입: 소셜 로그인 결과가 "미연동"이면 `/sns-link`로 가고, 거기서 "회원가입"을 누르면 `navigate(ROUTES.join, { state: { tokenData } })`. 가입 성공 후 SNS 계정을 새 userIdx에 연동한다.
- 모바일 본인인증은 `/cert`가 페이지 전체를 KMC로 POST 제출한다. `/cert/success`는 KMC 팝업 복귀 지점이다.

## URL 계약

| 경로            | 비고                                                                                                       |
| --------------- | ---------------------------------------------------------------------------------------------------------- |
| `/join`         | 라우트 가드 없음. 로그인 상태 차단 로직 없음                                                               |
| `/welcome`      | 가입 여부 확인 없이 직접 접근 가능                                                                         |
| `/cert`         | 모바일 KMC 제출용                                                                                          |
| `/cert/success` | KMC가 `tr_url`로 복귀시키는 주소(쿼리 `rec_cert`, `certNum`). 백엔드가 만든 값이므로 경로 변경 시 백엔드와 함께 수정 |

- 구 앱의 `/client/join`은 `/join`으로 통일하고 제거했다(리다이렉트 없음, 이전 링크는 404).
- 단계 전환은 URL이 아니라 스토어 상태다. 새로고침하면 본인인증 단계부터 초기화된다(location state의 tokenData만 재시드될 수 있다).
- 모든 단계의 뒤로가기 화살표는 로그인(`/login`)으로 나간다(이전 단계로 안 돌아감). 약관 상세 뷰의 뒤로가기만 목록으로 복귀한다.
- 진행 막대: cert 1/5, info 2/5, company 3/5, terms 4/5 (5/5 = `/welcome`).
- `features/join`은 `features/social-login`을 import할 수 없어서 `JoinPage`가 `socialLink`를 `onLinkSocial` prop으로 주입한다.
- 스토어는 `JoinStoreProvider`가 마운트당 1개 생성한다(전역 싱글턴 아님). `tokenData`는 마운트 시 1회만 시드된다.

## 단계 게이팅

- `certIdx === null`이면 본인인증 단계만 렌더된다.
- info → company: id·pw·pw확인 입력 && 아이디 중복확인 통과 && 클라이언트 비밀번호 규칙 통과 && 확인 일치. 이후 **서버 `/valid/pw`를 통과해야** 넘어간다.
- company → terms: 회사명 && 담당자 연락처 && **사업자등록증 업로드 완료** && 사업자등록번호 && 이메일 && 이메일 중복확인 통과. 사업자등록번호는 10자리 검증이 없고 입력만 숫자 10자로 자른다. 통신판매 번호·신고증·분류·URL은 선택.
- terms 제출: 두 약관 모두 동의 && `certIdx !== null`. payload 빌더도 certIdx가 null이면 `null`을 반환한다(이중 방어).
- 개발 편의: `import.meta.env.DEV`에서만 "[DEV] 본인인증 건너뛰기"와 단계별 "[DEV] 다음 단계로 건너뛰기"가 보인다. 프로덕션에는 없다.

## 서버 계약

모든 호출은 `memberApi`. 응답은 Zod로 `parse`하며, 형태가 다르면 throw하고 호출자는 이를 에러로 취급한다. OpenAPI 명세 위치는 미정(PRD 3절).

| 용도           | 요청                                                         | 응답 / 비고                                                                  |
| -------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| 아이디 중복    | `POST /check/id/1` `{id}`                                    | `{result:number}`, `> 0`이면 중복                                            |
| 이메일 중복    | `POST /check/email/1` `{email}`                              | 동일                                                                         |
| 비밀번호 검증  | `POST /valid/pw` `{id,password,certIdx}`                     | `{result:boolean, reason?}`                                                  |
| 인증 초기화    | `GET /cert/init/{client\|mobile}`                            | `{trCert,trUrl,trAdd}`. 팝업은 `client`, 모바일 `/cert`는 `mobile`           |
| 인증 복호화    | `GET /cert/decrypte/1?rec_cert=&certNum=`                    | `{result?, message?, certIdx?, phoneNumber?, name?}` 모두 optional           |
| 파일 업로드    | `POST /file/upload/{companyRegistration\|mailorderBusiness}` | multipart, 필드명 **`multipartFile`**, 응답 미사용                           |
| 가입           | `POST /join/1`                                               | `{result:string, userIdx?:number}`                                           |
| 카테고리       | `GET /campaign/category`                                     | `{category:{id,name}[]}`, 세션당 1회 캐시, 실패 시 빈 목록(에러 표시 없음)   |
| SNS 연동       | `PUT {SOCIAL_LINK_PATH}/{platform}/{userIdx}` `{platform,email,uid}` | `serverApi` 사용                                                     |

### 가입 payload

`{ id, pw, certIdx, email, termsAgreed, personalInformationCollectionAgreed, companyName, contact, companyRegistrationNumber, mailorderBusinessNumber: string|null, classification: number|null, companyUrl: string|null }`

- `mailorderBusinessNumber`: 년 정확히 4자리 && 일련 2~5자리가 아니면 `null`. 지역이 한글이 아니면 빈 지역으로 취급 → `YYYY-일련`, 한글 지역 1~4자 → `YYYY-지역-일련`, 5자 이상이면 `null`. 지역이 빈 신고번호가 실제로 존재하므로 생략 형태도 허용한다.
- `companyUrl`: 비었거나 형식 검증 실패면 에러 없이 `null`로 버린다. 통과 시 50자 절단, `http` 미포함이면 `http://` 접두.
- 업로드한 파일은 payload에 포함되지 않는다(서버가 세션/계정에 묶어 둔다고 가정, 연결 방식은 미정).

### 중복확인

- 아이디: **blur 시** 검사. 순서는 빈값 → 형식(`/^[A-Za-z0-9_.]{6,20}$/`) → 금지어(admin/concepters/samsung, 대소문자 무시 부분일치, 서버 호출 없이 중복 처리) → 서버 호출. 값이 바뀌면 상태를 초기화한다.
- 이메일: 형식이 맞으면 변경 후 300ms 디바운스 뒤 검사. blur 시 타이머를 취소하고 이미 확인된 값이면 재호출하지 않는다. 이메일은 회사 단계에서 입력하며 SNS 이메일과 무관하다. 도메인 TLD는 2~3자 영문만 허용해 `.info` 등 4자 이상은 거부된다.
- 호출 실패·스키마 불일치는 필드 에러 메시지를 보이고 상태는 `idle` 유지(다음 단계 비활성).

### 비밀번호

- 클라이언트: 8~20자, 숫자·영문·특수문자(`!@#$%&^/*-+=?_{}()[]`) 각 1+, 아이디 포함 불가, 같은 문자 4연속 또는 4연속 증감 불가.
- 클라이언트 검증은 최종이 아니다. 서버가 id·개인정보와 재검사한다. `{result:false, reason}` 또는 HTTP 에러 본문의 `{reason}`을 매핑한다.
  - `"contains id"` → "아이디를 포함한 비밀번호 불가"
  - `"contains personal info"` → "개인정보 포함한 비밀번호 불가"
  - 그 외/없음 → "비밀번호를 변경할 수 없습니다 조건을 다시 한번더 확인해주세요"
- 서버에 새 reason이 추가되면 `entities/account/model/join-validation.ts`에 매핑을 추가한다(그 전엔 일반 메시지).

### KMC 본인인증

공통: KMC URL `https://www.kmcert.com/kmcis/web/kmcisReq.jsp`, 폼 필드명 `tr_cert`/`tr_url`/`tr_add`(KMC 계약). KMC는 GET이 불가해 항상 POST 폼으로 제출한다.

데스크톱(팝업):

1. `/cert/init/client` 호출. **실패하면** 서버 메시지를 인증 단계에 표시하고 팝업을 열지 않는다.
2. 팝업 `window.open("", "KMCISWindow", "width=396, height=643, resizable=0, scrollbars=no, status=0, titlebar=0, toolbar=0, left=435, top=250")`. 차단되면 "팝업이 차단되었습니다 / 브라우저에서 팝업 차단을 해제한 뒤 다시 시도해 주세요." 알림.
3. 인증 후 팝업이 `/cert/success?rec_cert=…&certNum=…`로 복귀하고, `CertSuccessPage`가 `window.opener.cert_result({rec_cert, certNum})`을 호출한 뒤 `window.close()`한다. `rec_cert`는 KMC 이름이라 변경 불가. `window.cert_result`는 훅이 mount 시 등록, unmount 시 삭제한다.
4. 부모가 복호화를 호출해 분기한다.
   - 호출 에러 → fail, 응답 본문 `{message}`(없으면 빈 문자열)
   - `result`가 `"fail"` 또는 `false` → fail, `data.message`
   - `result`가 `"same"` 또는 `"exists"` → "이미 가입된 정보입니다"
   - 그 외 → success. 주의: `certIdx`가 응답에 없으면 `null`이 저장되어 단계가 넘어가지 않는다(별도 에러 UI 없음).
   - fail 문구: 서버 메시지, 없으면 "인증 중 오류가 발생했습니다".
5. 재시도 시 이전 결과 문구는 초기화되지 않아 새 시도 결과가 나올 때까지 남는다. 사용자가 팝업을 그냥 닫아도 아무 이벤트가 없다(타임아웃·상태 갱신 없음).

모바일(`/cert`): init 1회 호출 후 약 1초(DOM 반영 대기) 뒤 페이지 자체를 KMC로 form 제출한다(`tr_add` 기본 `"Y"`). 이유는 모바일에서 팝업이 자주 막히기 때문이다. init 실패 시 재시도 없이 빈 화면이 되고 에러 UI도 없다.

### 파일 업로드

- 클라이언트 검사(전송 전): 확장자 `jpg,gif,png,bmp,jpeg,pdf`(소문자 비교) 아니면 "이미지 또는 PDF 파일만 선택할 수 있습니다", 용량 초과면 "파일 용량은 5MB 이하만 업로드 가능합니다", 업로드 실패 시 "파일업로드 오류가 발생하였습니다".
- 용량 기준은 `megabytes > 5`이고 **MB를 반올림한 값**이라 5.4MB는 통과, 5.5MB 이상부터 차단된다. 구 앱 동작을 유지한 것으로 추정되며 서버 한도와의 정합은 미정.
- 실패·검증 오류는 이전 업로드 상태를 되돌리지 않는다(이미 성공한 파일이 있으면 유지, 에러 문구만 표시).
- input `value`를 초기화하지 않아 같은 파일을 연속 선택하면 `change`가 발생하지 않을 수 있다.
- 사업자등록증만 필수, 통신판매 신고증은 선택.

### 가입 제출

- 실패 판정: 호출 에러(스키마 불일치 포함) 또는 `result !== "success"` 또는 `userIdx` 없음 → "가입 실패하였습니다"(서버 메시지는 표시하지 않음).
- 성공 후 tokenData가 있으면 SNS 연동을 호출하되 실패는 삼키고 가입은 성공 처리한다(나중에 계정 화면에서 연동 가능). 그 뒤 `/welcome`으로 이동.

## 동작 결정 · 엣지 케이스

- **SNS tokenData**: `location.state.tokenData`를 `{platform,email,uid}`(모두 필수 string)로 `safeParse`하고, 아니거나 없으면 일반 가입이 된다. `uid/email`이 없는 소셜 payload는 스키마 불일치로 일반 가입이 되어 연동이 누락된다. tokenData는 UI에 노출되지 않는다.
- **담당자 연락처**: 숫자만 11자, 기본값은 인증 휴대폰 번호.
- **통신판매 번호**(연도 4자 / 지역 / 일련 5자): 지역은 한글만 남기고 4자 절단. 안내 문구 "한글이 있는 경우만 한글 기입".
- **한글 조합 입력**: 지역 칸은 조합 중(`isComposing`)에는 필터 없이 원본을 저장하고(자모를 지우면 조합이 끊김), `compositionend`에서 필터링해 확정한다. 자모가 남은 채 제출하면 지역은 빈 것으로 처리된다.
- **회사 URL**: blur 시 형식 실패면 "올바른 URL 형식이 아닙니다."(제출은 막지 않고 payload에서 `null`). 허용 TLD 목록이 제한적(`asia|biz|cc|cn|com|de|eu|in|info|jobs|jp|kr|mobi|mx|name|net|nz|org|travel|tv|tw|uk|us`)이라 `.io`, `.co.kr` 등은 통과하지 못할 수 있다.
- **약관**: 전체 동의는 두 항목을 함께 토글한다. "보기" → 본문 → "동의하기"로 해당 항목이 `true`가 된다. 본문은 `entities/terms`를 쓴다(`specs/auth/terms.md` 참조).
- **카테고리**: 목록 로드 실패해도 가입 가능. 한 번 고르면 선택을 해제할 방법이 없다.
- **`/welcome`**: "BIGBIRD 둘러보기"는 `https://bigbird.co.kr/`을 새 창으로 연다.

## v2 대비 변경

v2 위치(읽기 전용 참고): `app/routes/join/*`, `app/routes/{cert,cert.success,welcome}/route.tsx`, `app/entities/auth/join-api.ts`.

- 폼 상태를 `useReducer` + Context에서 Zustand 스토어(마운트당 1개, selector 구독)로 바꿨다. 상태 규약 준수, 입력 시 리렌더 축소, 방문 간 격리가 이유다. `setTokenData` 액션은 제거하고 시드 1회만 한다.
- SNS 연동은 v2에서 `JoinTermsStep`이 직접 import했으나, FSD 슬라이스 격리 때문에 `onLinkSocial` prop 주입으로 바꿨다.
- `certInit` 실패를 v2는 처리하지 않았다(unhandled). 이제는 서버 메시지를 표시하고 종료해 사용자가 무반응이 되는 것을 막는다.
- `CertPage`는 `useEffect` + `document.forms`에서 `useSWRImmutable` + ref 폼으로 바꿨다. 실패 시 UI가 없는 점은 동일하다.
- `KMC_CERT_URL`은 v2에서 두 파일에 중복 정의됐으나 `features/join` Public API로 공개해 한 곳으로 모았다(`pages/cert`가 내부 import 불가).
- `tokenData` 읽기는 타입 캐스트 대신 Zod `safeParse`로 바꿔 잘못된 state를 일반 가입으로 처리한다.
- 검증·메시지는 `entities/account`, 약관은 `entities/terms`, 나머지는 `features/join`으로 분리했다.
- 동일하게 유지: 5단계 progress, 서버 계약(엔드포인트·필드명·`rec_cert`·`multipartFile`), 팝업 옵션 문자열, 5MB/확장자 규칙, 한글 조합 처리, 가입 실패 문구.

## 다국어

- namespace: `pages/join`, `features/join`. 검증 문구는 `entities/account`가 코드(`getPasswordError`, `mapValidPasswordError`, `CheckStatus`)만 돌려주고 `features/join`이 `t()`로 만든다. 중복확인 안내는 필드별 키(`info.idStatus.*`, `company.emailStatus.*`)로 둔다(조사·어순 때문에 필드명을 끼워 넣지 않음).
- 약관 본문은 `entities/terms`의 현재 언어 번역본을 보여 준다(`specs/auth/terms.md`). 약관 항목 라벨·제목은 `features/join` 번역이다.
- 통신판매 신고번호 지역 칸은 한국 신고번호 형식이라 언어와 무관하게 한글만 받는다(`NOT_HANGUL_PATTERN`). 안내 문구만 번역한다.
- `[DEV]` 버튼 문구도 키로 두었다(개발 환경 전용).

### 백엔드 번역 요청

서버 번역이 준비되기 전에는 서버가 준 값을 그대로 표시한다.

| 필드·코드값 | 한국어 표시 | 사용 화면 | 비고 |
| :-- | :-- | :-- | :-- |
| `GET /campaign/category` → `category[].name` | 서버가 준 이름(예: 대분류명) | 가입 2단계 "회사 분류" 목록 | 언어별 이름 제공 방식(요청 언어 헤더, 언어별 필드 등) 확인 필요 |
| `GET /cert/init/*` 실패 본문 `message`, `GET /cert/decrypte/1`의 `message` | 서버 원문 | 가입 1단계 본인인증 실패 안내 | 서버 원문이 화면에 그대로 나온다. 원문이 없을 때만 번역된 기본 문구(`cert.failFallback`). 에러 코드로 바꿔 줄 수 있는지 확인 필요 |

## 범위 밖 · 미해결

범위 밖: 로그인·SNS 로그인/연동 화면, 아이디/비밀번호 찾기, 승인 심사/운영 도구, 인플루언서 가입(PRD상 제외), 약관 편집 도구.

미정:

- 모바일 `/cert` 진입 경로(이 저장소에는 `ROUTES.cert`로 이동하는 곳이 없음)와, opener가 없을 때 인증 결과가 `JoinWizard`로 전달되는 방식. 현재 `CertSuccessPage`는 opener가 없으면 `window.close()`만 시도한다.
- 서버 파일 업로드와 가입 계정의 연결 방식, 서버측 파일 크기 한도.
- 사업자등록번호 유효성(체크섬/자릿수), 중복 가입 사업자 처리.
- OpenAPI 명세 위치(PRD 3절), 가입 실패 시 서버 오류 코드별 문구.
- 접근성/지원 브라우저 기준, 로그인 상태에서 `/join` 접근 시 동작, `/welcome` 직접 접근 차단 여부.
- 새로고침 시 입력 복구(현재는 초기화), location state tokenData의 저장 정책.
- 약관 개정 이력/버전 노출.
