# 고객센터 (빅버드 문의 · 구매자 문의)

## 목적

광고주가 빅버드 운영자에게 문의하고(빅버드 문의), 공구 구매자의 문의에 답한다(구매자 문의). v2 `/customerservice`(카드 + 모달)를 새 디자인의 **목록 + 대화 (+ 상세 패널)** 화면으로 바꾼다. 실제 데이터(REST + Firestore)로 연동한다.

- 디자인: Figma `k5VBKeB2apb3wb4l4Af3sZ` 고객센터 페이지 `5073:85988`
  - PC 빅버드 문의: `5202:101654`, 새 문의 `5202:111026`, 상담 요청 중 `5202:108035`
  - PC 구매자 문의: `5218:39944`
  - 메시지 편집: `6772:53815`
  - 태블릿·모바일 프레임은 같은 페이지에 `TAB /`, `MO /` 접두사로 있다.
- API 재사용·추가 요청과 디자인 대조 기록: [고객센터 API 문서](../../docs/customer-center-api.md). 2026-10-14 PC 대조 기록과 2026-10-15 새 문의·목록·구매자 대화/상세/필터의 PC·태블릿·모바일 대조를 반영했다. 반응형 전체 상태를 모두 검증한 것은 아니다.
- v2 동작 원본: `bigbird-client-fe/docs/customer-service-handoff.md`(이하 "인계 문서"). v2 동작이 궁금하면 "구버전고객센터" 세션에 묻는다.

### 시나리오

1. **문의 남기기**: 광고주가 "새 문의"에서 캠페인 문의(캠페인 1개 선택) 또는 기타 문의를 고르고, "문의 남기기"로 첫 메시지를 보낸다. 운영자가 나중에 답한다.
2. **실시간 상담**: 같은 폼에서 "실시간 상담하기"를 고르면 "상담 요청 중" 화면이 뜬다. 운영자가 연결하면 Firestore로 실시간 대화를 한다.
3. **구매자 문의**: 광고주가 전체 캠페인의 구매자 문의와 상품 Q&A를 한 목록에서 보고 답한다. 구매자·주문·캠페인 상세 정보는 대화 화면의 기본 구성으로 표시한다. 별도의 사용자 버튼 클릭을 표시 조건으로 두지 않는다.
4. **메시지 편집 (제안, 컨펌 대기)**: 상대가 읽기 전에는 본인 메시지를 수정·삭제할 수 있다. 수정한 메시지에는 "편집됨"이 붙는다.

> **컨펌 대기 표시**: "(제안, 컨펌 대기)"가 붙은 항목은 기획·운영 앱·백엔드 합의 전이다. 컨펌 전에는 구현하지 않는다. 그 밖의 항목은 시안, 요구명세서, 기획 확인에 근거한다.

## 현재 작업 범위: 실시간 상담 (2026-10-19 사용자 확정)

- v2 광고주·v3 광고주·운영 앱이 동시에 동작해야 한다. v2의 새 실시간 문의 요청·메시지 송수신·종료 기능을 유지하며, 필요한 v2·운영 앱 호환 수정은 이번 범위에 포함한다.
- v3 실시간 상담은 Figma 기준으로 구현한다. PC 요청 중 `9298:260487`·실패 `9298:260501`·완료 `9298:260494`, 모바일 요청 중 `9298:262216`·실패 `9298:262220`을 조사에서 확인했다.
- 하드코딩된 연결 대기 시간은 두 광고주 앱 모두 v3 기준 5분으로 맞춘다. 연결 후 무응답 종료는 별도의 3분 정책이다. 시간 통일과 만료 후 동작 통일은 별개이며, v2의 만료 후 종료 유지 여부는 아래 v3 실패·재시도 정책과 구분해 설계한다.
- 과거 상담의 v3 이관은 필수가 아니며 이번 범위에서 제외한다. v2·운영 앱에 기존 기록이 남아 있어도 된다. 기존 데이터 삭제·초기화는 하지 않는다. 신규 상담의 정확한 선택과 기존 실행 중인 앱의 호환 검증은 이관과 별개다.
- 구매자 문의와 메시지 수정·삭제·인용 답장은 후속 범위다. 아래 일반 문의의 기존 연동 보류 기록은 실시간 상담 개발 전체를 막는 조건으로 확대하지 않는다.
- 현재는 범위 확정 단계다. 이 문서 변경이 실시간 쓰기 구현·시간 상수 변경·앱 간 검증 완료를 뜻하지 않는다.

## 일반 문의: 기존 정책과 연동 상태

사용자 확정(2026-10-19). 일반 문의는 `isBoardType: true`인 "문의 남기기"다. 아래 정책이 기존 2026-10-15의 1개 제한·추가 메시지·광고주 개별 종료 계획을 대체한다.

1. 기타 문의·캠페인 문의 모두 첫 본문 저장 성공 후 해당 대화로 이동한다. 대화는 답변 대기·답변 완료·종료 여부와 관계없이 **읽기 전용이며 입력창이 없다**.
2. 열린 문의가 답변 대기든 답변 완료든 새 문의를 등록할 수 있다. 같은 캠페인의 복수 문의와 복수 기타 문의도 이 조건에 포함된다.
3. 새 문의 작성·등록·전환으로 기존 문의를 자동 종료하지 않는다. 일반 문의에는 광고주 종료 버튼이 없으며, `상담 종료`는 실시간 상담 전용이다.

### v2와 동시 운영 및 연동 보류 (2026-10-19)

v2 광고주 앱(`bigbird-client-fe`)과 v3의 병행 사용은 필수다. 같은 광고주가 두 앱을 번갈아 써도 정상 동작해야 하며, **실시간 상담 호환에 필요한 v2와 운영 앱 수정은 작업 범위에 포함**한다. 기존 무수정 전제는 해제한다.

- **현재 상태:** 사용자 전달에 따르면 백엔드에 위 호환 요구가 반영되지 않았다. 복수 문의 등록의 실제 연동·공개는 호환 방안 확정과 검증까지 보류한다. 기존 목록·대화 조회 연동을 완료된 등록 기능으로 해석하지 않는다.
- 서버 수정 필요 범위와 **서버만으로 해결 가능한지**는 미확정이다. 필요한 v2·운영 앱 호환 수정은 포함하되 운영 앱 전체 개편으로 확대하지 않는다. 1개 제한이나 기존 문의 자동 종료를 최종 정책의 대체안으로 적용하지 않는다.
- 운영 앱은 `sequence` 오름차순 정렬 후 첫 미종료 문의를 답장·viewing 대상으로 사용한다(`src/store/module/customer.js:124,267,457`, `src/components/customerservice/ChatModal.vue:1082`). 모든 대화를 렌더하는 것과 문의별 답장 대상 선택은 다르다. 캠페인 필터만으로 같은 캠페인·기타 문의 여러 건을 구분할 수 없다.
- 운영 창의 **X는 일반 문의를 종료하지 않는다**(`ChatModal.vue:1012`). `새로운 문의`는 첫 열린 문의를 실제 종료하지만 CHECK·client/influencer 조건에서만 보인다(`ChatModal.vue:76,837`). "답변 후 창 닫기"를 다음 문의 처리의 근거로 삼지 않는다. 종료 후 알림 처리 인자의 객체/문자열 불일치도 존재하나(`ChatModal.vue:845`, `customer.js:658`), 핵심 위험은 계정 단위 상태 공유다.
- Firestore NEW는 `threadUserIdx` 문서 하나에 저장된다. 운영 창 열기·답장과 v2 창 열기가 값을 초기화·덮어써 다른 미처리 문의의 신호를 지울 수 있다(운영 `customer.js:660,672`, v2 `customer.js:871`). 일반 문의에는 실시간 상담용 팝업 알림 조건도 적용되지 않는다(운영 `customer.js:756`). 운영 미확인 목록의 서버 판정은 별도 확인 대상이다.
- v2의 `새로운 문의`는 첫 열린 문의만 종료한다(`BigbirdChatModal.vue:968`). 여러 문의가 있을 때 종료 대상 혼동, 답변 연결, 상태 동기화를 검증해야 한다. v3의 읽기 전용 UI만으로 v2 동작을 제어할 수 없다.
- 마켓의 구매자→빅버드 문의도 운영 ChatModal을 공유한다. 구매자→광고주 문의는 `/help/thread-c`로 분리된다. 공유 계약을 변경한다면 마켓 영향도 확인한다.
- v3가 보내지 않는 "기타문의"·인사말 자동 메시지는 기존 렌더 구조에 영향이 없다. 캠페인 JSON 자동 메시지 형식은 유지한다.
- **재개 조건:** 백엔드가 생성·목록·답변 대상·읽음/미처리·종료의 호환 방안을 설명하고, 아래 완료 기준을 v2·v3·운영 앱에서 검증한다. 단순히 "복수 생성 가능"이라는 답변만으로 재개하지 않는다. 서버 확인이 필요한 항목과 프론트에서 해결할 항목을 나눠 검증한다.

### 일반 문의의 기존 단계별 범위 (실시간 상담은 위 현재 작업 범위 우선)

| 1차에 구현 | 후속 구현 |
| --- | --- |
| 기타 문의·캠페인 문의의 텍스트 등록 | 첨부 업로드·다운로드·미리보기 |
| 캠페인 목록 조회와 1개 선택 | 실시간 상담은 위 현재 작업 범위로 이동 |
| 빅버드 문의 목록·선택한 문의의 대화 조회 | 메시지 수정·삭제·인용 답장 |
| 첫 전송 후 읽기 전용 대화(입력창·종료 버튼 없음) | 구매자 문의·상품 Q&A의 목록·대화·상세 |
| 답변 대기·답변 완료 표시와 종료 여부 구분 | 브라우저 알림 |
| PC·태블릿·모바일 대응, 기존 인증·권한 적용 | 기존 실시간 문의·첨부가 섞인 이력의 표시 정책은 아래 확인 사항 참조 |

후속 기능을 지원하는 것처럼 성공 처리하지 않는다. 이번 범위는 개발 단위이며, 미구현 버튼의 숨김·비활성화 방식과 기존 이력의 노출 범위는 출시 전에 확정한다. 실시간 상담 기능을 미루더라도 일반 문의에 필요한 Firestore 상태 연동은 1차 범위에 포함한다. v2·운영 앱의 실시간 상담 호환 수정은 포함한다. 복수 일반 문의 등록의 공개는 해당 호환 검증 전까지 보류한다.

### 화면 흐름

1. **목록 진입:** 로그인과 고객센터 권한을 확인하고 문의를 조회한다. LNB 진입의 최신 대화 선택과 특정 문의 URL 직접 진입은 아래 URL 계약을 따른다. 목록·대화는 선택한 문의의 식별자를 기준으로 연결한다.
2. **새 문의 작성:** 기타 문의 또는 캠페인 문의를 선택한다. 캠페인 문의는 캠페인 1개를 선택해야 한다. 방식은 "문의 남기기"이며 본문은 최대 3,000자다. 폼을 열거나 유형·캠페인을 선택하는 것만으로 서버에 문의를 생성하지 않는다.
3. **등록:** 첫 본문 제출 시 별도 문의를 생성하고, 캠페인 문의일 때만 캠페인 JSON 자동 메시지와 사용자 본문을 해당 문의로 보낸다. 첫 본문 저장 성공 후 생성된 문의 대화로 이동하고 목록을 갱신한다. 기존 열린 문의는 유지한다. **2026-10-20 사용자 지시로 등록 연동을 켰다**(`IS_REGISTRATION_ENABLED = true`). 호환 방안·검증은 끝나지 않았으므로 아래 "알려진 위험"을 감수하며, 문제가 생기면 `false`로 되돌린다.
4. **대화 조회:** 등록 후에는 읽기 전용이다. 운영자 답변을 확인하고, 추가 질문은 새 문의로 등록한다. 대화 화면에는 입력창·전송·종료 버튼을 제공하지 않는다.

| 일반 문의 상태 | 목록·헤더 태그 | 대화 입력창·전송 | 광고주 종료 버튼 |
| --- | --- | --- | --- |
| 미종료, 마지막 일반 메시지가 광고주 메시지 | 답변 대기 | 없음 | 없음 |
| 미종료, 마지막 일반 메시지가 운영자 메시지 | 답변 완료 | 없음 | 없음 |
| 종료됨 (`finishTime` 존재) | 답변 완료 | 없음 | 없음 |

자동 메시지는 마지막 발신자 판정에서 제외한다. "답변 완료"나 읽기 전용 표시를 이유로 실제 문의를 종료하지 않는다. 기존 앱에서 종료된 이력의 표시와 미답변 종료 건의 처리 계약은 호환 검증에 포함한다.

### 기존 API 사용

2026-10-15 Stage 전체·고객센터 OpenAPI와 v2 광고주·운영 앱 코드를 대조했다. 2026-10-16 백엔드가 같은 로직을 `/v3/help/**`로 다시 노출했으므로 V3 경로를 쓴다([V3 고객센터 API](../../docs/customer-center-api.md#v3-고객센터-api-2026-10-16)). 기존 API는 조사 기준이며, 복수 문의 호환을 지원하는지는 미확정이다. 필요한 서버 변경이나 신규 API 여부는 호환 방안 확인 후 정한다.

| 동작 | API | 사용 기준 |
| --- | --- | --- |
| 세션·권한 | `GET /sec` | 세션의 `threadUserIdx`와 고객센터 권한 사용 |
| 캠페인 선택 | `GET /v3/help/c-client-campaign` | `campaignIdx` 1개 선택. v2 `/service/client-question`(결제 완료된 빅버드 캠페인)과 목록 범위가 같은지 확인 필요 |
| 목록·대화 | `GET /v3/help/thread?threadUserIdx=…&status=…` | `data[]` 한 건이 문의 1건(스레드)이다. 서버 `status`로 탭을 필터링하고 선택한 `threadIdx`를 찾는다 |
| 일반 문의 생성 | `POST /v3/help/thread` | `isBoardType: true`, 캠페인 문의는 선택한 `campaignIdx`, 기타 문의는 캠페인 없음. 명세 설명은 null 가능이며 실제 직렬화·응답 검증 필요 |
| 자동·사용자 메시지 | `POST /v3/help/thread/message` | 생성 결과의 `threadIdx` 사용. 자동 메시지에는 `isAuto: true`; 텍스트 문의에 첨부를 보내지 않음 |
| 문의 종료(참고) | `PUT /v3/help/thread/{threadIdx}` | v3 일반 문의에서는 호출하지 않음. 실시간 상담 및 기존 앱 종료 호환 검증용 |

- 일반 문의와 실시간 상담의 기본 목록 상태는 서버 `status: WAITING | IN_PROGRESS | ANSWERED`를 사용한다. 실시간 상담 연결·만료·종료 상태는 Firestore 문서가 도착하면 이를 반영한다. 메시지의 마지막 발신자로 상태를 추정하지 않는다.

- v2 일반 문의는 생성 후 캠페인 JSON 또는 "기타문의", 인사말의 자동 메시지 2개를 전송한다. **v3는 캠페인 문의일 때 캠페인 JSON 자동 메시지 1개만 보내고, "기타문의"와 인사말은 보내지 않는다**(사용자 결정 2026-10-16). 운영 앱(`ChatModal.vue`)은 `auto`이고 본문이 `{`로 시작하는 메시지만 캠페인 카드로 해석하고, 나머지 자동 메시지는 일반 문구로 보여 줄 뿐이라 영향이 없다. 캠페인 JSON의 필드 구성은 v2 원본과 같게 유지한다.
- 광고주 대화 화면은 캠페인 카드 외의 자동 메시지를 표시하지 않는다. 기존 문의와 운영자가 연 문의에 남아 있는 "기타문의"·인사말을 거르기 위해서다.
- 메시지 전송 응답의 `threadIdx`는 실제 저장된 문의다. 서버는 종료된 문의에 전송하면 새 문의를 만들 수 있다고 명세에 적고 있다. 종료·전송 경합 시 반환 ID를 무시하거나 기존 문의에 메시지를 잘못 붙이지 않는다. 이 경우 사용자에게 보여 줄 동작은 연동 전에 확인한다.
- 일반 문의도 v2에서 Firestore의 새 메시지·응대 상태를 갱신한다. REST 성공만으로 운영 앱의 알림·상태까지 갱신됐다고 간주하지 않는다.

### 오류·중복·문의 간 분리

아래는 구현 시 지켜야 할 처리 기준이다. 오류 문구와 표시 위치는 기존 공통 UI·해당 시안을 확인해 적용하며 임의의 새 화면을 만들지 않는다.

- 빈 본문·공백만 있는 본문·3,000자 초과 본문은 전송하지 않는다. 제출 중에는 같은 작업을 중복 요청하지 않는다.
- 생성·자동 메시지·첫 본문은 여러 요청이므로 부분 성공을 구분한다. 생성에 성공했다면 이후 실패 때문에 문의 생성부터 다시 실행하지 않는다. 성공한 단계와 생성된 식별자를 유지한다.
- 응답 유실·시간 초과는 서버 저장 실패로 단정하지 않는다. 저장 여부를 재조회하고, 확인 불가능하면 중복 생성·중복 전송을 막을 수 있는 계약을 확인한다. 서버 멱등성 지원은 현재 명세에서 확인되지 않았다.
- 전송 실패 시 작성한 본문을 보존한다. 저장 성공 후 목록 갱신이나 Firestore 상태 갱신만 실패한 경우에는 본문을 다시 보내지 않고 해당 동기화만 복구한다.
- A 문의 전송 중 B 문의로 이동해도 요청 결과는 A에 반영한다. B의 메시지·선택 상태를 덮어쓰지 않는다. 새 문의 작성 중 본문을 다른 문의와 섞지 않는다.
- 목록·대화 조회 실패를 문의 없음으로 표시하지 않는다. 일반 문의 화면에서 종료 요청은 보내지 않는다.

### 1차 연동 전 확인할 사항

| 확인 사항 | 이유·완료 조건 |
| --- | --- |
| 대화 응답·식별자 | V3 `GET /v3/help/thread`의 스레드·메시지 DTO와 예시가 정의됨(2026-10-16). 응답 DTO에 `required`는 없고 필드별 `nullable`만 있다. 1차 Zod는 `nullable` 필드만 `.nullable()`, 나머지는 필수로 쓴다(스레드: `viewing`·`campaignIdx`·`finishTime`, 메시지: `attachmentIdx`·`readTime`·`modifyTime`·`deleteTime`·`identifier`·파일 정보 3개가 nullable). 백엔드의 재판정 결과가 오면 맞춘다. 2026-10-16 stage 실응답(ADMIN 계정, 스레드 14건·메시지 6건)이 1차 스키마를 통과했다. 시각은 KST 지역 시간이며 밀리초가 붙기도 한다(`2026-09-16T11:32:10.092`). 실시간 상담 스레드는 REST `messages`가 비어 있다(메시지는 Firestore). 운영 측 인사말 auto 메시지 본문에 `</br>`가 있어 트랜스포머가 줄바꿈으로 바꾼다. 캠페인 목록은 이 계정에서 비어 있어 항목 형식과 캠페인 카드 JSON은 아직 실데이터로 확인하지 못했다 |
| Firestore 응대·알림 | 기존 필드는 "데이터 계약 > Firestore"를 참고한다. 계정 단위 NEW만으로 복수 미처리를 보장할 수 없다. v2가 값을 초기화해도 운영 목록에 미처리 문의가 남는 계약을 확인하며, 필드 추가 여부도 미확정이다 |
| 캠페인 기간 | 기존 캠페인 목록 DTO에 기간 없음. 기존 조회 출처 또는 서버 보완 확인. 임의 날짜를 넣지 않으며 기간이 없는 경우의 표시 방식은 미확정 |
| 운영자 답변 갱신 | 일반 문의 답변을 감지하는 기존 상태 변경과 REST 재조회 연결 확인. 폴링 주기를 임의로 정하지 않음 |
| 기존 이력과 단계별 공개 | 기존 실시간·첨부 이력의 읽기 지원 범위와 미구현 메뉴 표시 방식 확정. 기존 문의를 임의로 숨기거나 일반 문의로 취급하지 않음 |

목 데이터 UI 준비와 실제 연동 완료를 구분한다. 복수 문의의 등록 연동·공개는 호환 방안과 앱 간 검증이 끝날 때까지 보류하며, 1개 제한·자동 종료로 대체하지 않는다.

### 1차 완료 기준

- 기타 문의와 캠페인 문의를 각각 등록하고 운영 앱에서 본문과 캠페인 맥락을 확인한다.
- 열린 문의 A가 답변 대기·답변 완료인 각각의 경우 B를 별도 등록하고 A가 자동 종료되지 않는다. 같은 캠페인·다른 캠페인·기타 문의 조합을 검증한다.
- 첫 전송 후 해당 대화로 이동하며 모든 일반 문의 대화에 입력창·전송·종료 버튼이 없다. 답변 완료와 실제 종료를 구분한다.
- A만 읽거나 답해도 B가 운영 미처리 목록에 남는다. A를 닫지 않고 B에 답할 수 있으며 화면에서 확인한 문의와 실제 저장된 답변의 threadIdx가 일치한다.
- 중간에 v2를 열거나 메시지 전송·새로운 문의 동작을 수행해도 다른 문의의 답변 연결·미처리 상태가 유실되지 않는다. 운영 X로 창을 닫고 다시 열어도 잔여 문의를 찾을 수 있다.
- 생성·자동 메시지·본문 전송·상태 동기화의 각 실패를 검증한다. 생성 중복, 다른 문의로의 오전송, 이미 저장된 본문의 재전송이 없어야 한다.
- 새로고침·직접 URL 진입·뒤로가기 후 해당 문의를 복원한다. PC·태블릿·모바일에서 등록·조회·읽기 전용 대화를 검증한다.
- 기존 인증·SUB 권한과 일반 문의의 추가 전송·종료 요청 차단을 유지한다. 운영 앱에서 답변·종료가 기존처럼 동작하는지 확인한다.

## URL 계약

`ROUTES`와 인증 레이아웃의 자식 라우트로 구성한다.

### 현재 구현 단계 (구현 기록 2026-10-16, 정책·보류 상태 갱신 2026-10-19)

- 비로그인 홈에서 빅버드 문의·구매자 문의를 누르면 현재 앱의 `/login`으로 이동한다. PC LNB와 모바일 전체 메뉴 모두 동일하며 이동 시 전체 메뉴는 닫힌다.
- 로그인 후 `/`에서 LNB의 고객센터 → 빅버드 문의·구매자 문의로 이동한다. 브라우저 뒤로 가기와 URL 직접 진입도 지원한다.
- 현재 등록된 고객센터 경로는 `/customer-center/bigbird`, `/customer-center/bigbird/:threadIdx`, `/customer-center/bigbird/new`, `/customer-center/buyer`다. 문의 목록·대화 조회와 대화 직접 진입은 V3 API로 연결했다(2026-10-16). 새 문의 등록은 코드(`useRegisterBigbirdInquiry`, `POST /v3/help/thread` → 캠페인 카드 → 본문)만 있고 페이지의 `IS_REGISTRATION_ENABLED = false`로 꺼 두었다. 호환 방안 확정까지 보류한다. 재개 전에 고칠 것: 생성 성공 뒤 전송이 실패한 상태에서 유형·캠페인을 바꿔 재제출하면 이전 스레드에 다른 캠페인 카드·본문이 가는 문제, 본문 전송 응답의 `threadIdx`(종료된 스레드면 서버가 새로 만듦)를 쓰지 않는 문제, 등록 성공 뒤 목록 재조회를 기다리는 동안 다시 누르면 같은 스레드로 본문이 한 번 더 가는 문제. 일반 문의의 추가 메시지 전송·광고주 종료는 최신 정책의 구현 대상이 아니다.
- PC는 펼침/접힘 사이드바, 태블릿은 레일과 전체 메뉴, 모바일은 메뉴 버튼과 오버레이를 사용한다. 메뉴 선택 시 오버레이를 닫는다.
- 각 경로에서 기존 `GET /sec`로 권한을 확인한다. 고객센터 권한이 없는 SUB는 링크를 비활성화하고 직접 진입 시 `/`으로 보낸다. 서버 거절·세션 오류는 `AuthGuard`에서 현재 앱의 `/login`으로 보낸다. 외부 회원 사이트의 `redirectTo`는 사용하지 않는다.
- 빅버드 문의는 시안의 좌측 문의 목록과 우측 대화 작업 영역을 표시한다. 새 문의 경로에서는 같은 목록 패널 옆에 작성 패널을 표시한다. 목록은 최신순이고 상태 탭(`?status=`)으로 거른다. PC에서 문의를 고르지 않고 들어오면 최신 문의 대화를 보여 준다. 실시간 상담은 선택한 `sequence` 문서를 Firestore에서 구독해 기존 메시지를 표시한다. 상담 요청·전송·종료·재시도·전환은 `features/realtime-consultation`에 연결했고 `IS_REALTIME_WRITE_ENABLED`로 켜고 끈다(아래 "실시간 상담 쓰기 연결"). 완료된 문의는 대화 위에 완료 카드를 고정하고 입력창을 두지 않는다. 삭제된 메시지는 "메시지가 삭제되었습니다." 칩으로 표시한다. 새 문의는 Figma `5202:111028`·`5219:122912`의 유형 선택, 캠페인명·기간 표, 문의 남기기/실시간 상담하기 선택, 첨부·전송이 있는 3,000자 입력창, 하단 전체 너비 문의하기 버튼을 유지한다. 캠페인은 단일 선택이고 기타 문의에서는 표를 숨긴다. 방식 전환 시 작성 내용을 보존한다. 캠페인 데이터와 등록·첨부 핸들러는 props로 주입하며 새 문의 페이지는 문의 목록과 캠페인 목록(`GET /v3/help/c-client-campaign`)을 연결했다. 캠페인 표는 5행까지 보여 주고 넘으면 머리글을 고정한 채 본문만 스크롤한다. 캠페인 조회 중·실패는 "캠페인 없음"과 구분해 공통 문구("불러오는 중…", "문제가 발생했습니다" + 다시 시도)로 표시한다. Figma에 전용 문구가 없어 임시이며, 확정되면 교체한다. 등록 핸들러는 위 보류로 주입하지 않아 문의하기 버튼이 비활성이고, 첨부 API는 호출하지 않는다. 실시간 상담하기는 쓰기 플래그(`IS_REALTIME_WRITE_ENABLED`, 현재 켜짐)가 켜져 있을 때만 선택·제출할 수 있다. 일반 문의의 Firestore 상태 갱신(NEW·응대 표시)은 구현하지 않았다.
- 실시간 상담 읽기(2026-10-19, 쓰기 없음): 종료되지 않은 실시간 상담의 상담 문서를 `useLiveInquiries`가 구독해 목록·헤더 상태를 정한다(`entities/inquiry`). 종료(`finishTime`)가 먼저이고, 그 외 `isConnect`면 상담 중, 아니면 REST의 `created`로부터 5분 안이면 연결 대기(표시 상태는 답변 대기 + "상담 요청 중" 카드), 넘으면 요청 실패다. 연결 대기 마감은 상담 문서의 `waitDeadline`(재시도하면 새로 쓴다)을 기준으로 하고 없으면 REST `created` + 5분이다. 취소(`canceledAt`)·만료(`expiredAt`)가 기록된 요청은 마감 전에도 요청 실패이며, 취소된 요청은 재시도할 수 없다. 요청 실패는 전체 탭에서만 보인다(상태 탭 분류 미정). 대화는 선택한 상담 문서만 구독해 메시지를 읽고, 종료 이력은 완료 카드만 보여 준다. 쓰기 플래그가 꺼져 있으면 입력창·전송·첨부와 `상담 종료`·`재시도`·`문의 메시지로 남기기` 버튼은 비활성으로 보여 주기만 한다. 실데이터 화면은 stage 계정에 실시간 상담이 없어 확인하지 못했고 테스트로만 검증했다.
- 실시간 상담 쓰기 연결(2026-10-19): 쓰기 판단은 `entities/inquiry/lib/consultation-write.ts`의 순수 함수가, 트랜잭션 실행은 `api/realtime-consultation-write.ts`가 맡고, 화면 동작은 `features/realtime-consultation`의 `useRequestRealtimeConsultation`·`useRealtimeConversation`이 맡는다. 요청 생성은 REST(`isBoardType:false`) 후 Firestore 상담 문서를 만들며 `origin:"v3"`와 `waitDeadline`(5분)을 쓴다. 전송은 최신 배열에 붙이고 `messageId`로 재시도 중복을 막으며, 종료는 `closingAt` → REST 종료 → 종료 메시지·`finishTime` 확정 순서다. 만료는 응대 락을 가진 탭이 v3 요청에만 기록한다. 연결 후 3분 동안 광고주가 말하지 않으면 락을 가진 탭이 자동 종료한다. **`IS_REALTIME_WRITE_ENABLED`는 켠 채로 머지한다**(사용자 결정 2026-10-19). 운영 앱·v2 호환 수정은 후속이며 그 전까지 알려진 위험을 감수한다(아래 "실시간 상담 쓰기 착수 조건"). 문제가 생기면 `false`로 되돌리면 읽기 전용 화면만 남는다. 재시도는 알림에 캠페인 상세 없이 `campaignIdx`만 담는다. 세 앱 연동은 아래 "로컬 연동 검증"처럼 개발용 Firestore에서 확인했고, 실제 운영 환경과 서브 계정 락 차단은 검증하지 못했다.
- 로컬 연동 검증(2026-10-19, 개발용 Firestore `bb-dev-unity-helpdesk`, stage REST): v3 · 운영 앱(`bigbird-operation-fe`) · v2(`bigbird-client-fe`)를 로컬에서 번갈아 띄워 확인했다.
  - 확인됨: v3 요청 → 운영 앱 목록에 NEW·"실시간 상담 요청" 도착 → 운영 앱 연결 → v3 "상담 중". 양쪽 동시 전송 16건이 모두 남음(동시 쓰기 충돌은 `FAILED_PRECONDITION`으로 응답되고 트랜잭션이 자동 재시도해 성공). 운영 앱 종료 → v3 "답변 완료". 종료 직전에 보낸 메시지는 저장됨. 5분 지난 요청에 운영 앱이 연결하지 않음. 열린 일반 문의가 있어도 새 실시간 요청에 연결. 같은 계정으로 v3와 v2를 동시에 열면 락에 탭이 함께 등록되고 한쪽을 닫아도 다른 쪽 락이 유지됨.
  - 발견·수정: ① v3 입력창이 전송 중 Enter를 무시하고 끝나면 비워 다음 글이 사라지던 문제(보내는 즉시 비우고 동시 전송 허용). ② 실패한 요청이 열려 있을 때 다시 요청하면 서버가 기존 요청을 돌려주고 문서도 이미 있어 바로 "요청 실패"가 보이던 문제(문서가 이미 있으면 같은 요청을 재요청). ③ v2는 Vue 2.7이라 `beforeUnmount`가 호출되지 않아 창을 닫아도 락을 놓지 않던 문제(`beforeDestroy`로 내 탭 해제·락 연장 타이머 정리; 같은 훅의 기존 정리 코드와 `CustomerService.vue`의 `beforeUnmount`는 동작이 바뀔 수 있어 그대로 둠).
  - 알려진 한계: 연결 대기·연결된 상담이 없으면 운영 앱의 기본 대상은 만료된 요청을 포함한 첫 미종료 문의다. 서브 계정(`devTest`)은 서버가 `/sec`에서 모든 경로에 403을 주어 고객센터에 입장할 수 없어 다른 계정 락 차단은 락 로직 테스트로만 검증했다(고객센터 권한이 있는 서브 계정 필요). v2의 5분 자동 종료와 운영 앱의 연결 후 3분 무응답 처리는 실시간으로 기다려 확인하지 않았다.
  - 운영 앱 변경은 `feat/realtime-compat` 브랜치(메시지 쓰기 트랜잭션, 만료·취소·종료 거절, 문의 선택, NEW·알림 보존), v2 변경도 같은 이름의 브랜치(메시지 쓰기 트랜잭션, 대기 5분, 락 탭 소유권, NEW·알림 보존, `beforeDestroy`)이며 로컬 커밋만 있고 푸시하지 않았다.
- 빅버드 문의는 시안의 좌측 문의 목록과 우측 대화 작업 영역을 표시한다. 새 문의 경로에서는 같은 목록 패널 옆에 작성 패널을 표시한다. 목록은 최신순이고 상태 탭(`?status=`)으로 거른다. PC에서 문의를 고르지 않고 들어오면 최신 문의 대화를 보여 준다. 실시간 상담 이력은 목록에 보이고, 대화는 Firestore 연동 전이라 안내만 표시한다. 완료된 문의는 대화 위에 완료 카드를 고정하고 입력창을 두지 않는다. 삭제된 메시지는 "메시지가 삭제되었습니다." 칩으로 표시한다. 새 문의는 Figma `5202:111028`·`5219:122912`의 유형 선택, 캠페인명·기간 표, 문의 남기기/실시간 상담하기 선택, 첨부·전송이 있는 3,000자 입력창, 하단 전체 너비 문의하기 버튼을 유지한다. 캠페인은 단일 선택이고 기타 문의에서는 표를 숨긴다. 방식 전환 시 작성 내용을 보존한다. 캠페인 데이터와 등록·첨부 핸들러는 props로 주입하며 새 문의 페이지는 문의 목록과 캠페인 목록(`GET /v3/help/c-client-campaign`)을 연결했다. 캠페인 표는 5행까지 보여 주고 넘으면 머리글을 고정한 채 본문만 스크롤한다. 캠페인 조회 중·실패는 "캠페인 없음"과 구분해 공통 문구("불러오는 중…", "문제가 발생했습니다" + 다시 시도)로 표시한다. Figma에 전용 문구가 없어 임시이며, 확정되면 교체한다. 등록 핸들러는 위 보류로 주입하지 않아 문의하기 버튼이 비활성이고, 첨부 API는 호출하지 않는다. 실시간 상담하기는 선택할 수 없다. Firestore 상태 연동은 구현하지 않았다.
- 구매자 문의 목록(2026-10-19): `GET /v3/help/inquiry`를 연결했다(`entities/inquiry`의 `useBuyerInquiries`, `widgets/buyer-inquiry-workspace`). 탭(전체·답변 대기·답변 완료)은 `?status=`로 서버 상태값(`ALL`·`WAITING`·`ANSWERED`)을 보내 걸러 받고, 20건씩 받아 목록 끝에서 다음 쪽을 불러온다. 카드는 출처(구매자 문의/상품 Q&A) 배지와, 답변 대기일 때만 상태 배지(답변 완료는 상태 배지 없음, 2026-10-20 결정), 작성자, 미리보기(답변이 있으면 답변), 마지막 활동 시각을 보여 준다. 재문의 탭·배지는 없다. 항목을 누르면 임시 키 `{출처}-{inquiryIdx}`로 `/customer-center/buyer/:inquiryKey`에 이동한다. 오른쪽 패널 틀은 목록 응답의 본문·답변·작성자·캠페인명·주문번호만 표시한다. PC·태블릿은 대화와 상세를 함께 보여 주고 상담 기록 버튼은 상세 영역을 전환한다(`?panel=history`). 모바일은 목록·대화·상세(`?panel=detail`)·상담 기록을 각각 표시한다. 상담 기록은 같은 구매자와의 과거 상담(스레드)을 날짜·캠페인 카드·대화 순서로 보여 준다(아래 2026-10-21 구현). 입력창은 `IS_BUYER_WRITE_ENABLED = false`라 비활성이다. 문의 유형·캠페인·인플루언서 필터는 Figma 설정창과 V3 API에 연결하고 URL에 보존한다. 캠페인을 고르기 전 인플루언서 선택은 비활성이다. 등록일은 통합 목록 API에 날짜 인자가 없어 화면에서 비활성이다(백엔드 요청 #13 대기). 작성자가 없는 스레드의 이름("이름 없음")과 메시지 없는 항목의 날짜는 Figma에 문구가 없어 임시이며 확인이 필요하다.
- 로그인 후 목적지는 권한과 관계없이 `/`.

| 경로                                  | 화면                                                                                  |
| :------------------------------------ | :------------------------------------------------------------------------------------ |
| `/customer-center/bigbird`            | 빅버드 문의 목록. LNB 클릭으로 진입하면 최신 대화를 자동 선택한다        |
| `/customer-center/bigbird/new`        | 새 문의 폼                                                                            |
| `/customer-center/bigbird/:threadIdx` | 문의 대화                                                                             |
| `/customer-center/buyer`              | 구매자 문의 목록                                                                      |
| `/customer-center/buyer/:inquiryKey`  | 구매자 문의 대화. `?panel=detail`이면 모바일에서 상세 화면(Chat Detail)을 연다. PC·태블릿은 상세 패널을 함께 표시한다 |

- **`inquiryKey`는 출처를 담는다**: 구매자 문의는 `purchaser-{inquiryIdx}`, 상품 Q&A는 `qna-{inquiryIdx}`를 목록 항목의 고유 키로 사용한다. 상세 조회에는 같은 항목의 구매자 `threadUserIdx` 또는 Q&A `userIdx + campaignIdx`를 사용한다. 두 식별자가 명세상 nullable이므로 null인 예외 항목의 상세 진입 정책은 구현 전에 확인한다.
- **목록 상태는 URL에 둔다**: 탭, 검색어, 필터는 searchParams로 관리한다. 대화로 갔다가 뒤로가기를 눌러도 목록 상태가 유지되게 하기 위해서다.
- **모바일은 목록과 대화가 별개 화면이다.** 같은 라우트를 쓰고, 화면 폭에 따라 목록 패널과 대화 패널 중 하나만 보여 준다. 브레이크포인트는 공용 토큰(`src/app/styles/index.css`: 768 태블릿, 1440 데스크톱)을 따른다.
- **접근 권한**: `AuthGuard`를 쓴다. SUB 계정은 `subPermissions.customerService`가 false면 접근을 막는다. 사이드바 비활성화는 앱 셸의 몫이다.

## 배치와 Public API

```
pages/customer-center-bigbird      목록 + 대화/새 문의 조립
pages/customer-center-buyer        목록 + 대화 + 상세 패널 조립
widgets/inquiry-conversation       대화 영역(메시지 목록 + 편집 툴바 + 입력창). 두 페이지가 같이 씀
features/inquiry-composer          입력창: 3,000자, 첨부, 전송(REST/Firestore 분기)
features/inquiry-message-actions   답장·수정·삭제
features/new-bigbird-inquiry       새 문의 폼(유형 → 캠페인 → 방식 → 첫 메시지)
features/realtime-consultation     실시간 상담: 응대중 락, 3분 자동 종료, 종료
entities/inquiry                   스키마·트랜스포머·SWR 훅·메시지 말풍선 UI
shared/api/firebase                Firebase 앱 초기화 (lazy). 로그인 없이 접근
```

`entities/inquiry` Public API (새 인터페이스):

```ts
type InquiryChannel = "realtime" | "board" | "purchaser" | "qna";
type BigbirdInquiryStatus = "waiting" | "consulting" | "done" | "failed"; // 표시 상태: 답변 대기 / 상담 중 / 답변 완료 / 요청 실패. 탭 분류와는 별개
type BuyerInquiryStatus = "waiting" | "done"; // 답변 대기 / 답변 완료 (재문의는 2026-10-19 디자인 변경으로 없앰)

interface InquiryMessageViewModel {
  id: string; // REST: messageIdx, Firestore: 메시지 id 필드
  isMine: boolean;
  kind: "text" | "campaignCard" | "image" | "video" | "file" | "system";
  body: string; // 일반 텍스트. HTML로 렌더하지 않는다
  createdAt: Date;
  isEdited: boolean;
  replyTo: string | null;
  canModify: boolean; // 본인 + 상대 미확인 + 문의 미종료
}

function useBigbirdInquiryList(): { inquiries; isLoading; isError; mutate };
function useInquiryThread(
  channel: InquiryChannel,
  key: string,
): { thread; messages; isLoading; isError };
function useBuyerInquiryList(params: { tab; keyword; searchType }): {
  inquiries;
  isLoading;
  isError;
  loadMore;
};
```

## 데이터 계약

### REST (기존 호출과 현재 Stage 계약)

2026-10-19 Stage `V3-고객센터` Swagger를 다시 확인하고, 인증된 계정으로 `/v3/help/thread`와 `/v3/help/inquiry`의 HTTP 200 응답을 확인했다. v3는 `/v3/help/**`를 쓴다. 호출은 기준 URL에 `/v3`를 붙인 `serverApiV3`(`shared/api`)로 하고 경로는 `/help/...`로 적는다. 백엔드의 `/v3` 이전이 끝나기 전까지 다른 API는 `serverApi`를 쓴다. 경로별 v2 대응·백엔드가 명시한 공백·남은 확인은 [V3 고객센터 API](../../docs/customer-center-api.md#v3-고객센터-api-2026-10-16)를 참고한다. `c-client-campaign`의 빈 브랜드명은 문서 계약만 재확인했고, 이전 null 사례 네 건의 실응답은 계정 목록이 비어 재검증하지 못했다.

- **빅버드 문의 목록·대화**
  - 목록: `GET /v3/help/thread?threadUserIdx&status`. 응답은 `{result, data: thread[]}`이고 스레드 하나가 문의 1건이다. `status` 쿼리는 `ALL | WAITING | IN_PROGRESS | ANSWERED`다. 스레드는 `threadIdx, sequence, viewing, toUserIdx, fmUserIdx, campaignIdx, finishTime, created, boardType, status, messages[]`다.
  - 메시지는 `messageIdx, threadIdx, body, userIdx, attachmentIdx, writeTime, readTime, modifyTime, deleteTime, identifier, isUserMessage, auto, fileName, fileSize, fileType`다.
  - `threadUserIdx`는 세션 값(`session.threadUserIdx`)을 쓴다.
  - 캠페인명은 응답에 없다. `c-client-campaign` 목록과 `campaignIdx`로 맞추거나 첫 auto 메시지의 캠페인 JSON을 쓴다.
- **새 문의**
  - 캠페인 목록: `GET /v3/help/c-client-campaign` → `list[]: {campaignIdx, campaignCode, brandName, productName, mainImageUrl, progressStartDate, progressEndDate}`. `brandName`에 값이 없으면 빈 문자열이고, 기간 필드는 nullable이다.
  - 생성: `POST /v3/help/thread {isBoardType, campaignIdx}`. 응답 `data`에서 `threadIdx`, `sequence`를 받는다.
  - 문의 남기기는 생성 뒤 캠페인 문의일 때만 캠페인 JSON auto 메시지를 1개 보낸다. **운영 앱이 이 auto 메시지로 캠페인 카드를 그리므로 형식을 유지한다.** v2가 보내던 "기타문의"·인사말은 보내지 않는다.
- **문의 남기기 메시지·첨부**
  - 메시지: `POST /v3/help/thread/message`.
  - 첨부: `POST /v3/help/message/{image|video}/{service}`(multipart `file`)로 올린 뒤 받은 `attachmentIdx`를 메시지로 보낸다. 응답은 `{url, attachmentIdx, fileName, result, fileSize}`다. `{service}` 값은 v2가 `help`를 썼으며 백엔드 확인 대상이다. 다운로드는 `GET /v3/help/file/download/{image|video}/{attachmentIdx}`다.
- **문의 종료(기존 계약 참고·실시간 상담용)**: `PUT /v3/help/thread/{threadIdx}`. v3 일반 문의에서는 호출하지 않는다.
- **구매자 문의·상품 Q&A**
  - 통합 목록: `GET /v3/help/inquiry?status&sourceType&campaignIdx&influencerThreadUserIdx&searchType&keyword&page&entrySize`. `status`는 `ALL | WAITING | ANSWERED`, `sourceType`은 `ALL | PURCHASER_QUESTION | PRODUCT_QNA`, `searchType`은 `name | orderNumber`다. Stage 실호출에서 두 출처와 계산된 상태를 확인했다.
  - 인플루언서 필터: `GET /v3/help/influencer-filter?campaignIdx` → `list[]: {threadUserIdx, displayName}`.
  - 구매자 대화·상담 기록: 통합 목록의 `threadUserIdx`로 `GET /v3/help/thread?threadUserIdx&campaignIdx&type=client`를 호출한다. `type=admin`은 구매자↔운영 대화다.
  - 상세: 주문·상품 `GET /v3/help/c-purchaser-questionInfo/{orderNumber}`(`list`는 단일 객체, 결제 금액 없음), 캠페인 `GET /v3/help/c-campaign-question`(이미지·기간·진행 상태·인플루언서 명단 없음).
  - Q&A 상세: `POST /v3/help/qna`. 답변이 없으면 `replyInfo`가 `{}`다.
  - Q&A 답변: `POST|PUT /v3/help/reply`, `DELETE /v3/help/reply/{replyIdx}`. 등록 응답은 `{result, status}`이고 실패 시 HTTP 상태 코드로 구분한다.
  - 통합 목록 항목에는 구매자 `threadUserIdx`와 Q&A `userIdx`가 nullable로 포함된다. 출처별 조회 키가 null인 경우는 상세 진입 전에 별도로 처리한다.
  - **구매자 문의 연동 계약(2026-10-20 Swagger 재확인)**: 통합 목록 항목은 `inquiryIdx, sourceType, status(WAITING|ANSWERED), campaignIdx, orderNumber, writerName, body(최근 메시지), writeTime, threadUserIdx, userIdx`이고 `campaignName`·`replyBody`·`replyWriteTime`은 없다(이전 응답의 필드가 사라졌으므로 검증 스키마도 맞췄다). 대화는 구매자 문의가 `GET /v3/help/thread?threadUserIdx&type=client(&campaignIdx)`(404는 빈 대화), 상품 Q&A가 `POST /v3/help/qna {userIdx, campaignIdx}`다. 상세 패널은 `GET /v3/help/inquiry/{inquiryIdx}?sourceType=`(문의자 이름·이메일·전화, 주문일·결제금액·주문번호, 캠페인 유형·진행 상태·기간·코드·공구샵 코드, 인플루언서 링크)이며 날짜 형식이 명세에 없어 문자열 그대로 표시한다. 상품·캠페인 이미지와 이름은 이 응답에 없어, 상품은 `c-purchaser-questionInfo/{orderNumber}`, 캠페인은 `c-client-campaign`에서 따로 받아 그린다(아래 2026-10-21 구현).
  - **상품 Q&A 답변**: 질문마다 답변 하나. 등록 `POST /v3/help/reply {inquiryIdx, body}`(409 이미 답변), 수정 `PUT /v3/help/reply {replyIdx, body}`, 삭제 `DELETE /v3/help/reply/{replyIdx}`(둘 다 409 이미 읽힌 답변). 구매자가 읽은 답변은 수정·삭제 버튼을 숨기고, 서버가 409를 주면 이유를 알리고 최신 상태를 다시 받는다.
  - **구매자 문의 화면 기능 연결(2026-10-21, 스웨거 재확인 후)**: 이전에 "API 없음"으로 본 항목 중 아래는 API가 있어 연결했다.
    - 검색: 입력창에서 Enter로 적용하고 URL `?q=`에 둔다. `GET /v3/help/inquiry`의 `searchType`·`keyword`로 보내며, 입력이 하나라 **숫자와 하이픈만이면 `orderNumber`, 그 밖에는 `name`**으로 정한다(주문번호 형식을 코드로 확인하지 못한 가정). 일치하는 작성자 이름·미리보기는 강조하고, 결과가 없으면 "'{검색어}'에 대한 결과가 없습니다."를 보인다.
    - 적용된 필터 칩: 캠페인명·인플루언서명을 칩으로 보이고 ×로 하나씩 푼다(캠페인을 풀면 그 인플루언서 조건도 함께 풀림). 이름은 필터 대화상자와 같은 목록(`c-client-campaign`, `influencer-filter`)에서 찾고 없으면 번호로 대신한다. 문의 유형은 칩이 아니라 "필터" 버튼이 활성 색(primary)이 되는 것으로 보인다(시안 "필터 버튼 활성화 시").
    - 상세 패널 이미지: 상품 썸네일·이름은 `GET /v3/help/c-purchaser-questionInfo/{orderNumber}`(주문번호가 있는 구매자 문의만), 캠페인 배너·이름은 `c-client-campaign`에서 `campaignIdx`로 찾는다. 이미지를 못 받아도 나머지 정보는 보인다.
    - 문의자 아바타: `GET /v3/help/user/{threadUserIdx}`의 `profileImage`를 대화 상대 쪽 메시지·대화 헤더·상세 패널에 쓴다(없으면 기본 아바타). 목록 카드는 문의마다 요청해야 해서 기본 아바타를 유지한다.
    - 상담 기록 패널: 별도 API 없이 대화와 같은 `GET /v3/help/thread?type=client` 응답의 스레드를 오래된 순으로 날짜·캠페인 카드(썸네일·이름·브랜드·코드 복사)·대화로 보여 준다. 삭제된 메시지는 "메시지가 삭제되었습니다."로 바꾸며 본 대화에도 같이 적용한다. 시안의 캠페인 유형("PICK형")은 캠페인 목록 응답에 없어 생략한다.
    - 아직 못 하는 것: 등록일 필터(날짜 인자 없음), 메시지 수정·삭제·인용 답장(API 없음).
  - **구매자 쓰기 비활성(2026-10-20 사용자 결정)**: 이번 범위는 구매자 대화의 틀(조회·표시)까지이고, 구매자 답장 전송과 상품 Q&A 답변 등록·수정·삭제는 `widgets/buyer-inquiry-workspace/model/constants.ts`의 `IS_BUYER_WRITE_ENABLED = false`로 꺼 둔다. 꺼져 있으면 답장·답변 입력창은 보이되 비활성이고 Q&A 수정·삭제 버튼은 숨긴다. 구현과 테스트는 남아 있고, 구매자 데이터가 있는 환경에서 전송·구매자 앱 도달·409 처리를 검증한 뒤 true로 켠다. 조회(대화·Q&A)는 그대로이며 탭으로 돌아오면 다시 받아 새 메시지를 보여 준다.
  - **구매자 문의 답장(2026-10-20)**: 구매자 대화(`type=client`)에서 가장 최근에 만들어진 스레드에 `POST /v3/help/thread/message`로 텍스트를 보내고(종료된 스레드면 서버가 새 스레드를 만들어 그 번호를 돌려주며 첨부도 그 스레드로 보냄), 파일은 업로드 스토어가 이어서 올리며 입력창 위에 진행 줄을 보인다. 대화 내역(스레드)이 없으면 보낼 곳이 없어 입력이 비활성이다. **구매자 앱이 이 답장을 받는지(알림·Firestore 상태 갱신)는 확인하지 못했다.** v2 광고주 앱의 "구매자" 모달은 상품 Q&A 게시판(`/help/qna`·`/help/reply`)뿐이라 구매자 문의 채팅의 선례가 없다.
  - **일반 문의 등록 후 Firestore NEW 신호는 쓰지 않는다(2026-10-20 확인)**: v2는 메시지 전송 직후 계정 문서에 `threadBoardType:1`, `newSenderUserIdx:1`을 쓰지만(`pushMessage`), 운영 앱(`origin/stage` `CustomerService.vue`·`customer.js`)에서 일반 문의의 NEW는 **미확인 탭이면 서버 목록(`/help/client-question?filterType=UNIDENTIFIED`)의 모든 카드에 무조건** 붙고, Firestore `newSenderUserIdx`로 NEW를 판단하는 것은 실시간 탭뿐이다. 알림 팝업도 `threadBoardType===0`(실시간)일 때만 뜬다. 그래서 일반 문의의 Firestore 쓰기는 화면 효과가 없고, 같은 계정 문서의 진행 중인 실시간 요청(`threadBoardType:0`)을 덮어써 운영 앱 실시간 대기 목록(`threadBoardType==0` 구독)에서 사라지게 할 위험만 있어 구현하지 않는다. 일반 문의가 미확인/확인 중 어느 탭에 보이는지는 운영 서버 분류(백엔드 요청 10번)에 달려 있고 프론트로 바꿀 수 없다.
  - **미구현(2026-10-20)**: 상담 기록 패널(전용 API를 Swagger에서 찾지 못함, 백엔드 요청 5번).
- 페이지네이션 목록은 `{list, pagingInfo: {totalCount, totalPage, size, page}}` 형태이며, `page`는 1부터 시작한다(Stage 명세). 페이지네이션 없는 목록과 단일 객체 `list`는 구분한다.
- **REST 날짜 형식은 API별로 다르다.** 스레드·메시지 `2026-10-01T10:00:00`(시간대 없음), 통합 목록·Q&A `2026-10-01 10:00`, 캠페인 패널 `2026.10.01 10:00`이다. 시간대·누락 처리를 확인한 뒤 트랜스포머에서 변환한다. 아래 Firestore의 기존 문자열 형식과 혼동하지 않는다.
- `POST /v3/help/thread/message`는 `{result, threadIdx}`를 반환하며, 요청한 스레드가 종료됐으면 새로 생성된 스레드 인덱스를 돌려준다. UI의 종료 후 전송 금지와 별도로 종료·전송 경합 시 처리 및 반환된 스레드 식별자 사용을 확인한다.

### Firestore (헬프데스크 상태·실시간 메시지)

2026-10-15에 광고주 v2(`bigbird-client-fe` `src/store/module/customer.js`, `BigbirdChatModal.vue`)와 운영 앱(`bigbird-operation-fe` `src/store/module/customer.js`, `ChatModal.vue`)의 Firestore 접근을 줄 단위로 전수 조사했다. 아래 계약은 그 결과다. `0.0.1/senderUserIdx/...` 경로는 두 앱 모두 주석 처리된 레거시라 쓰지 않는다.

**공유 범위와 원칙**

- 한 환경의 Firestore를 광고주 v2·광고주 v3·운영 앱(`bigbird-operation-fe`)·구매자 앱(`bigbird-market-fe`)이 함께 쓴다. dev는 `bb-dev-unity-helpdesk`, prod는 `bb-ops-unity-helpdesk`다. v3 stage는 dev 프로젝트를 쓴다.
- **기존 필드의 이름·타입·값의 의미를 바꾸지 않는다. 필드 추가만 한다.** v2 광고주 앱이 내려갈 때까지 v2·운영·구매자 앱이 같은 값을 읽는다.
- **v2의 버그는 따르지 않는다.** 다른 앱이 읽는 값은 같게 쓰되, 쓰는 방식은 고친다(아래 "쓰기 방식").
- **인증 없이 접근한다.** 헬프데스크 프로젝트는 익명 로그인이 꺼져 있어(`auth/admin-restricted-operation`) v3는 로그인을 시도하지 않는다(`shared/api/firebase.ts`). v2·운영 앱은 `signInAnonymously().catch(() => {})`로 시도하고 실패를 무시한 채 같은 방식으로 접근한다(2026-10-19 코드 확인: v2 `customer.js:55-57`, 운영 `customer.js:67-69`). 보안 규칙은 코드에서 확인되지 않으며 dev·ops 모두 `allow read, write: if true`로 전달받았다. 규칙을 좁힐 때 인증 방식을 따로 정한다. 설정은 `VITE_FIREBASE_*`로 받고, SDK는 고객센터에서 처음 쓸 때 동적 import한다(`shared/api`의 `getFirestoreDb`).
- 시각 필드는 기존처럼 클라이언트 로컬 시각 `YYYY-MM-DD HH:mm:ss` 문자열로 쓴다. 다른 앱이 이 형식으로 비교·표시한다.

**문서 구조**

| 문서 | 경로 | 단위 |
| --- | --- | --- |
| 상태 문서 | `helpdesk/0.0.2/threadUserIdx/{threadUserIdx}` | 사용자 1명(세션 `threadUserIdx`)당 1개. 모든 문의가 공유한다 |
| 상담 문서 | 상태 문서 `/sequence/{sequence}` | 실시간 상담 1건. **문의 남기기는 상담 문서를 만들지 않는다**(메시지는 REST에만 저장) |

**상태 문서 필드** (광고주 문서 기준)

| 필드 | 타입 | 실제 의미 | 쓰는 쪽 |
| --- | --- | --- | --- |
| `senderUserServiceType` | `'광고주'` | 문서 주인 종류. **다르면 v2·운영 앱이 문서 전체를 초기값으로 덮어쓴다** | 생성 시 |
| `userIdx` | number | 문서 주인 userIdx | 생성 시 |
| `newSenderUserIdx` | `1` \| 광고주 userIdx \| null | **이름과 달리 "읽어야 할 쪽"이다.** 1 = 운영자가 읽을 것이 있음, 광고주 userIdx = 광고주가 읽을 것이 있음, null = 없음 | 광고주: 1(보낼 때), null(읽음·종료). 운영 앱: 광고주 userIdx(보낼 때), null(열었을 때) |
| `threadBoardType` | 0 \| 1 \| null | 문서 종류가 아니라 **마지막 활동 종류**. 0 = 실시간, 1 = 문의 남기기 | 양쪽 |
| `alarmData` | object \| null | 데스크톱 알림 내용. 값이 있으면 "알림 미처리" 신호도 된다 | 광고주: 실시간 요청 시(운영자용). 운영 앱: 광고주용 알림, 처리 후 null |
| `msgResponseDate` | string \| null | 실시간 상담의 마지막 메시지 시각. 운영 앱 목록의 "최근 작성" | 양쪽 |
| `currentCampaignIdx` | number \| null | 진행 중 실시간 상담의 캠페인 | 광고주: 요청 시. 종료 시 null |
| `adminClose` | boolean | 운영자가 실시간 상담을 종료함. 광고주가 확인 후 false로 되돌린다 | 운영 앱: true. 광고주: false |
| `adminResponseUserIdx` | number \| null | 운영 앱의 상담원 응대 표시 | 운영 앱만. 광고주는 생성 시 null |
| `clientResponseUserIdx` | `"{userIdx}_{accountIdx}"` \| null | 광고주 회사 안에서 대화를 보고 있는 계정(응대 중 락) | 광고주만 |
| `created` / `updated` | string | 생성·갱신 시각 | 양쪽 |

**상담 문서 필드**

| 필드 | 타입 | 의미·주의 |
| --- | --- | --- |
| `sequence`, `threadIdx` | number | REST 값과 같아야 한다. 운영 앱은 REST 항목 위에 이 문서를 덮어써서 `threadIdx`까지 이 값을 믿는다. 문자열이면 매칭이 실패한다 |
| `boardType` | boolean | 실시간은 false |
| `isConnect` | boolean | 생성 시 false. 운영자 연결 시 true. **종료 시 v2 광고주는 true, 운영 앱은 false를 쓴다.** 상태는 항상 `finishTime`부터 판정한다 |
| `finishTime` | string \| null | 생성 시 반드시 null(undefined면 운영 앱이 열린 상담으로 보지 않음). 종료 시 시각 |
| `seqResponseDate` | string \| null | 이름과 달리 v2의 3분 타이머 기준 시각. 생성·운영자 연결 시 시각, 광고주 메시지 시 null |
| `campaignIdx`, `created` | | |
| `senderThreadUserIdx`, `senderUserIdx`, `senderUserServiceType` | | 생성 시 기록. 다른 앱은 읽지 않는다 |
| `messages` | array | 아래 형식 |

메시지 형식: `{auto, attachmentIdx, identifier, isUserMessage, body, fileName, fileType, created}`.

- `isUserMessage`는 광고주 관점이다(true = 광고주가 보냄). 운영 앱이 표시할 때 뒤집는다.
- `auto: true`이고 `body`가 `{`로 시작하면 캠페인 카드 JSON(`mainImageUrl, campaignCode, brandName, productName` 필수)이다. 운영 앱이 `JSON.parse`하므로 형식이 틀리면 운영 앱 화면이 깨진다.
- 첨부는 `fileType`에 `image`·`video`, video는 `fileName`이 `이름.확장자`여야 한다(운영 앱이 `split('.')`을 호출).
- `body`는 기존 데이터에 `<br/>`·`<a>` HTML이 섞여 있다. v3는 HTML로 렌더하지 않는다(동작 결정 "본문 렌더링").

**기존 공유 필드의 연동 참고값(복수 문의 계약 확정 전 적용 보류)**

아래 값만으로 복수 문의 호환이 보장되지 않는다. 사용자 단위 초기화가 다른 미처리 문의를 지우지 않는 계약을 먼저 확인한다.

| 시점 | 문서 | 쓰는 값 | 빠지면 | 범위 |
| --- | --- | --- | --- | --- |
| 고객센터 진입 | 상태 | 문서가 **없을 때만** 초기값 생성: `senderUserServiceType:'광고주'`, `userIdx`, `adminClose:false`, 나머지 상태 필드 null, `created`, `updated:null`. 있으면 건드리지 않는다 | 운영 앱 응대 표시가 동작하지 않음 | 1차 |
| 문의 남기기 생성 후, 메시지 전송 후 | 상태 | `threadBoardType:1`, `newSenderUserIdx:1`, `updated` | 운영 앱 목록이 자동 갱신되지 않음 | 1차 |
| 대화 열기(읽음) | 상태 | `newSenderUserIdx`가 내 userIdx일 때만 null, `updated` | 광고주 NEW 표시가 지워지지 않음 | 1차 |
| 실시간 상담 요청(`POST /help/thread` 성공 후) | 상태 | `currentCampaignIdx`, `threadBoardType:0`, `newSenderUserIdx:1`, `senderUserServiceType:'광고주'`, `alarmData`, `msgResponseDate`, `updated` | **`alarmData`가 없으면 운영자 데스크톱 알림이 오지 않음** | 실시간 |
| 같은 시점 | 상담 | 생성: `boardType:false`, `isConnect:false`, `finishTime:null`, `sequence`·`threadIdx`(REST 응답), `campaignIdx`, `seqResponseDate`, `created`, 첫 메시지(캠페인 JSON 또는 "기타문의") | 운영 앱이 상담을 열 때 오류로 이후 단계가 전부 멈춤 | 실시간 |
| 실시간 메시지 전송 | 상담 + 상태 | 상담: 메시지 추가. 상태: `threadBoardType:0`, `newSenderUserIdx:1`, `msgResponseDate`, `updated` | 운영 앱 목록 NEW·시각이 갱신되지 않음 | 실시간 |
| 실시간 종료(`PUT /help/thread/{threadIdx}` 성공 후) | 상담 + 상태 | 상담: 종료 메시지 + `finishTime`(이미 있으면 아무것도 쓰지 않음). 상태: `currentCampaignIdx:null`, `newSenderUserIdx:null`, `alarmData:null`, `updated` | 운영자에게 계속 열린 상담으로 보임 | 실시간 |

`alarmData` 형식(운영 앱 알림이 요구): `{id, callType:'client', threadUserIdx, userIdx, campaignIdx, title(필수), body('/'는 줄바꿈) | null, icon | null}`. v2는 `title`에 `{로그인 userId} 에서/ 상담을 요청하였습니다.`를 쓴다(`BigbirdChatModal.vue:947`의 `payload.userId`. 계정 이름이 아니다).

**구독**

- SWR `useSWRSubscription`으로 `onSnapshot`을 감싸고, 화면을 떠나면 해제한다(v2는 해제 코드가 실행되지 않았다. 아래 "v2에서 따르지 않는 것").
- 1차: 내 상태 문서 하나. `newSenderUserIdx`가 내 userIdx로 바뀌면 운영자가 답한 것이므로 목록·대화를 REST로 다시 불러온다.
- 실시간: 선택한 문의의 상담 문서를 **문서 단위로** 구독한다. v2처럼 `finishTime == null` 쿼리로 구독하면 종료 순간 결과에서 빠져(`removed`) 운영자 종료를 놓친다.
- 다른 사용자의 문서는 구독하지 않는다. v2는 모든 광고주 브라우저가 구매자 문서 전체를 제한 없이 구독했다.

**쓰기 방식**

- 상태 문서 생성은 트랜잭션 안에서 "없을 때만 만든다". v2처럼 `set`으로 덮어쓰지 않는다(그 사이 운영자가 쓴 값이 지워진다).
- 상태 문서 갱신은 필요한 필드만 `update`한다.
- **동시 전송 유실 방지(리뷰 4번):** 광고주 v2·v3·운영 앱의 동일 상담 문서 쓰기를 함께 수정한다. 메시지 추가는 트랜잭션 안에서 최신 상담 식별자·연결 상태·종료 여부를 확인한 뒤 수행한다. 읽어 둔 배열을 트랜잭션 밖에서 통째로 덮어쓰지 않는다. 텍스트뿐 아니라 첨부·자동 메시지·연결·종료 메시지 등 같은 배열을 변경하는 경로도 포함한다. `arrayUnion`만 적용하고 종료 여부 검사를 따로 하는 방식은 종료 후 전송을 막지 못한다.
- 전송 재시도는 동일한 전송 식별자를 사용해 이미 저장된 메시지를 중복 추가하지 않는다. 이 식별자는 전송 안정성용이며, 아래 컨펌 대기 중인 메시지 수정·삭제 기능의 공개를 의미하지 않는다. 필드명과 세 앱의 호환 계약은 쓰기 구현 전에 정의한다.
- **종료와 전송의 경합:** 종료 처리를 시작할 때 공유 상담 상태에 전송 차단을 먼저 반영하고, 이후 REST 종료 → Firestore 종료 확정 순으로 진행한다. 먼저 저장된 메시지는 보존하고 종료 처리 시작 후의 전송은 거절한다. `finishTime`이 이미 있으면 종료 메시지를 중복 추가하지 않는다. 종료 진행 상태의 필드·복구 규칙은 세 앱에서 동일하게 정의한다.
- REST 성공 후 Firestore만 실패하면 Firestore 단계만 복구한다. REST 응답 유실은 실패로 단정하지 않고 종료 여부를 재조회한다. 확인 전에는 상담을 임의로 다시 열거나 종료 요청을 무조건 반복하지 않는다. 생성도 REST에서 받은 식별자를 유지하고 이후 Firestore 생성 실패 때문에 REST 생성을 반복하지 않는다.
- 이미 쌓인 중복 종료 메시지(실데이터에서 한 상담에 3회)는 화면에서 거른다. 연속된 동일 auto 메시지는 하나만 표시한다.

**실시간 상담 상태 계약 (설계 초안 2026-10-19, 구현 전 v2·운영 코드 근거로 구체화)**

근거(현재 코드): v2 `customer.js:338-760`·운영 `customer.js:820-990`은 모두 `messages`를 읽어 통째로 `update`한다. 운영 `addOperMessage`는 `isConnect===false`만 보고 연결한다(만료·취소 검사 없음). v2 `BigbirdChatModal.vue:760-840`은 대기·무응답 모두 `180000`(3분)으로 자동 종료한다. 이 절의 필드는 모두 **추가 필드**이며 기존 필드(`isConnect`·`finishTime`·`messages`·`seqResponseDate`)의 의미는 바꾸지 않는다. 추가 필드가 없는 과거 문서는 기존 규칙으로 읽는다.

- 상담 문서(`.../sequence/{sequence}`) 추가 필드
  - `origin`: `"v3"` | `"v2"`. 생성 경로다. 없으면 `"v2"`로 본다. 만료 후 동작 구분은 열어 본 앱이 아니라 이 값으로 한다(v2가 v3 요청을 종료하지 않는다).
  - `waitDeadline`: 연결 대기 마감 시각(`YYYY-MM-DD HH:mm:ss`, 요청 시각 + 5분). 없으면 `created`(또는 `seqResponseDate`) + 5분으로 계산한다.
  - `canceledAt` / `expiredAt`: 취소·만료 확정 시각. 있으면 운영은 연결·전송하지 않는다. `origin:"v3"`는 만료돼도 `finishTime`을 쓰지 않고 `expiredAt`만 기록한다(실패 유지, 같은 문의 재시도). `origin:"v2"`는 만료 시 기존처럼 away 메시지 + 종료한다.
  - `closingAt`: 종료 시작 시각. 설정 후에는 모든 쓰기 경로가 메시지 추가를 거절한다. REST 종료 성공 후 `finishTime`과 종료 메시지를 같은 트랜잭션으로 확정한다. `closingAt`만 있고 `finishTime`이 없는 문서는 종료 재개 대상이다(REST 종료 여부를 재조회해 확정).
  - 메시지 `messageId`: 클라이언트가 만든 UUID. 같은 상담에 같은 `messageId`가 있으면 재시도로 보고 다시 추가하지 않는다. 없는 과거 메시지는 중복 검사에서 제외한다.
- 메시지 추가 규약(세 앱 공통): 트랜잭션에서 상담 문서를 읽고 ①문서 존재 ②`finishTime`·`closingAt`·`canceledAt`·`expiredAt` 없음 ③`sequence`/`threadIdx`가 호출자가 알던 값과 일치 ④연결 필요 메시지는 `isConnect` ⑤`messageId` 미중복을 확인한 뒤 `messages`에 **읽은 최신 배열 + 새 항목**을 쓴다(같은 트랜잭션이라 재시도 시 최신 값으로 다시 계산된다). 본문·첨부·자동·연결·종료·away 메시지 모두 이 함수만 거친다.
- 운영 연결: 같은 트랜잭션에서 `isConnect===false`, 마감 전, 취소·만료·종료 아님을 확인하고 연결한다. 실패하면 연결하지 않고 화면에 만료·종료를 알린다.
- 일반 문의 전환: ①대기 중 요청에 `canceledAt`을 트랜잭션으로 기록(이미 연결됐으면 실패 → 상담으로 복귀) ②REST 종료 ③일반 문의 새 thread 생성 ④첫 전송. 취소 후 ③ 이전 실패는 "요청 취소됨 + 일반 문의 미생성"으로 복구 가능해야 하며, 같은 화면에서 ③부터 재시도한다.
- 운영 앱 문의 선택: `openThread`는 "첫 미종료 문의"가 아니라 선택한 `threadIdx`/`sequence`로 정한다. 실시간 요청과 일반 문의가 함께 열려 있어도 연결 대상은 `boardType===false`이면서 취소·만료되지 않은 요청이다.
- 락 문서(`threadUserIdx/{id}`) 필드: 기존 `clientResponseUserIdx`("{user}_{account}"), `clientResponseSequence`, `clientResponseAt`에 더해 `clientResponseTabs`(`{tabId: 만료시각(ms)}`)를 둔다. 획득·갱신·해제는 트랜잭션: 다른 계정의 유효한(만료 전 탭이 하나라도 있는) 락이 있으면 거절, 같은 계정이면 내 탭만 추가·갱신, 해제는 내 탭만 제거하고 남은 탭이 없을 때만 `clientResponseUserIdx`를 비운다. 만료 판정은 `tabs`의 최대 만료시각 기준이며, 갱신 간격·만료 시간은 구현 시 상수로 정하고(초안: 15초 갱신 / 45초 만료) 실측으로 조정한다. 전송 트랜잭션도 내 탭이 유효한지 확인한다. 운영 앱은 이 필드를 쓰지 않으며 문서 갱신 시 `update`로 필요한 필드만 건드린다. v2도 `serviceStatusOnSnap`/`resetResStatus`/`closeChat`에서 계정 문자열만이 아니라 탭 소유권을 확인하도록 고친다.

**응대 중 락 (실시간 상담 전용, 사용자 확정 2026-10-15)**

- 같은 광고주 회사의 다른 계정(예: 서브 계정)이 **진행 중인 실시간 상담**(연결 대기 또는 연결됨, `finishTime` 없음)을 열고 있으면, 그 상담을 여는 계정에 "이미 상담이 진행 중입니다" Alert(`6790:107707`)를 띄운다. `취소`·`확인` 모두 대화에 들어가지 않고 목록으로 돌아간다.
- 문의 남기기와 종료된 상담에는 락을 걸지 않는다. **같은 계정이어도 다른 탭(다른 창·v3와 v2 동시)이 유효한 락을 가지면 두 번째 접속을 막는다**(사용자 결정 2026-10-20, 2026-10-15의 "같은 계정 다른 탭 허용"을 변경). 새로고침은 `sessionStorage`의 탭 ID로 같은 탭으로 본다. **알려진 한계:** 브라우저의 탭 복제·`window.open`·닫은 탭 복원은 `sessionStorage`를 복사하므로, 복제된 탭은 같은 탭으로 취급되어 차단을 우회한다(같은 기기 한정, 서로 다른 기기는 영향 없음). `navigation.type`으로 새로고침만 구분하는 방안은 브라우저별 동작을 확인하지 못해 적용하지 않았다. 탭 목록 없는 v2 락은 같은 계정에는 통과시켜 비정상 종료가 영구히 막지 않게 하며, v2 쪽 입장 검사(`overlapCheck`)는 아직 계정 단위라 v2를 두 번째로 열면 막히지 않는다(후속).
- 기존 필드 `clientResponseUserIdx`에 `"{userIdx}_{accountIdx}"`를 쓰고, 추가 필드 `clientResponseSequence`(잠근 상담의 sequence)와 `clientResponseAt`(마지막 확인 시각)을 함께 쓴다.
- **동시 입장·다른 창의 락 해제 방지(리뷰 5번):** 락 확인과 획득을 하나의 트랜잭션으로 처리한다. 다른 계정이 같은 상담에 동시에 들어오면 한 계정만 획득한다. 메시지 전송 시에도 최신 락 소유권을 확인한다.
- 락은 상담·계정·탭별 사용 여부를 구분한다(같은 계정의 두 번째 탭은 거절, 위 결정). 한 탭을 닫아도 남은 탭이 사용 중이면 락을 유지한다. 늦게 실행된 해제 요청이 새 소유자의 락을 지우지 않도록 해제 시점의 소유권도 확인한다.
- Firestore에는 연결이 끊기면 자동으로 지우는 기능이 없다. 상담을 보는 각 탭이 사용 중임을 주기적으로 갱신하고, 유효한 탭이 모두 사라진 락은 만료 처리한다. 강제 종료·네트워크 단절·백그라운드 탭을 고려한 갱신 간격과 만료 시간, 탭별 필드 구조는 쓰기 구현 전에 확정한다. 기존 `clientResponseAt` 하나만으로 여러 탭의 수명을 구분할 수 있다고 가정하지 않는다.
- **v2도 반드시 함께 수정한다.** v2는 이 필드를 배지뿐 아니라 입장 검사(`overlapCheck`)에 사용한다. `serviceStatusOnSnap`·`resetResStatus`는 같은 계정의 락을 초기화하고, `editBigbirdNewMessage('closeChat')`는 소유권 재확인 없이 해제한다. v2 진입·종료가 v3에서 사용 중인 락을 지우지 않도록 바꾼다. 운영 앱은 광고주 계정 락을 소유하지 않지만 공유 상태 갱신 시 해당 필드를 덮어쓰지 않아야 한다.

**추가 필드 (제안, 컨펌 대기)**: 메시지 수정·삭제·답장용이다. 컨펌 전에는 기존 필드만 쓴다.

- 메시지: `id`(uuid), `editedAt`, `deleteTime`, `deleteId`, `replyTo`
- 상담 문서: `clientReadAt`, `adminReadAt`
- 기존 메시지에는 `id`가 없다. 화면에서는 `created + 배열 인덱스`로 대체 키를 만들고, 수정·삭제는 `id`가 있는 메시지에만 허용한다.

**v2에서 따르지 않는 것**

- 정리 코드 미실행: v2는 2023-09-08 커밋 `a52d665d`에서 `beforeDestroy`가 `beforeUnmount`로 바뀌어(Vue 2는 이 이름을 모름) 구독 해제·락 해제·타이머 정리가 모두 실행되지 않는다. 운영 앱도 창을 `window.close()`로 닫아 같은 문제가 있다.
- 상태 문서 전체 덮어쓰기, 메시지 배열 읽고-통째로-쓰기, 종료의 3단계 분리 쓰기
- 모달이 닫혀 있으면 실패하는 알림 정리(`resetAlarmData`가 선택한 카드 데이터를 참조)
- 구매자 문서 전체 구독, 로그인 전 구독 시작

**v2·운영 앱 재검증 (2026-10-19, 위 계약을 코드와 줄 단위로 대조)**

위 계약의 필드·순서·종료 방식은 두 앱의 코드와 일치했다(v2 `customer.js:340-419`·`:530-600`, 운영 `customer.js:841-995`). 아래는 위에 없던 사실이다.

- 상태 문서 갱신은 `update`라서 문서가 없으면 실패하고, v2는 오류를 로그만 남긴 채 상담 문서 생성을 계속한다. 상태 문서의 초기 생성은 별도 함수(`createChatCollection`, `customer.js:945-963`)다.
- **운영 앱의 "열린 상담"은 REST 목록 기준이다.** `sequence` 오름차순 정렬 후 `finishTime === null`인 첫 항목이다(`customer.js:124-132`, `:267-271`). 문의 남기기(`boardType: true`)도 이에 걸리는데, 운영 앱의 연결·메시지 함수는 `boardType === false`일 때만 동작한다(`customer.js:822-826`, `:885-886`). **열린 문의 남기기가 실시간 요청보다 `sequence`가 앞서면 운영 앱이 새 상담을 열지 못할 수 있다**(정독으로 추정, 실행은 하지 않음). v3 정책은 열린 문의가 있어도 새 문의를 허용하고 자동 종료하지 않으므로 이 상황이 흔해진다.
- 운영 앱은 연결(`isConnect: true`)·메시지 추가·종료 모두 배열을 읽고 통째로 다시 쓴다(`arrayUnion`을 쓰지 않음). v2도 같다. v3가 트랜잭션을 써도 운영 앱이 덮어쓰면 메시지가 사라진다.
- 운영 앱은 대기 중인 요청을 **로컬에서 연 상담의 `isConnect === false`로만 판단**해 연결한다(`customer.js:841`). 만료·취소 표시가 없어 v3가 5분 뒤 실패로 보이게 해도 운영자가 뒤늦게 연결할 수 있다. 대기 만료·재시도·취소를 지원하는 필드나 API는 두 앱 어디에도 없다.
- v2의 3분 대기 타임아웃과 3분 무대화 종료는 **모달이 열려 있을 때만** 돈다(`BigbirdChatModal.vue:766-835`). 광고주가 메시지를 보내면 `seqResponseDate`가 null이 되어(`customer.js:621`) 그 뒤로는 자동 종료가 꺼지고, 운영자 메시지는 이 값을 갱신하지 않는다. 운영 앱에는 상담 자동 종료·대기 타임아웃이 없다(10분 모달은 운영자 자리비움용).
- 락(`clientResponseUserIdx`)에는 만료가 없고 확인과 쓰기가 두 단계라 동시에 들어오면 둘 다 통과한다(`BigbirdChatModal.vue:714-735`, `customer.js:811-816`, `:877`). 운영 앱은 이 필드를 읽지 않는다.
- v2는 진행 중인 문의가 있어도 코드에서 거절·종료하지 않는다. 막는 것은 화면뿐이다(`BigbirdChatModal.vue:195`). 서버 `/help/thread`의 거절 여부는 확인하지 못했다.

**실시간 상담 쓰기 착수 조건 (차단 사유)**

**2026-10-19 사용자 결정: 아래가 해소되기 전이지만 v3 쓰기를 켠다**(`IS_REALTIME_WRITE_ENABLED = true`). 운영 앱·v2 수정은 후속이며, 그 전까지 아래 항목은 **알려진 위험**이다: 동시 전송 유실(1), 운영 앱의 열린 상담 선택(2), 만료된 요청에 늦은 연결(3), 계정 단위 상태 문서 경합과 v2 타이머·락 해제(4). 요청·메시지·첨부 전송·종료·재시도·일반 문의 전환·락이 모두 해당한다. 원래의 착수 조건은 다음과 같다.

1. 메시지 유실: 위 쓰기 방식에 따라 v2·v3·운영 앱의 해당 상담 쓰기를 함께 수정하고 동시 전송·종료·재시도를 검증한다. 메시지 유실 허용을 대안으로 두지 않는다.
2. 운영 앱의 열린 상담 선택: 열린 문의 남기기가 실시간 요청을 가리지 않는 방법(운영 앱 수정 또는 서버가 실시간 요청 전 열린 문의를 정리하는 계약)이 필요하다.
3. 연결 대기 만료·재요청·취소의 계약: 필드(요청 시각, 만료·취소 표시)와 운영 앱이 만료된 요청에 연결하지 않는 방법, 기존 시퀀스를 정리하는 방식.
4. v2·운영 앱 동시 사용 시 계정 단위 상태 문서(`newSenderUserIdx`·`alarmData`)의 초기화 경합. 복수 문의 호환과 같은 절의 사항이다.
5. 테스트 데이터: stage 계정에 실시간 상담이 없어 실데이터로 검증하지 못했다. dev Firestore에 쓰는 검증은 사용자 승인이 필요하다.


## 동작 결정

요구명세서(기획)와 시안이 다르면 아래 결정이 우선이다.

- **LNB 클릭 시 최신 대화를 자동 선택한다**(사용자 확인, 2026-10-14). 시안 캡션 "LNB 클릭 시 최신 채팅 Focus"를 따른다. 문의가 없으면 빈 목록 상태를 표시한다. 특정 문의 URL로 직접 진입한 경우에는 해당 문의를 표시한다. 자동 선택된 문의가 상담 중이어도 PC(1440px 이상)에서는 대화가 보이므로 같은 응대 락을 적용해 다른 곳이 이미 상담 중이면 "이미 상담이 진행 중입니다" 알림을 띄운다(사용자 결정 2026-10-20). TAB·MO는 목록 뒤에 대화가 가려져 락을 잡지 않는다. 자동 선택 문의에서는 알림을 닫으면 그 자리에 남아 읽기 전용(입력 비활성)이고, 다른 문의로 옮겼다가 돌아오면 다시 띄운다. 주소로 직접 연 문의는 알림을 닫으면 목록으로 돌아간다.

- **구매자 상세 기본 표시**(사용자 정정, 2026-10-14)
  - 구매자 문의의 상세 정보는 대화 화면의 기본 구성이다. PC·태블릿에서는 대화 진입 시 상세 패널을 함께 표시한다(태블릿 시안 `6791:59544`).
  - 헤더·채팅 내역의 아바타나 사용자명을 클릭해야 상세가 열리는 동작은 적용하지 않는다.
  - 상세 정보는 현재 문의의 구매자·주문·캠페인 맥락을 사용한다. 출처별 조회 키는 백엔드 계약 확인 후 연결한다.
  - 모바일은 대화의 [상세 정보] 버튼으로 별도 상세 화면을 열고, 닫으면 해당 대화로 돌아온다(`6791:63874`, `6791:67081`). `?panel=detail`은 이 화면 상태를 표현하는 프론트 URL 계약이다. 태블릿을 모바일과 같은 별도 상세 화면으로 처리하지 않는다.
- **일반 문의 동작 확정(2026-10-19):** 열린 문의의 답변 여부와 무관하게 새 문의를 등록한다. 기존 문의 자동 종료와 1개 제한은 적용하지 않는다. 복수 일반 문의의 호환 검증 전까지 실제 등록 연동·공개는 보류한다. v2·운영 앱 무수정은 더 이상 전제가 아니다.
- **답변 완료와 종료를 구분한다.** 일반 문의는 운영자가 답해도 자동 종료하지 않으며 첫 전송 후 항상 읽기 전용이다. 종료 여부는 `finishTime`으로 판단한다. 일반 문의에 입력창·전송·종료 버튼을 두지 않는다. 기존 종료 이력은 "답변 완료"로 표시한다. 실시간 상담의 입력·종료 버튼 정책은 아래 별도 항목을 따른다.
- **빅버드 문의 표시 상태**: 기존 답변 대기·상담 중·답변 완료에 요청 실패를 포함한다(사용자 확인, 2026-10-14). 기존 상태는 시퀀스와 메시지로 계산하며, 요청 실패의 계산·저장 방식은 백엔드 협의 대상이다. 표시 태그와 목록의 상태 탭 분류는 구분한다.
  - 상담 중(`consulting`): 실시간 상담에 운영자가 연결됨(`isConnect`)
  - 답변 대기(`waiting`): 실시간 상담 연결 요청이 유효한 대기 중이거나, 문의 남기기의 마지막 메시지가 광고주 것. 연결 대기 시간이 만료된 요청은 `failed`로 표시한다.
  - 답변 완료(`done`): 문의 남기기의 마지막 메시지가 운영자 것, 또는 종료된 문의
  - 요청 실패(`failed`): 실시간 상담 연결에 실패한 상태. 목록과 대화 헤더 모두 **"요청 실패" 태그**를 표시하며, 헤더를 "답변 대기"로 표시하지 않는다. 실패 건의 상태 탭 분류는 미정이다.
  - auto 메시지(캠페인 카드, 인사말, 시스템 안내)는 "마지막 메시지" 판정에서 뺀다.
- **구매자 문의 상태**(기획 확인)
  - 답변 대기: 구매자가 문의하고 답이 없음
  - 답변 완료: 광고주가 답함
  - **재문의 상태는 없앤다**(디자인 변경, 2026-10-19 사용자 전달·백엔드 공유됨). 탭·배지 모두 없으며, 답변 뒤 구매자가 다시 보낸 문의는 답변 대기로 본다. Figma의 재문의 탭·배지·"구매자 재문의 상담" 화면(`6790:105495`)은 구현하지 않는다.
  - V3 통합 목록(`GET /v3/help/inquiry`)은 `WAITING | ANSWERED`를 정의한다. Stage 실호출에서 답변 대기와 답변 완료, 구매자 문의와 상품 Q&A 항목을 확인했다.
- **새 문의 흐름**(요구명세서)
  - 기타 문의: 유형 → 방식 → 입력창
  - 캠페인 문의: 유형 → 캠페인 목록 → 방식 → 입력창
  - 문의 남기기는 **첫 메시지를 보낼 때 문의를 생성**하고, 상태는 답변 대기다.
  - 실시간 상담하기는 버튼을 누르면 연결을 요청한다.
  - 운영자가 연결되면 실시간 대화 화면으로 바뀌며 입력이 가능하다. 문의 남기기의 읽기 전용 정책과 구분한다.
- **새 문의의 캠페인은 단일 선택으로 확정한다**(사용자 확인, 2026-10-14). 전체 선택은 제공하지 않고, 행 선택은 라디오처럼 동작한다. 다른 캠페인을 선택하면 기존 선택이 해제된다. 생성 요청에는 선택한 `campaignIdx` 하나만 전달한다.
- **실시간 상담 연결 대기는 5분이다**(요구명세서). v2의 "미연결 3분이면 부재 메시지를 남기고 종료"를 대체한다.
  - 5분 안에 연결되지 않으면 시안의 연결 실패 카드를 표시한다. 카드에는 안내 문구, [재시도], [문의 메세지로 남기기] 버튼이 있다.
  - **실패만으로 문의를 종료하지 않는다**(사용자 확인, 2026-10-14). 문의 기록은 유지하되 해당 연결 요청의 대기는 만료된 것으로 취급한다. 만료된 요청에 상담원이 뒤늦게 연결되지 않도록 백엔드·운영 앱과 처리 계약을 확인한다.
  - [재시도]를 누르면 **기존 문의로 연결을 다시 요청**한다. 새 문의를 만들지 않으며, 재요청이 접수된 시점을 기준으로 5분 대기를 다시 시작한다.
  - [문의 메세지로 남기기]를 누르면 **실시간 연결 요청을 취소·정리하고 일반 문의 작성으로 전환**한다. 전환이 완료되면 입력창·전송 버튼을 활성화하고, 첫 메시지를 전송할 때 기존 일반 문의 REST API로 접수한다.
  - 연결 실패 카드 시안은 기존 PC 대조 기록에서 확인됐다. 별도 실패 토스트를 임의로 추가하지 않는다. 목록과 대화 헤더에는 "요청 실패" 태그를 표시한다. **입력창·전송 버튼은 상담 요청 중과 연결된 뒤에 활성화한다**(사용자 결정 2026-10-19, 2026-10-14의 "요청 중 disabled"를 변경). 연결 전에 보낸 메시지는 상담 문서에 쌓이며 연결 대기 마감(5분) 전까지만 받는다. **요청 실패·종료·응대 락을 잃은 상태에서는 disabled**이고, 이 상태에서 메시지 전송으로 문의 남기기에 자동 전환하지 않는다. Enter로 전송하고 Shift+Enter로 줄바꿈하며, 한글 조합 중 Enter는 전송하지 않는다. 전송이 저장에 성공할 때만 입력을 비우고 새 메시지에 맞춰 대화를 맨 아래로 스크롤한다. 첨부는 서버 제한 계약 확정 전이라 비활성이다. **실시간 상담 대화에도 일반 문의와 동일한 캠페인 정보 카드를 표시한다**(사용자 결정 2026-10-21, 기존 숨김 결정 변경). v3 실시간 요청은 캠페인 문의일 때만 캠페인 카드 JSON을 첫 auto 메시지로 Firestore에 쓴다. 운영 앱·v2 대화는 이 메시지로 카드를 그리며, 없으면 운영 앱에 카드가 보이지 않는다(2026-10-19 실제 확인). 기타 문의는 `기타문의` 안내를 보내지 않는다(빈 `messages`로 시작). v3 화면도 이 카드를 일반 문의와 같이 그린다(사용자 결정 2026-10-21, 이전 2026-10-19 숨김 결정을 변경). 요청 중·연결 중·요청 실패에서 보일 메시지(캠페인 카드 포함)가 없으면 빈 영역으로 두고, "상담 메시지가 없습니다" 안내는 종료된 상담의 이력이 비어 있을 때만 보인다. [재시도]·[문의 메세지로 남기기]는 실패 카드의 별도 동작으로 유지한다.
  - 실패 카드 안내는 시안(`9298:260501`)을 따른다: 본문 **"문의를 남겨주시면 확인 후 순차적으로 답변드립니다."**, 작은 글씨 **"문의 메시지 답변은 고객 문의 상황에 따라 지연될 수 있습니다."**(2026-10-19 시안 재확인, 이전 "상담 연결에 실패했습니다…" 문구는 시안에 없어 폐기).
  - 제품 흐름은 확정이며, 연결 대기 만료·재요청·취소를 지원하는 API·Firestore 필드와 기존 시퀀스의 정리 방식은 백엔드·운영 앱과 확인한다. 실시간 요청 정리가 실패하면 일반 문의 전환 완료로 처리하지 않으며, 전환 후 이전 요청으로 상담원이 연결되지 않아야 한다.
- **연결 후 자동 종료**: 대화가 없는 상태가 3분 이어지면 종료한다(요구명세서).
  - 기준은 마지막 메시지의 작성 시각이다(양쪽 메시지 모두). v2는 첫 메시지 전까지만 셌다.
  - 타이머는 광고주 클라이언트에서 돈다.
  - 운영자가 종료하면(`adminClose`) 종료 안내를 띄운다.
- **실시간 상담 종료 버튼**은 기존 PC 시안의 `상담 종료` 버튼을 따른다. 임시 위치를 만들지 않는다. 이미 완료된(종료된) 상담에서는 버튼을 disabled 처리해 중복 종료를 막는다.
- **메시지 수정·삭제 (제안, 컨펌 대기)**: 본인 메시지이고, 상대가 아직 읽지 않았고, 문의가 종료되지 않았을 때만 할 수 있다. 수정과 삭제 조건이 같다.
  - 읽음 판정
    - 문의 남기기·구매자 문의: 메시지의 `readTime`
    - 실시간 상담: 시퀀스의 `adminReadAt` 이후 시각인지
    - 상품 Q&A 답변: `replyInfo.readTime`
  - 수정한 메시지는 "편집됨"으로 표시한다.
  - 삭제는 소프트 삭제(`deleteTime`)이고, 삭제된 메시지는 양쪽 모두 숨긴다(v2의 `deleteTime` 숨김 규칙과 같음).
  - 확인 다이얼로그 문구는 v2 "삭제된 답변은 복원이 불가능합니다"를 메시지에 맞게 고쳐 쓴다.
- **입력 제한**
  - 최대 3,000자, 글자 수를 표시한다.
  - **첨부는 Figma 기준을 따른다**(사용자 확인, 2026-10-14). 이미지는 `jpg jpeg png webp`, 동영상은 `mp4`만 허용한다.
  - 용량은 **이미지 파일당 30MB, 동영상 파일당 50MB**, 개수는 한 번에 담는 파일을 **합쳐서 최대 10개이고 동영상은 그중 최대 5개**다(사용자 지시 2026-10-20, 이전의 "이미지 10개·동영상 5개를 따로 센다"를 변경). 합계를 넘으면 "파일은 최대 10개" 안내(이미지 개수 초과 문구)를 쓴다. 썸네일이 늘어도 입력창이 화면을 넘지 않게 두 줄 높이(164px)까지만 보이고 스크롤한다(시안은 한 줄 3개만 있음). 안내 문구도 유형별 제한에 맞춘다.
  - 시안의 공통 "파일당 30MB" 문구는 유형별 용량 안내와 불일치하므로 문구 정리가 필요하다. v2의 제한은 이미지 10MB·동영상 20MB이며, 서버의 새 제한·형식·다중 및 혼합 첨부 지원 여부는 확인해야 한다.
  - 첨부는 드래그 앤 드롭과 붙여넣기도 지원한다.
  - **선택한 파일은 별도 미리보기·업로드 진행 UI 없이 입력창의 썸네일로만 보여 준다**(사용자 결정 2026-10-20, 시안 `8023:417562`). 업로드 진행·파일별 오류 표시 시안은 없으므로 만들지 않는다. 썸네일 삭제는 별도 시안은 없지만 디자인 시스템 File List Thumbnail의 hover 삭제 버튼을 그대로 쓴다. 업로드는 전송할 때 하며(사용자 결정 2026-10-20), 문의 남기기는 문의 생성 → 캠페인 카드 → 본문까지만 기다리고 **바로 대화 화면으로 이동한다**(사용자 지시 2026-10-20). 파일은 그 뒤 백그라운드(`entities/inquiry`의 업로드 스토어)에서 하나씩 올려 메시지로 보내고, 대화 화면 아래에 진행 줄(진행 개수와 바)을 보여 주며 모두 끝난 뒤 한꺼번에 대화에 나타난다. 중간에 실패하면 남은 개수와 [다시 시도]를 보여 주고 실패한 파일부터 이어 보낸다. 새로고침하면 진행 중인 업로드는 사라진다. 실시간 상담은 파일을 모두 올린 뒤 한 번의 저장으로 보낸다. 구현: `entities/inquiry`의 `useInquiryAttachments`·`AttachmentTextField`(실시간·구매자 입력창도 같은 컴포넌트를 쓴다), 문의 남기기에 먼저 연결(2026-10-20). `{service}`는 `ATTACHMENT_UPLOAD_SERVICE`(임시 `help`)이며 백엔드 답변 대기.
  - **첨부 오류 Alert(용량·형식·개수 초과)의 버튼은 시안의 빨간 "삭제"가 아니라 파란 "확인" 하나만 둔다**(사용자 결정 2026-10-20, 취소 버튼 없음). 오류 안내라서 삭제 의미가 맞지 않기 때문이다. 시안과 다른 점이라 디자인팀에 공유한다.
- **다운로드**: 작성 후 14일이 지나면 받을 수 없고, 안내 다이얼로그를 띄운다(v2 동일).
- **본문 렌더링**: 메시지는 HTML로 렌더하지 않는다. v2는 `v-html`을 써서 XSS 위험이 있었다. 링크 자동 변환은 렌더할 때 텍스트를 토큰화해서 처리한다. 기존 데이터에 남아 있는 `<br/>`·`<a>`는 텍스트로 변환한다. 구현(2026-10-20): `entities/inquiry`의 `toPlainBody`가 `<br>`를 줄바꿈으로, v2가 URL·이메일에 붙인 `<a class="autoLink" ...>원문</a>`(v2 `BigbirdChatModal.vue:1048-1055`)을 태그만 벗겨 원문으로 바꾼다. 대화 메시지와 구매자 목록·Q&A 본문에 적용한다. 링크로는 다시 만들지 않는다(링크 자동 변환은 후속).
- **상태별 화면**: 시안에 있는 상태(빈 목록, 검색 결과 없음, 로딩, 상담 요청 중, 연결 실패 카드, 알림 다이얼로그, 토스트)를 모두 구현한다. 목록이나 대화 API가 실패해도 다른 패널은 계속 동작하게 각 패널에 지역 에러 바운더리를 둔다.

## 범위 밖

- 전체 앱 메뉴·대시보드·포인트·알림 벨: 후속 홈 작업에서 만든다. 현재는 홈·고객센터 이동에 필요한 사이드바와 헤더만 연결했다.
- 브라우저 알림과 알림 클릭 진입(v2의 `?threadUserIdx&callType&id`): 헤더 알림 방식이 미정이다. 다만 URL로 특정 문의에 바로 들어가는 것은 지원한다.
- 인사이트 등 다른 화면에서 빅버드 문의 채팅 열기(v2 `insightCustomerServiceModal`)
- 실시간 상담 운영시간 체크: v2에서도 꺼져 있다.
- **구매자 문의의 새 문의 생성은 지원하지 않는다**(사용자 확인, 2026-10-14). 목록·대화·첨부 화면 모두 `새 문의` 버튼을 표시하지 않는다. 첨부 채팅 시안(`5198:109440`)의 해당 버튼은 구현 대상에서 제외하며, 구매자 문의 생성 API도 요청하지 않는다.
- v2·운영 앱의 실시간 상담 호환 수정은 포함한다. 운영 앱 전체 개편과 마켓·인플루언서 앱의 기능 변경은 이번 범위 밖이며, 공유 코드 변경의 회귀 영향은 확인한다.

## 선행 조건 · 외부 의존

- **복수 일반 문의 호환(현재 차단 사항)**
  - 사용자 전달(2026-10-19): 백엔드에 요구가 반영되지 않았다. 기존 API의 지원 범위와 v2·운영 앱의 필요한 호환 수정을 구분해 확인한다.
  - 추가 생성 시 자동 종료·재사용·거절 여부, 미확인 목록 판정, A를 유지한 B 답변 방법, 종료·전송 경합 및 Firestore 상태 반영 책임을 확인한다.
  - 계정 단위 NEW가 초기화되어도 미처리 문의를 발견할 수 있어야 한다. 첫 열린 문의 ID로 전송한 답변을 서버가 임의로 다른 문의에 붙이는 방식을 안전한 호환으로 간주하지 않는다.
  - 운영 앱의 정확한 문의 선택·선택한 threadIdx 기반 답장·문의별 미처리 보존은 호환 수정 대상이다. 세부 구현과 배포 순서는 설계·검증 후 정한다.
  - `feat/firebase`의 `f5a4c1f`는 SDK 초기화 기반이며 복수 문의 호환을 제공하지 않는다. 이번 검토에서 백엔드 소스나 인증된 생성 실험은 확인하지 않았다.
- **실시간 상담 구현 의존 및 메시지 편집의 후속 의존**
  - 메시지 수정·삭제·인용 답장은 기능 승인, 읽음 계약, 운영 앱 표시 호환이 확인되기 전 활성화하지 않는다.
  - 연결 대기 만료·기존 문의 재시도·일반 문의 전환 시 요청 취소는 백엔드·운영 앱과 계약을 확인한다. 필요한 v2·운영 앱 호환 수정은 현재 범위에 포함한다.
  - 기존 조사에서 확인한 운영 앱 개선 후보는 별도 후속 과제로 보존한다: 창 닫기 시 응대 정리, 종료 알림 인자 오류, 메시지 배열 덮어쓰기, v-html 렌더, 구독 해제. 이 중 실시간 상담 호환에 필요한 수정은 현재 범위에 포함한다.
  - 편집됨·답장·삭제 표시, 실시간 읽음 adminReadAt, 메시지 트랜잭션은 해당 기능 공개 전 호환 확인이 필요하다. 필요한 운영 앱 대응이 완료되기 전 실시간 수정·삭제·답장은 활성화하지 않는다.
  - 운영 측 미결 질문: 삭제된 메시지 표시 방식(현재 삭제됨·deleteId 표시), 광고주/운영자 종료 구분 필드, replyTo 구조. 과거 Firestore 수정 브랜치의 반영 상태는 작업 시 다시 확인한다.
- **마켓(구매자 앱)**: 광고주가 수정·삭제한 답변이 구매자 화면에 어떻게 보이는지는 미확인이다. 공유 상태 변경 시 호환성도 확인하며, 수정 없이 동작한다고 단정하지 않는다.
- **인플루언서 앱**: 같은 경로에 메시지를 쓰므로 트랜잭션 전환이 필요하다.
- **백엔드 신규·확장 요청 및 계약 확인**: [고객센터 API 문서](../../docs/customer-center-api.md)에 정리한다.
  - 광고주용 REST 메시지 수정·삭제 API: 현재는 운영 앱의 `POST /help/message/hide`만 있고 수정 API는 없다.
  - REST 메시지의 답장(`replyTo`) 필드
  - 통합 목록(`GET /v3/help/inquiry`): 새 메시지 여부·등록일 기간 필터, nullable 상세 조회 키의 예외 처리
  - `/v3/help/c-purchaser-questionInfo/{orderNumber}`·`/v3/help/c-campaign-question`에 없는 연락처·주문일·결제 금액·캠페인 이미지·기간·진행 상태·인플루언서 명단의 조회 출처 또는 확장(백엔드도 공백으로 명시)
  - 첨부 서버 지원: 이미지 30MB·최대 10개, 동영상 50MB·최대 5개, JPG·JPEG·PNG·WebP·MP4, 다중·혼합 첨부
  - 상품 Q&A 답변 글자 수 제한(v2는 500자, 새 디자인은 3,000자)
- 백엔드 API가 나오기 전에는 해당 UI 동작을 숨기고, 연동 지점만 남긴다. 숨기는 대상은 REST 메시지 수정·삭제·답장과, 상세 패널에서 데이터가 없는 칸이다. 문의 남기기의 수정·삭제도 기능 승인·읽음 계약·서버 지원·연동 앱 표시의 호환성을 확인한 뒤 활성화한다. API 존재만으로 컨펌 대기를 해제하지 않는다.

## 미해결

- 복수 문의를 지원할 기존 API의 동작 확인과 v2·운영 앱 호환 수정·검증 일정. 무수정 전제는 해제했다.
- 운영 `/help/client-question`의 UNIDENTIFIED·CHECK 판정과 미처리 보존, 문의별 답변 대상·종료 범위·상태 갱신 계약.
- 연결 대기 만료·재요청·취소의 API·Firestore 계약과 시퀀스 정리 방식(백엔드·`bigbird-operation-fe`). v2·운영 앱 코드에 해당 필드·API가 **없음**을 확인했다(2026-10-19). 운영 앱은 만료된 요청에도 뒤늦게 연결할 수 있다. 실패 시 문의 유지 → 기존 문의 재시도 또는 일반 문의 전환 흐름은 확정
- 연결 실패 화면: 실패 건의 상태 탭 분류(현재 임시로 전체 탭에서만 보인다). 목록·대화 헤더의 "요청 실패" 태그와 요청 실패 중 입력창·전송 버튼 disabled 처리는 확정(요청 중에는 입력·전송 가능, 2026-10-19 변경)
- 구매자 문의 `UNIDENTIFIED`/`CHECK`의 서버 분류 기준. 답변 상태와 동일하다고 추정하지 않는다.
- 시안의 "답장"이 인용 답장인지(디자이너 확인)
- 응대 중 락의 갱신 간격과 만료 기준(예: 30초마다 갱신, 1분 넘게 멈추면 만료). 기존 v2·운영 앱 락에는 만료가 없고 확인과 쓰기가 비원자적이다. 실시간 쓰기 구현 시 확정한다.
- 실시간 상담 쓰기 착수 조건 5가지(메시지 유실, 운영 앱의 열린 상담 선택, 대기 만료 계약, 상태 문서 경합, 테스트 데이터): Firestore 절의 "실시간 상담 쓰기 착수 조건" 참조.
- "이미 상담이 진행 중입니다" Alert 본문의 "다른 상담원"은 실제로는 같은 회사의 다른 계정을 뜻한다. 문구 수정 여부(기획·디자인 확인)
- 구매자 문의에서 v2 광고주 앱은 **구매자의 상태 문서**에 `adminClose`, 락, `threadBoardType:1`·`newSenderUserIdx:1`을 쓴다. 구매자 앱(`bigbird-market-fe`)과의 계약은 구매자 문의 구현 때 같은 방식으로 조사해 정한다.
- 구매자 상담 기록의 조회 범위·키. PC는 상세 패널 자리를 상담 기록으로 전환하는 시안(`6766:48765`), 모바일은 별도 상담 기록 화면(`6791:67526`)이 있다. 같은 구매자의 어느 캠페인·문의까지 포함하는지는 연동 계약 확인 대상이다.

## 종단 간 검증

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

화면 시나리오는 stage 백엔드와 Firebase(dev 프로젝트)로, 360·768·1440 폭에서 각각 확인한다.

1. **문의 남기기**: 캠페인 문의 → 캠페인 1개 선택 → 문의 남기기 → 첫 메시지를 보낸다. 전체 선택이 없고 다른 캠페인을 선택하면 기존 선택이 해제되며, 생성 요청에 `campaignIdx` 하나만 전달되는지 확인한다. 목록 맨 위에 "답변 대기"로 보이는지, 운영 앱에서 캠페인 카드와 메시지가 보이는지 확인한다.
2. **복수 문의·v2 호환(연동 재개 조건)**: A가 답변 대기·답변 완료인 각각의 상태에서 B를 만들고 A가 유지되는지 확인한다. 같은 캠페인·다른 캠페인·기타 문의를 포함한다. A만 읽거나 답해도 B가 미처리 목록에 남고 A를 닫지 않은 채 B에 정확히 답할 수 있어야 한다. v2 열람·메시지 전송·새로운 문의와 운영 X 닫기·재진입 후에도 답변 연결과 미처리 상태가 보존돼야 한다. 첫 전송 후 모든 일반 문의 대화에 입력창·전송·종료 버튼이 없는지 확인한다.
3. **실시간 상담**: "상담 요청 중"과 "답변 대기" 뱃지가 뜨고 입력창·전송 버튼이 활성 상태인지 확인한다. 연결 전에 보낸 메시지가 운영 앱에서 연결 뒤에도 유지되는지, 대화에 캠페인 카드가 그려지는지 확인한다(2026-10-21 결정으로 실시간에서도 표시).
   - 운영 앱이 연결하면 "상담 중"으로 바뀌고 입력이 열리는지, 메시지가 양쪽에 실시간으로 보이는지 확인한다.
   - 5분간 연결이 없으면 시안의 연결 실패 카드와 목록·대화 헤더의 "요청 실패" 태그가 표시되는지 확인한다. 실패 상태에서는 입력창·전송 버튼이 disabled 상태이고 메시지를 전송할 수 없는지 확인한다. 실패만으로 문의가 종료되지 않는지도 확인한다.
   - [재시도]는 기존 문의로 재요청하고 대기 시간을 다시 5분으로 시작하는지 확인한다. 만료된 이전 요청으로 뒤늦게 연결되지 않아야 한다.
   - [문의 메세지로 남기기]는 실시간 요청을 정리한 뒤 일반 문의 입력을 활성화하는지, 첫 메시지가 REST로 접수되는지 확인한다. 요청 정리 실패 시 전환 완료로 표시하지 않고, 전환 후 이전 실시간 요청으로 연결되지 않아야 한다.
   - 연결 후 3분간 대화가 없으면, 그리고 종료 버튼을 누르면 목록·헤더 모두 "답변 완료"가 되고 종료 안내가 표시되며, 입력창·전송·종료 버튼이 disabled 상태인지 확인한다.
   - 일반 문의의 답변 완료는 실제 종료와 구분하며, 읽기 전용 정책은 위 2번에서 별도로 검증한다.
4. **수정·삭제** (컨펌 후): 운영자가 읽기 전에는 본인 메시지를 수정해 "편집됨"이 붙는지, 삭제하면 양쪽에서 사라지는지 확인한다. 읽은 뒤에는 툴바에 수정·삭제가 없는지 확인한다.
5. **응대중 락**: 두 계정(같은 광고주의 MASTER와 SUB)으로 같은 문의를 열면, 두 번째 계정의 입력이 막히는지 확인한다.
   - 두 계정이 동시에 입장해도 한 계정만 락을 획득한다.
   - 같은 계정으로 v3 상담 중 v2에 접속해도 락이 풀리지 않는다. 같은 계정의 탭 두 개 중 하나를 닫아도 남은 탭의 락은 유지된다.
   - 마지막 탭 종료·강제 종료·연결 단절 뒤 락을 정상 해제하거나 정해진 시간 후 회수한다. 이전 탭의 늦은 해제가 새 소유자의 락을 지우지 않는다. 락을 잃은 탭은 전송하지 못한다.
   - **동시 쓰기(리뷰 4번):** v2↔운영, v3↔운영, 같은 계정의 v2↔v3 동시 전송에서 모든 메시지가 한 번씩 남는다. 첨부·자동 메시지도 포함한다. 전송과 종료가 겹치면 먼저 저장된 메시지는 보존하고 종료 처리 시작 후 전송은 거절한다. REST 종료 성공 후 Firestore 실패·응답 유실·재진입을 재현해 중복 전송·중복 종료 없이 복구되는지 확인한다.
6. **첨부**: 이미지 30MB·동영상 50MB의 용량 경계와 초과, 이미지 10개·동영상 5개의 개수 경계와 초과를 확인한다. JPG·JPEG·PNG·WebP·MP4만 허용하는지, 허용하지 않는 형식과 14일이 지난 첨부 다운로드에서 안내가 표시되는지도 확인한다. 다중·혼합 첨부 전송은 백엔드 계약 확정 후 검증한다.
7. **XSS**: 메시지 본문에 `<img src=x onerror=alert(1)>`을 보내면 텍스트로만 보이는지 확인한다.
8. **구매자 문의**: 구매자 문의와 상품 Q&A가 한 목록에 섞여 나오는지 확인한다. 상품 Q&A에 답변을 등록·수정·삭제하고, 읽힌 답변은 수정할 수 없는지 확인한다. 구매자 문의의 목록·대화·첨부 화면에 `새 문의` 버튼이 없는지 확인한다.
9. **상세 기본 표시·모바일 이동**: PC 구매자 대화 진입 시 별도 클릭 없이 구매자·주문·캠페인 상세 패널이 표시되고, 다른 문의를 선택하면 해당 문의의 정보로 바뀌는지 확인한다. 아바타·사용자명 클릭을 상세 표시 조건으로 두지 않는다. 태블릿은 대화·상세 동시 표시, 모바일은 [상세 정보] 진입·닫기를 검증하고, 뒤로가기로 대화·목록에 돌아왔을 때 탭·검색어·필터가 유지되는지 확인한다.
10. **LNB 진입**: 문의가 있으면 최신 대화가 자동 선택되는지, 문의가 없으면 빈 목록이 표시되는지 확인한다. 특정 문의 URL로 직접 진입하면 해당 문의를 표시하는지도 확인한다.
11. **권한**: `isCustomerServiceAccess=false`인 SUB 계정은 접근이 막히는지 확인한다.

구현이 끝나면 이 스펙은 계약·결정 요약만 남긴다. 같은 변경에서 `docs/pages.md`의 화면 표와 `MIGRATION.md`도 갱신한다.

### 2026-10-21 광고주 문의 디자인 대조 반영

- 실시간 캠페인 문의에서도 생성 시 전송된 캠페인 정보 카드를 일반 문의와 동일하게 표시한다. 기존 실시간 카드 숨김 결정(2026-10-19)을 변경한다. 기타 문의에는 캠페인 카드를 보내지 않는다.

- 캠페인명은 한 줄 말줄임으로 표시해 긴 이름에서도 행 높이를 유지한다. 첨부 이미지 묶음은 빈 격자 열을 접어 발신자 쪽에 정렬하며, 여러 줄이면 마지막 줄은 첫 칸부터 채운다.
- 상담 요청·실패·완료 안내 카드가 있으면 PC·태블릿에서도 대화 상단 여백을 유지해 첫 메시지가 카드 아래에서 시작한다.
- 캠페인 선택은 디자인 시스템의 사각 Checkbox를 사용하며 한 번에 하나만 선택한다. 다른 캠페인을 선택하면 기존 선택을 해제하고, 선택된 항목을 다시 누르면 선택을 해제한다. 단일 선택이므로 전체 선택은 제공하지 않는다.
- 캠페인 시작일·종료일(`progressStartDate`·`progressEndDate`)은 백엔드가 `GET /v3/help/c-client-campaign` 응답에 반영해 연결했다(2026-10-21): 새 문의 표의 기간과 캠페인 카드(대화·상담 기록)에 `yyyy.MM.dd ~ yyyy.MM.dd`로 보인다. 대화의 캠페인 카드는 메시지에 기간이 없어 캠페인 코드로 이 목록에서 찾아 채운다. 캠페인 유형은 아직 응답에 없어 표시하지 않는다.
