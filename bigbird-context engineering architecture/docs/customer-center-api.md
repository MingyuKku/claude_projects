# 고객센터 API — 기존 활용과 추가 개발 요청

> **최신 결정(2026-10-19):** 문의 남기기는 첫 전송 후 입력창 없는 읽기 전용 대화다. 열린 문의와 무관하게 새 문의를 허용하며 기존 문의를 자동 종료하지 않는다. v2 병행 사용은 필수이며, 실시간 상담 호환에 필요한 v2·운영 앱 수정은 현재 작업 범위다. v3 실시간 상담은 Figma 기준이며 연결 대기는 두 앱 모두 5분으로 통일한다. 과거 상담의 v3 이관은 제외하고 v2·운영의 기존 기록은 유지해도 된다. 사용자 전달에 따르면 백엔드에 호환 요구가 미반영되어 복수 문의 등록 연동·공개를 보류한다. 서버만으로 해결 가능한지와 수정 범위는 미확정이다. 아래 과거 조사 기록보다 이 결정과 5장의 최신 범위를 우선한다.

> **Stage 재검증(2026-10-19):** 아래 V3 절은 이 갱신을 우선합니다. 인증된 호출에서 `GET /v3/help/inquiry?status=ALL&sourceType=ALL&page=1&entrySize=20`과 `GET /v3/help/thread`가 HTTP 200으로 응답했습니다. 통합 목록 항목에는 구매자용 `threadUserIdx`와 상품 Q&A용 `userIdx`가 nullable로 추가됐고, 상태는 `WAITING | ANSWERED`입니다. 스레드에는 `status: WAITING | IN_PROGRESS | ANSWERED`가 추가됐으며 같은 값의 `status` 쿼리(`ALL` 포함)로 필터링합니다. 구매자 대화·상담 기록은 목록의 `threadUserIdx`로 `type=client` 조회합니다. 캠페인 `brandName`은 값이 없으면 빈 문자열이라는 새 계약입니다. 아래의 "TODO 상태", "상태값 없음", "상세 진입 키 없음", "type 미정" 서술은 이전 조사 기록입니다. Stage 인증 계정의 캠페인 목록은 비어 있어 과거 null 사례 네 건의 실응답은 재검증하지 못했습니다.

> 2026-10-14 · 백엔드 협의용 초안 · 2026-10-16 V3 API 반영

**기본 문의·대화와 통합 목록·필터는 V3 API를 사용합니다. 상세 정보·읽음·첨부 등은 기존 지원 범위를 더 확인해야 합니다.**

아래 표는 **기능별 작업 목록**입니다. 한 기능을 여러 API로 만들거나 기존 API 하나에 합칠 수 있으므로, 행 수가 신규 API 개수는 아닙니다. 새 API 경로와 개수는 백엔드 협의 후 확정합니다.

- **1장:** 무엇을 추가하거나 확인해야 하는지
- **2장:** 백엔드에 전달할 구체적인 질문
- **3장:** 기존 API 경로와 요청·응답 근거
- **4~5장:** 기획 결정과 프론트엔드·연동 앱 작업
- **6장:** 조사 근거와 미검증 범위

## V3 고객센터 API (2026-10-16)

백엔드가 고객센터를 `/v3/help/**`로 다시 노출했습니다. 근거는 [Stage Swagger `V3-고객센터` 그룹](https://api.stage.client.bigbird.co.kr:38443/v3/api-docs/V3-%EA%B3%A0%EA%B0%9D%EC%84%BC%ED%84%B0)과 [Stage REST Docs 15장](https://api.stage.client.bigbird.co.kr:38443/docs/index.html#_v3_마이그레이션_진행_중)(최종 갱신 2026-10-16 01:22 UTC, v2.2.4.12)입니다. REST Docs에 따르면 "재사용" 섹션은 v2 `ServiceCenterService`를 그대로 호출하고 V3 DTO로만 감쌉니다. **v3 화면은 V3 경로를 기준으로 연동합니다.** 같은 날 오후 Swagger 재확인에서 첨부 업로드·다운로드, 문의자 정보, 응대 상태 API 4개가 V3에 추가됐습니다. 2026-10-19에는 위에 기록한 세 조회 API를 인증된 계정으로 재검증했습니다.

| 화면 동작 | V3 API | v2 대응 | 백엔드 분류·상태 |
| --- | --- | --- | --- |
| 빅버드 문의 목록·대화, 구매자 문의 대화 | `GET /v3/help/thread?threadUserIdx&campaignIdx&type&status` | `GET /help/thread` | 구매자 대화는 `type=client`; 스레드별 `status`와 상태 필터 제공 |
| 새 문의 캠페인 선택 | `GET /v3/help/c-client-campaign` | `GET /service/client-question` | 수정 필요(로직은 v2 그대로) |
| 문의 생성 | `POST /v3/help/thread {campaignIdx, isBoardType}` | `POST /help/thread` | 수정 필요(로직은 v2 그대로) |
| 메시지 전송 | `POST /v3/help/thread/message {threadIdx, body, attachmentIdx, isAuto}` | 같음 | 수정 필요(로직은 v2 그대로) |
| 문의 종료 | `PUT /v3/help/thread/{threadIdx}` | 같음 | 수정 필요(로직은 v2 그대로) |
| 구매자 문의 + 상품 Q&A 통합 목록 | `GET /v3/help/inquiry?status&sourceType&campaignIdx&influencerThreadUserIdx&searchType&keyword&page&entrySize` | 없음(`c-purchaser-question`·`board` 개별) | Stage 실호출 HTTP 200, 두 출처와 상세 진입 식별자 확인 |
| 인플루언서 필터 옵션 | `GET /v3/help/influencer-filter?campaignIdx` | 없음 | 신규 |
| 구매자 상세 — 주문·상품 | `GET /v3/help/c-purchaser-questionInfo/{orderNumber}` | 같음 | 재사용 |
| 구매자 상세 — 캠페인 | `GET /v3/help/c-campaign-question?page&filterType&searchType&keyword` | 같음 | 재사용 |
| 상품 Q&A 상세 | `POST /v3/help/qna {userIdx, campaignIdx}` 또는 `{name, phoneNumber}` | 같음 | 재사용 |
| Q&A 답변 등록·수정·삭제 | `POST`·`PUT /v3/help/reply`, `DELETE /v3/help/reply/{replyIdx}` | 같음 | 재사용. 등록 응답 형식 수정됨 |
| 첨부 업로드 | `POST /v3/help/message/{type}/{service}` (multipart) → `{url, attachmentIdx, fileName, result, fileSize}` | `POST /help/message/{image\|video}/{service}` | 오후 추가. `type`·`service`는 명세상 자유 문자열 |
| 첨부 다운로드 | `GET /v3/help/file/download/{type}/{attachmentIdx}` (`type`: `image \| video`) | `GET /help/file/download/...` | 오후 추가. 바이너리 응답 |
| 문의자 정보 | `GET /v3/help/user/{threadUserIdx}` → `data: {nickname, id, profileImage}` | `GET /help/user/{threadUserIdx}` | 오후 추가. 비회원·운영 스레드면 `id`·`profileImage`는 null, 운영이면 `nickname`은 `bigbird` |
| 응대 중 상태 | `PUT /v3/help/{threadIdx}/viewing/{isResponding}` | `PUT /help/{threadIdx}/viewing/{isResponding}` | 오후 추가. 게시판형 채팅의 응대 중 여부 갱신 |

### V3에서 해결된 것

- **대화 응답 구조가 정의됐습니다.** `data[]`는 스레드 단위로 `threadIdx, sequence, viewing, toUserIdx, fmUserIdx, campaignIdx, finishTime(null이면 진행 중), created, boardType, status, messages[]`를 줍니다. `status`는 `WAITING | IN_PROGRESS | ANSWERED`이고, `status=ALL` 또는 각 상태로 서버 필터링합니다. 메시지는 `messageIdx, threadIdx, body, userIdx, attachmentIdx, writeTime, readTime, modifyTime, deleteTime, identifier, isUserMessage(광고주 쪽 메시지 여부), auto, fileName, fileSize, fileType`입니다.
- **통합 목록·상태·필터 계약이 생겼습니다.** 상태 `WAITING | ANSWERED`, 출처 `PURCHASER_QUESTION | PRODUCT_QNA`, 캠페인·인플루언서·검색어(`name | orderNumber`) 필터, `pagingInfo`를 제공합니다. 항목은 `inquiryIdx, sourceType, status, campaignIdx, orderNumber, writerName, body, writeTime, threadUserIdx, userIdx`입니다. 두 식별자 중 출처에 맞는 값이 있고 반대편 값은 null입니다.
- **캠페인별 인플루언서 검색**은 `influencer-filter`가 드롭다운 옵션 `{threadUserIdx, displayName}`을 줍니다. 선택값을 `influencerThreadUserIdx`로 넘깁니다.
- **답변 등록 응답이 정상화됐습니다.** v2는 실패해도 HTTP 200이고 결과가 `data.body.status`에 있었습니다. V3는 `{result, status}`와 올바른 HTTP 상태 코드를 줍니다.
- **Q&A 상세**는 답변이 없으면 `replyInfo`가 빈 객체 `{}`로 온다고 명시됐습니다.

### 백엔드가 명시한 미완료·공백

- **통합 목록의 이전 TODO는 해결됐습니다.** Stage 실호출에서 구매자 문의와 상품 Q&A, 계산된 상태를 확인했습니다.
- **빅버드 문의 목록에 캠페인명은 없습니다.** `campaignIdx`와 상태값을 줍니다.
- **새 문의 생성·전송·종료는 상태값 설계 확정 전이라 v2 로직 그대로입니다.** 상태값이 정해지면 응답이 바뀔 수 있습니다.
- **주문·상품 정보에 결제 금액이 없습니다.**
- **캠페인 정보에 이미지·진행 기간·진행 상태·인플루언서 명단이 없습니다.** `campaignPeople`은 인원수입니다.
- **채팅 전용 API는 없습니다.** 대화창은 `GET /v3/help/thread`를 재사용하고, 실시간 기록은 프론트(Firestore)가 관리합니다.

### V3 기준으로 남은 확인 (프론트 판단)

| 항목 | 내용 |
| --- | --- |
| 통합 목록 → 상세 진입 키 | 구매자 항목의 `threadUserIdx`를 `GET /v3/help/thread?type=client`에, Q&A 항목의 `userIdx`와 `campaignIdx`를 `POST /v3/help/qna`에 사용합니다. 식별자가 null인 예외 항목은 상세 진입 전에 별도 처리해야 합니다 |
| 통합 목록 표시 데이터 | 새 메시지 여부·마지막 메시지 미리보기가 없습니다. 등록일 기간 필터도 없습니다 |
| 새 문의 캠페인 목록 범위 | v2 `/service/client-question`은 결제 완료된 빅버드 캠페인, V3 `c-client-campaign`은 "광고주(마스터/서브)에게 접근 가능한 캠페인"으로 설명됩니다. 같은 범위인지, 캠페인 기간을 줄 수 있는지 확인합니다 |
| `GET /v3/help/thread`의 `type` | 광고주가 구매자 대화·상담 기록을 볼 때는 `type=client`입니다. `type=admin`은 구매자↔운영 대화입니다 |
| 필수·null·오류 | 2026-10-16 백엔드가 응답 DTO에 `required`·`nullable`을 채우고, 4xx·5xx 응답을 공통 `V3ErrorResponse`(`{result: false, reason}`)로 정리했습니다. 1차 Zod는 이 표시를 그대로 따릅니다(스레드 `messages`는 null 가능, 메시지 `identifier`는 null 아님·알 수 없으면 빈 문자열). 오류는 상태 코드로 나누고 `reason` 원문은 화면에 노출하지 않습니다. 이제 생성 도구(`@hey-api/openapi-ts` 등) 도입을 검토할 수 있습니다 |
| 날짜 형식 | 스레드 `2026-10-01T10:00:00`(시간대 없음), 통합 목록·Q&A `2026-10-01 10:00`, 캠페인 패널 `2026.10.01 10:00`입니다. 시간대는 KST로 가정하기 전에 확인합니다 |
| 첨부 | V3 업로드·다운로드 경로는 생겼습니다. `{service}`에 넣을 값(v2는 `help`), 다중 첨부·용량·형식 기준(2장)은 여전히 확인 대상입니다 |
| 응대 중 상태 | `viewing` API가 Firestore 응대중 락도 갱신하는지, 읽음 처리를 겸하는지 확인 전에는 v2처럼 Firestore 락을 유지합니다 |
| 메시지 수정·삭제 | 광고주용 API는 V3에도 없습니다 |

## Stage Swagger 재확인 결과 (2026-10-14)

> 2026-10-16 이후 v3 연동은 위 V3 절을 기준으로 합니다. 아래는 v2 경로 기준 기록입니다.

[Stage 전체 OpenAPI](https://api.stage.client.bigbird.co.kr:38443/v3/api-docs)와 [고객센터 OpenAPI](https://api.stage.client.bigbird.co.kr:38443/v3/api-docs/%EA%B3%A0%EA%B0%9D%EC%84%BC%ED%84%B0)를 직접 조회했습니다. 고객센터 그룹에는 **17개 경로·19개 작업**이 있고, 캠페인 선택용 `/service/client-question`과 세션 `/sec`는 전체 명세에서 확인했습니다. 버전은 `2.2.4.12`입니다.

**기존 API의 응답 구조를 전부 모르는 상태가 아닙니다.** 아래는 현재 문서화된 계약이며, 인증된 업무 API 호출로 실응답을 검증한 결과는 아닙니다. 각 필드의 생략 가능성·오류 계약은 별도 확인이 필요합니다.

| 기능 | Stage에서 확인한 계약 | 남은 확인 |
| --- | --- | --- |
| 새 문의 캠페인 선택 | `ClientBigbirdCampaignListResponse`: `result`, `list[]`의 이미지·코드·브랜드·상품명·캠페인 ID | 시안의 캠페인 기간 필드 없음 |
| 문의 생성 | `{isBoardType, campaignIdx}` → `{result, data: {sequence, threadIdx}}` | `isBoardType`은 설명상 필수지만 `required` 배열 없음. API 설명의 대상이 "인플루언서 → 운영"인 점 확인 |
| 메시지 전송 | `MessageDTO` → `{result, threadIdx}` | 설명상 종료된 스레드에 보내면 새 스레드 생성. 종료와 전송 경합 시 동작 확인 |
| 첨부 업로드 | `{url, attachmentIdx, fileName, result, fileSize}` | 허용 용량·형식·개수, 다중 첨부, `{service}` 값 |
| 문의 종료·응대 상태·Q&A 수정·삭제 | `{result: boolean}` | 읽음·락·Firestore 반영 범위, Q&A 요청 필수 필드 |
| 구매자 문의 목록 | `list[]`에 구매자 정보·`threadIdx`·`threadUserIdx`·`orderNumber`·`campaignIdx`, `pagingInfo` | 통합 목록·답변 상태·새 필터는 별도 필요 |
| 상품 Q&A 목록 | `list[]`, `pagingInfo`, `searchInfo`, 결과 `code` | `campaignIdx` 필수. 비회원 `userIdx`는 null |
| 주문번호 기반 상세 | `list`는 단일 객체. 주문 상태·이미지·상품명·캠페인/공구샵 코드·서비스 유형 제공 | 구매자 이메일·전화, 주문일·결제 금액, 캠페인 기간·진행 상태·인스타 등은 이 스키마에 없음 |
| 문의자 프로필 | `data: {nickname, id, profileImage}` | 전체 구매자 상세를 제공하는 API는 아님 |
| 필터 캠페인 목록 | `/help/c-client-campaign`: 접근 가능한 캠페인의 ID·코드·브랜드·상품명·이미지 | 인플루언서 검색 지원은 별도 확인 |
| 빅버드 문의 사용자 정보 | `/help/c-bigbird-question`: `list` 단일 객체의 `threadUserIdx`, `writeTime` | 대화 목록·메시지 본문을 제공하는 API는 아님 |

### 아직 스키마가 부족한 부분

- `GET /help/thread`: 응답이 여전히 `string`이며 대화·메시지 내부 구조가 정의되지 않았습니다.
- `POST /help/qna`, `POST /help/reply`: 응답이 여전히 `object`입니다.
- `GET /help/c-qna`: 응답 래퍼는 있으나 항목은 자유 형식입니다. **명세에 "매퍼 쿼리가 SELECT 컬럼 없이 비어있어(QA 발견) 항목 구조 미정의"라고 명시**되어 있어, 전체 Q&A 조회 대안으로 채택하기 전에 백엔드 확인이 필요합니다.
- 응답 DTO 대부분에 `required`가 없고 오류 응답도 충분히 정의되지 않았습니다. 속성·설명·예시가 있는 것과 실응답 검증 완료는 구분합니다.

### 기존 조사에서 정정할 내용

- 문의 생성 요청은 현재 Stage에서 v2와 같은 `{isBoardType, campaignIdx}`로 정의돼 있습니다. 과거 REST Docs의 `{subject, content}` 예시와 구분합니다.
- Q&A 조회는 **회원이면 `userIdx + campaignIdx`, 비회원이면 `name + phoneNumber`**라는 분기가 요청 스키마에 설명돼 있습니다. 비회원 직접 진입 키와 여러 문의의 구분은 여전히 확인 대상입니다.
- 날짜가 모두 `YYYY-MM-DD HH:mm:ss`라는 기존 스펙은 맞지 않습니다. 구매자 목록은 `2026.10.01 10:00`, Q&A 목록은 `2026-10-01 10:00` 예시이며, 일부 날짜는 `date-time`입니다. 실제 형식·시간대는 필드별로 확인합니다.
- 구매자 목록 `userIdx`는 문자열이며 비회원은 `'-'`, Q&A 목록 `userIdx`는 nullable 정수입니다. `campaignIdx`도 구매자 목록에서는 null일 수 있으므로 기존 URL 키 설계가 모든 항목에 적용되는지 확인해야 합니다.

## 1. 필요한 작업 한눈에 보기

> 1~3장은 V3 이전(v2 경로) 기준 기록입니다. 경로와 해결 여부는 맨 앞 [V3 고객센터 API](#v3-고객센터-api-2026-10-16) 절이 우선합니다. 통합 목록·상태·필터(#1, #2, #6)와 캠페인별 인플루언서 검색은 V3에서 제공됐습니다(통합 목록은 TODO 상태).

### 추가·확장이 필요한 기능

| 기능 | 필요한 서버 지원 | 현재 판단 |
| --- | --- | --- |
| 구매자 문의·상품 Q&A 통합 목록 | 전체 캠페인 통합 조회, 최신순 정렬, 총건수·페이지네이션 | 기존 개별 목록을 프론트에서 합치는 방식으로는 부족 |
| 답변 상태 탭 | 답변 대기·답변 완료 상태와 필터(재문의는 2026-10-19 없앰) | 기존 `UNIDENTIFIED/CHECK`만으로는 부족 |
| 통합 목록 필터 | 문의 유형·캠페인·인플루언서·등록일·검색어 조건 | 새 화면의 필터 계약 필요 |
| REST 메시지 수정 | 광고주가 보낸 메시지 수정 | 기능 승인 후 신규·확장 필요 |
| REST 메시지 삭제 | 광고주가 보낸 메시지 삭제 | 기능 승인 후 신규·확장 필요 |
| REST 메시지 답장 | 원본 메시지를 참조하는 `replyTo` | 기능 승인 후 신규·확장 필요 |

메시지 세 항목은 **문의 남기기·구매자 문의의 REST 메시지** 기준입니다. 상품 Q&A 답변 수정·삭제는 기존 API가 있고, 실시간 상담은 Firestore와 운영 앱 대응이 필요합니다. 수정·삭제·답장은 현재 스펙상 컨펌 대기입니다.

### 기존 지원 여부에 따라 추가 개발이 필요한 기능

| 기능 | 먼저 확인할 내용 | 지원하지 않으면 |
| --- | --- | --- |
| 필터용 캠페인 목록 | 기존 캠페인 API의 용도·응답 | 조회 API 확장 또는 추가 |
| 캠페인별 인플루언서 검색 | 다른 영역의 기존 API로 조회 가능한지 | 검색 API 추가 |
| 새 메시지 읽음 처리 | 대화 조회 또는 viewing API가 읽음 처리하는지 | 읽음 갱신 기능 추가 |
| 구매자 상세 패널 | 연락처·주문·캠페인 정보와 주문 없는 Q&A 조회 키 | 상세 조회 확장 또는 추가 |
| 이전 상담 기록 | 기존 대화 API로 광고주 소유 범위의 이전 문의를 조회하는지 | 기록 조회 확장 또는 추가 |
| 대화 직접 진입 | 목록 없이 상세를 조회할 고유 키가 있는지 | 식별자·상세 조회 계약 보완 |
| 다중 첨부 | 여러 이미지·동영상을 한 메시지에 연결할 수 있는지 | 메시지·첨부 계약 확장 |
| 첨부 제한·만료 | 용량·형식·개수·14일 만료를 서버가 지원하는지 | 서버 검증·다운로드 처리 변경 |
| Q&A 3,000자 답변 | 서버가 새 글자 수 제한을 받는지 | 입력 제한 변경 |
| 캠페인 기간·문의 제목·카드 | 기존 응답에 표시 데이터가 있는지 | 응답 필드 확장 |
| 실시간 상담 종료 | REST 종료 시 Firestore도 갱신하는지 | 종료 동기화 처리 보완 |
| 상담 재시도·문의 남기기 전환 | 기존 생성·종료와 필드로 처리 가능한지 | 상태·전환 처리 보완 |
| Firebase 인증 | 현재 직접 접근 구조를 어떻게 보호할지 | 필요 시 토큰 발급 API·규칙 보완 |

### 기존 API를 활용할 수 있는 기본 기능

| 기능 | 재사용 후보 | 연동 전 확인 |
| --- | --- | --- |
| 빅버드 문의 목록·대화 | `GET /help/thread` | 응답 스키마·표시 데이터 |
| 빅버드 새 문의 생성 | `POST /help/thread` | Stage 요청·응답 DTO 확인됨. 필수 표기·대상 설명 확인 |
| 빅버드 새 문의 캠페인 선택 | `GET /service/client-question` | 캠페인 기간·이름 |
| 문의 남기기 메시지 전송 | `POST /help/thread/message` | 메시지·첨부 계약 |
| 구매자 대화 | `GET /help/thread?type=client` | 조회 키·응답 스키마 |
| 상품 Q&A 조회·답변 | `/help/qna`, `/help/reply` | 필수 필드·글자 수·읽음 |
| 첨부 업로드·다운로드 | `/help/message/...`, `/help/file/download/...` | 업로드 경로·제한·만료 |
| 문의 종료 | `PUT /help/thread/{threadIdx}` | Firestore와 종료 정합성 |

**기존 API가 있다는 것과 새 화면 요구를 모두 충족한다는 것은 별개입니다.** 실제 연동 전에는 채택할 API의 요청·응답 계약을 확인해야 합니다.

## 2. 백엔드에 확인·요청할 내용

기존 요청 번호 `#1~#18`은 이전 논의와 연결하기 위해 유지했습니다. 번호는 API 개수가 아닙니다.

- **연동 전 확인:** 해당 기능을 실제 API에 연결하기 전에 해결합니다.
- **정책 결정 후 협의:** 기획·디자인 또는 연동 앱과 범위를 먼저 정합니다.
- **후속 협의:** 출시 포함 여부와 필요 시점을 별도로 정합니다.

### 통합 목록·필터 · 연동 전 확인 (#1, #2, #6)

**요청:** 구매자 문의와 상품 Q&A를 하나의 목록으로 조회할 수 있어야 합니다.

- 목록: 전체 캠페인, 최신순, 총건수, 페이지네이션.
- 항목: 상태, 문의 유형, 구매자 이름, 표시 일시, 마지막 메시지 미리보기, 새 메시지 여부, 상세 진입 키.
- 상태: 답변 대기 / 답변 완료. 재문의는 2026-10-19 디자인 변경으로 없앴고 백엔드에 공유됐습니다(`REQUESTED_AGAIN` 제거 반영 대기).
- 필터: 문의 유형, 캠페인, 참여 인플루언서, 등록일 기간, 검색어(이름·ID·주문번호 등).

**질문:**

1. `/help/c-purchaser-question`, `/help/c-qna`는 캠페인을 생략하면 전체 캠페인을 조회하나요? 전체 조회가 가능해도 통합 정렬·페이지네이션 지원은 별도로 확인해야 합니다.
2. 캠페인 선택 목록과 캠페인별 인플루언서 검색에 활용할 기존 API가 있나요?
3. 목록 한 건의 단위와 고유 키, 최신순 기준 시각, 동률 정렬은 무엇인가요?
4. 필터 조합·기간 경계와 인플루언서 목록의 검색 방식은 어떻게 제공하나요?

### 읽음·메시지 수정·삭제·답장 (#3, #4)

**읽음은 연동 전 확인**, 수정·삭제·답장은 **기능 승인 후 협의**합니다.

| 대상 | 현재 근거 | 확인·요청 |
| --- | --- | --- |
| 목록 새 메시지 표시 | 읽음 처리 동작 미확정 | 대화 조회 시 해제되는지, 별도 갱신이 필요한지 |
| REST 메시지 읽음 | `readTime` 사용 예정 | 필드 제공 여부와 읽음 주체·시점 |
| REST 메시지 수정·삭제·답장 | 광고주용 계약 없음. 운영 앱용 `POST /help/message/hide`만 확인 | 광고주용 기능과 `replyTo` 계약 |
| Q&A 답변 수정·삭제 | 기존 `PUT /help/reply`, `DELETE /help/reply/{replyIdx}` | 읽음 이후 제한 등 서버 정책 |
| 실시간 메시지 기능 | Firestore 필드 추가 제안 | 운영 앱 지원과 선행·동시 배포 |

### 구매자 상세·직접 진입 · 연동 전 확인 (#9, #10)

**상세 기본 표시로 정정(2026-10-14):** 구매자 문의 상세는 대화 화면의 기본 구성입니다. PC에서는 대화 진입 시 상세 패널을 함께 표시하며, 헤더·채팅 내역의 아바타·사용자명 클릭으로 여는 동작은 적용하지 않습니다. 2026-10-15 대조 결과 태블릿도 대화·상세를 함께 표시하며(`6791:59544`), 모바일은 [상세 정보] 버튼으로 별도 화면을 열고 닫습니다(`6791:63874`, `6791:67081`).

상세 정보는 현재 문의의 구매자·주문·캠페인 맥락으로 조회합니다. 화면 표시 방식과 별개로 상세 응답과 출처별 조회 키는 아래 확인 대상으로 남습니다.

**상세 패널에 필요한 정보:**

| 구분 | 표시 데이터 |
| --- | --- |
| 구매자 | 이름·이메일·전화 |
| 주문 | 썸네일·상품명·주문일·결제 금액·주문번호 |
| 캠페인 | 배너·이름·유형·진행 상태·기간·캠페인 코드·공구샵 코드·인플루언서 인스타 |

**질문:**

- 주문 상세·문의자 프로필의 기존 필드는 위 Stage 재확인 표에 정리했습니다. 빠진 연락처·주문일·결제 금액·캠페인 기간 등의 출처를 확인해 주세요.
- 주문번호가 없는 상품 Q&A는 어떤 키로 상세를 조회하나요?
- `threadIdx`, `sequence`, `inquiryIdx`, `replyIdx`, 구매자 식별자는 어떻게 연결되나요?
- 회원 Q&A는 `campaignIdx + userIdx`, 비회원은 `name + phoneNumber`로 조회한다고 명세에 정의돼 있습니다. 비회원 직접 진입에 사용할 안정적인 키와 조회 범위를 확인해 주세요.
- 같은 사용자의 Q&A가 여러 건일 때 각 문의를 어떻게 구분하나요?

### 상담 기록 · 후속 협의 (#13)

- `GET /help/thread?threadUserIdx&type=client`에서 캠페인을 생략하면 같은 구매자의 이전 상담을 조회하나요?
- 조회 범위가 현재 광고주의 캠페인으로 제한되나요? Q&A도 포함되나요?
- 상담 기록 버튼의 동작과 출시 포함 여부는 기획 확인이 필요합니다.

### 첨부 · Figma 기준 확정, 서버 지원 확인 (#11)

사용자 확인(2026-10-14)에 따라 스펙을 Figma 기준으로 갱신했습니다.

| 항목 | 적용 기준 | 기존 v2와 차이 |
| --- | --- | --- |
| 이미지 | 파일당 30MB, 최대 10개 | v2 용량 10MB |
| 동영상 | 파일당 50MB, 최대 5개 | v2 용량 20MB |
| 허용 형식 | 이미지 JPG·JPEG·PNG·WebP / 동영상 MP4 | 이전 스펙의 GIF·BMP·AVI·FLV·WMV·MOV 제거 |
| 다중·혼합 첨부 | 위 개수 기준에 맞는 전송 계약 필요 | 기존 메시지는 단일 `attachmentIdx` 사용 |

시안의 공통 "파일당 30MB" 안내는 유형별 제한과 맞지 않으므로 문구 정리 대상으로 남깁니다. 구현 안내는 이미지 30MB·동영상 50MB를 구분합니다.

**stage 실호출 결과(2026-10-20):**
- 이미지(jpg·jpeg·png)는 `POST /v3/help/message/image/help`로 업로드되고 응답이 정상이다. `{service}`는 서버가 쓰지 않는 값으로 보이며(v2는 문자열 `undefined`를 보냄) 명세 보완을 요청했다(요청 #7).
- **동영상은 업로드가 실패한다(미해결).** V3(`api.stage.client…/v3/help/message/video/help`)는 `result:false`, reason `file [/opt/tomcat/temp/video_22.mp4] cannot be resolved in the file system … FileNotFoundException`(업로드를 `…/helpdesk/upload/help/dev/video/advertiser/bigbird/`로 전달하는 단계). v2(`api.stage.operator…/help/message/video/undefined`)도 500이다. 파일 이름의 공백과 무관하다. 프론트에서 고칠 수 없어 백엔드 확인 대기이며, 그 전까지 동영상 업로드는 검증하지 못한다.

**서버 질문:** 위 용량·형식·개수를 지원하나요? 다중·혼합 첨부를 어떻게 연결하나요? 업로드 `{service}`의 올바른 값은 무엇인가요? 14일 만료를 서버에서도 적용하나요? v2는 만료를 화면에서만 검사합니다.

### 기존 요청·응답 계약 · 연동 전 확인 (#5, #7, #8, #12, #13-1, #13-2)

| 항목 | 확인할 내용 |
| --- | --- |
| 공통 응답 | 채택할 API의 스키마, 필수·null 여부, 오류 형식, 권한 조건. 용도 미확정 후보까지 모두 선행 요청하지 않음 |
| 문의 생성 | 현재 Stage는 `{isBoardType, campaignIdx}`로 확인됨. `isBoardType` 필수 표기와 "인플루언서 → 운영" 설명 보완 |
| Q&A 답변 요청 | Swagger 필수 `inquiryIdx, userIdx, isMasterUser, body, writeTime`와 v2 POST `{inquiryIdx, body}`·PUT `{replyIdx, body}`의 차이. 서버가 채우는 필드 |
| Q&A 답변 길이 | v2 화면 500자 → 새 디자인 3,000자를 서버가 받는지 |
| 새 문의 캠페인 목록 | `GET /service/client-question`의 시작일·종료일 제공 여부. 캠페인명 표기 기준(v2는 `[브랜드명]상품명`) |
| 빅버드 문의 표시 데이터 | 목록 제목·표시 일시, 헤더 상담일, 캠페인 카드의 이미지·이름·유형·기간·코드 출처. v2는 첫 auto 메시지의 캠페인 JSON 사용 |

### 실시간 상담 · 연동·배포 전 확인 (#14~#17)

실시간 상담은 생성·종료·첨부에 REST를 쓰고, 메시지·연결·응대중 락은 Firestore를 직접 사용하던 구조입니다. 운영 앱 저장소는 `bigbird-operation-fe`입니다.

**실패 후 흐름 확정(2026-10-14):**

| 사용자 상태·선택 | 동작 |
| --- | --- |
| 5분 연결 실패 | 문의를 종료하지 않고 유지. 연결 대기는 만료 처리(v3 요청은 `expiredAt` 기록, v2 요청은 기존처럼 종료). 입력창·전송 버튼 disabled(요청 중에는 활성, 2026-10-19 변경) |
| [재시도] | 기존 문의로 연결 재요청. 재요청 접수 시점부터 5분 대기 |
| [문의 메세지로 남기기] | 실시간 연결 요청 취소·정리 후 일반 문의 작성으로 전환. 전환 완료 시 입력 활성화 |
| 일반 문의 첫 메시지 전송 | 기존 일반 문의 REST API로 접수 |

문의 기록 유지와 연결 요청의 유효 상태는 구분합니다. 만료되거나 일반 문의로 전환한 요청에 운영자가 뒤늦게 연결되지 않아야 합니다. 요청 정리 실패 시 전환 완료로 처리하지 않습니다.

| 주제 | 확인할 내용 | 협의 대상 |
| --- | --- | --- |
| 접근 통제 (#14) | 기존 메모상 dev·ops helpdesk 규칙은 `allow read, write: if true`. 헬프데스크 프로젝트는 익명 로그인이 꺼져 있어 v3는 로그인 없이 접근한다(v2·운영 앱은 익명 로그인을 시도하고 실패를 무시). 인증 방식(커스텀 토큰 등)과 규칙 보완 | 백엔드·인프라·연동 앱 |
| 종료 동기화 (#15) | REST 종료가 Firestore `finishTime`도 갱신하는지. 광고주 종료와 운영자 종료(`adminClose`) 구분 | 백엔드·운영 앱 |
| 동시 문의 (#16, 연동 차단) | 기존 무수정 전제는 해제(2026-10-19). 추가 생성·미처리 보존·정확한 답변 대상·개별 종료 범위의 서버 지원 방안 확인 | 백엔드·`bigbird-operation-fe` |
| 연결 실패·재시도 (#17) | 문의를 유지하면서 대기를 만료하고, 기존 문의에 재요청할 수 있는 API·필드. 재요청 접수 시각·요청 식별과 늦은 연결 방지 | 백엔드·`bigbird-operation-fe` |
| 일반 문의 전환 (#17) | 실시간 연결 요청 취소·정리 계약, 기존 시퀀스 처리, 일반 문의 REST 접수와의 연계·실패 처리 | 백엔드·`bigbird-operation-fe` |

### 범위 확정 후 검토 (#18)

기존 조사에서는 푸시·알림 목록, FAQ·공지 API를 확인하지 못했습니다. 필요하면 별도 요청합니다. Firebase 커스텀 토큰은 위 접근 통제 항목에서 결정합니다.

### 백엔드 답변 기록

V3 REST Docs(2026-10-16) 기준으로 아래와 같이 기록했습니다. 답변을 더 받으면 같은 형식으로 추가하고 관련 스펙도 갱신합니다.

| 기능·요청 번호 | 기존 지원 / 확장 / 신규 | 계약·예시 링크 | 적용 환경·예정일 | 남은 결정 |
| --- | --- | --- | --- | --- |
| 대화 응답 구조 (`GET /help/thread`) | 기존 지원(V3 DTO로 정의) | REST Docs 15.2 | Stage, 2026-10-16 | 필수·null 여부 |
| 통합 목록·상태·필터 (#1, #2, #6) | 신규 `GET /v3/help/inquiry` | REST Docs 15.4 | Stage, TODO 상태 | 상태 계산·Q&A 연결, 상세 진입 키, 등록일 필터 |
| 캠페인별 인플루언서 검색 | 신규 `GET /v3/help/influencer-filter` | REST Docs 15.4 | Stage | — |
| Q&A 답변 등록 응답 형식 | V3에서 수정 | REST Docs 15.9 | Stage | — |
| 구매자 상세 결제 금액·캠페인 기간 등 (#9) | 미지원(백엔드가 공백으로 명시) | REST Docs 15.5, 15.6 | — | 추가 여부 |
| 첨부 업로드·다운로드, 문의자 정보, 응대 상태 | V3 경로 추가 | Swagger `V3-고객센터` | Stage, 2026-10-16 오후 | `{service}` 값, 다중 첨부, viewing의 Firestore 반영 |
| 응답 DTO `required`·`nullable`, 오류 스키마 | 반영됨(`V3ErrorResponse` 추가) | Swagger `V3-고객센터` | Stage, 2026-10-16 | 생성 도구 도입 여부 |

## 3. 기존 API 상세

### v2에서 사용한 API

아래는 v2 호출 조사 요약이며 전체 필드 목록은 아닙니다. 현재 Stage에서 추가 확인된 응답 DTO·타입은 앞의 재확인 결과와 원본 명세를 기준으로 합니다.

| API | 용도 | 요청 / v2가 읽는 응답 |
| --- | --- | --- |
| `GET /sec` | 세션: `threadUserIdx`, `userIdx`, `accountIdx`, 고객센터 권한 | 헤더 `X-Path` |
| `GET /help/c-bigbird-question` | 내 `threadUserIdx`, 최근 작성 시각 | `list`가 배열이 아니라 객체 |
| `GET /help/thread` | 빅버드·구매자 대화 | query `threadUserIdx`(필수), `campaignIdx`, `type=client`(구매자). `data[]`: `sequence, created, finishTime, boardType, isConnect, threadIdx, messages[], seqResponseDate` |
| `POST /help/thread` | 문의 생성 | v2 body `{isBoardType, campaignIdx}` → `data.threadIdx`, `data.sequence`. 현재 Stage `ThreadCreateRequest`도 같은 body. 과거 REST Docs 예시와 구분 |
| `POST /help/thread/message` | 문의 남기기 메시지 | `MessageDTO {threadIdx(필수), body, attachmentIdx, isAuto}` |
| `POST /help/message/{image\|video}/{service}` | 첨부 업로드(multipart `file`) | → `url, attachmentIdx, fileName`. v2는 `service` 자리에 문자열 `undefined`를 보냄 |
| `GET /help/file/download/{type}/{attachmentIdx}` | 첨부 다운로드 | v2는 `window.open` |
| `PUT /help/thread/{threadIdx}` | 문의 종료 | body 없음 |
| `GET /service/client-question` | 새 문의 캠페인 목록 | `list[]`: `mainImageUrl, campaignCode, brandName, productName, campaignIdx` |
| `GET /help/c-campaign-question` | 캠페인별 문의 목록·건수 | `page, filterType, searchType(brandName\|productName\|campaignCode\|shopCode), keyword` → `list[]`: `purchaserCnt, qnaCnt, campaignIdx …`, `pagingInfo` |
| `GET /help/c-purchaser-question` | 구매자 문의 목록 | `campaignIdx`(명세상 선택), `page, entrySize, filterType(UNIDENTIFIED\|CHECK), searchType(name\|id\|orderNumber), keyword` → `list[]`: `name, id, orderNumber, writeTime, modifyTime, threadUserIdx`, `pagingInfo` |
| `GET /help/board` | 상품 Q&A 목록 | `campaignIdx` **필수** → `list[]`: `userIdx, phoneNumber, name, id, isBuyer, writeTime, modifyTime` |
| `POST /help/qna` | 상품 Q&A 대화 | `{campaignIdx, userIdx, name, phoneNumber}` → `list[]`(단건 아님): `campaignInfo, inquiryInfo, replyInfo(readTime)` |
| `POST /help/reply`, `PUT /help/reply`, `DELETE /help/reply/{replyIdx}` | Q&A 답변 등록·수정·삭제 | POST 응답만 `data.body.status`(`success to reply` / `reply already exists`) |

### Swagger에만 있는 활용 후보

| API | 활용 후보 | 확인할 것 |
| --- | --- | --- |
| `GET /help/c-purchaser-questionInfo/{orderNumber}` | 구매자 상세 패널 | 응답 DTO 확인됨. 부족한 상세 필드와 주문번호 없는 경우의 조회 키 |
| `GET /help/user/{threadUserIdx}` | 대화 상대 프로필 | `nickname, id, profileImage` 확인됨. 전체 연락처·주문 상세는 제공하지 않음 |
| `GET /help/c-qna` | 전체 Q&A 조회 후보(채택 보류) | 명세의 빈 SELECT 쿼리 QA 기록 확인 필요. 항목 스키마 미정의 |
| `PUT /help/{threadIdx}/viewing/{isResponding}` | 응대중·보는 중 상태 | 읽음 처리를 겸하는지, 락 소유자와 경합 처리, Firestore도 갱신하는지. 확인 전에는 v2처럼 Firestore 락 유지 |
| `GET /service/client-campaign`, `GET /help/c-client-campaign` | 필터의 캠페인 목록 | `/help/c-client-campaign`은 접근 가능한 캠페인 DTO 확인됨. 다른 후보와의 차이·채택 여부 확인 |
| `GET /service/client-purchaser/{campaignIdx}` | 캠페인별 구매자 | 용도, `searchType(purchaserName\|purchaserId\|orderNumber)` |
| `GET /service/client-cardtab[/{userIdx}]` | (불명) | 용도. 상태별 건수라는 근거 없음 |

## 4. 기획·디자인에서 결정할 내용

**스펙 반영 완료:** 기존 PC 시안 대조 기록에 따라 [고객센터 스펙](../specs/customer-center/customer-center.md)의 연결 실패 토스트를 실패 카드로 정정하고, `상담 종료` 버튼의 시안 부재·임시 배치 문구를 제거했습니다. 미해결 목록과 검증 시나리오도 함께 수정했습니다.

**확정·스펙 반영 완료(2026-10-14):** 사용자 확인에 따라 "LNB 클릭 시 최신 채팅 Focus"를 적용합니다. LNB로 진입하면 최신 대화를 자동 선택합니다.

**첨부 기준도 확정·스펙 반영 완료:** 이미지 30MB·최대 10개, 동영상 50MB·최대 5개, JPG·JPEG·PNG·WebP·MP4를 적용합니다. 시안의 공통 용량 문구 정리와 서버 지원 확인은 2장 첨부 항목에 남겼습니다.

**구매자 문의의 새 문의 없음 — 확정·스펙 반영 완료:** 구매자 문의에는 `새 문의` 버튼을 표시하지 않습니다. 첨부 채팅 시안(`5198:109440`)의 버튼도 구현에서 제외합니다. 구매자 문의 생성 API는 요청하지 않으며, 이 문서의 새 문의 생성·캠페인 선택은 빅버드 문의에만 해당합니다.

**요청 실패 태그 확정·스펙 반영 완료(2026-10-14):** 실패 화면은 목록과 대화 헤더 모두 "요청 실패" 태그를 표시합니다. 헤더의 "답변 대기" 표시는 적용하지 않습니다.

**버튼·입력 상태(2026-10-19 변경):** 상담 요청 중과 연결된 뒤에는 입력창과 전송 버튼을 활성화하고(연결 전 메시지는 연결 대기 마감 5분 전까지만 받음), 요청 실패·종료·응대 락을 잃은 상태에서는 disabled 처리합니다. 2026-10-14에는 요청 중에도 disabled로 확정했으나 사용자 결정으로 바뀌었습니다. 실시간 상담 대화에도 캠페인 카드를 일반 문의와 같이 그리며(사용자 결정 2026-10-21, 이전 2026-10-19 숨김 결정을 변경), v3 실시간 요청은 캠페인 문의일 때만 캠페인 카드 JSON을 첫 auto 메시지로 Firestore에 씁니다(운영 앱·v2 대화가 이 메시지로 카드를 그리며, 없으면 운영 앱에 카드가 보이지 않음, 2026-10-19 실제 확인). 기타 문의는 `기타문의` 안내를 보내지 않습니다. v3 화면도 이 카드를 그립니다. 이미 완료된(종료된) 상담에서는 `상담 종료` 버튼을 표시하되 disabled 처리합니다.

**캠페인 단일 선택 확정·스펙 반영 완료(2026-10-14):** 새 문의에서는 캠페인 1개만 선택합니다. 전체 선택은 제공하지 않고, 다른 행 선택 시 기존 선택을 해제합니다. 생성 요청은 `campaignIdx` 하나를 사용하며, 다중 캠페인 생성을 위한 API 확장은 요청하지 않습니다.

**실패 카드 흐름·문구 정리 완료:** 실패 시 문의 유지, [재시도]로 기존 문의 재요청, [문의 메세지로 남기기]로 일반 문의 작성 전환을 적용합니다. 안내는 시안(`9298:260501`)대로 본문 "문의를 남겨주시면 확인 후 순차적으로 답변드립니다.", 작은 글씨 "문의 메시지 답변은 고객 문의 상황에 따라 지연될 수 있습니다."입니다(2026-10-19 정정). 남은 것은 2장의 백엔드·운영 앱 연동 계약 확인입니다.

**답변 완료·종료 표시 확정·스펙 반영 완료(2026-10-14):** 종료된 상담도 목록·헤더 모두 "답변 완료"로 표시합니다. 실제 종료 여부는 `finishTime`으로 구분합니다.

| 상황 | 목록·헤더 태그 | 입력창·전송 | 종료 버튼 | 종료 안내 |
| --- | --- | --- | --- | --- |
| 운영자가 답변한 일반 문의, 아직 미종료 | 답변 완료 | 없음(2026-10-19 정정) | 없음 | 표시하지 않음 |
| 종료된 실시간 상담 | 답변 완료 | disabled | disabled | "이미 완료된 상담입니다. 새로운 문의가 있으신 경우 새 문의를 등록해 주세요" |
| 실시간 상담 요청 중·연결됨 | 답변 대기·상담 중 | 활성(락 보유 탭만) | 활성 | 요청 중: "상담 요청 중" 카드 |
| 실시간 상담 요청 실패 | 요청 실패 | disabled | 활성 | 실패 카드(재시도·문의 메시지로 남기기) |

응대중 락 등 다른 입력 제한은 별도로 적용합니다.

남은 기획 확인 항목은 상담 기록 버튼의 동작·출시 포함 여부(2장 #13)와 통합 목록의 임시 노출 동작(5장)입니다. 결정 후 스펙과 관련 API 요청을 함께 갱신합니다.



## 5. 프론트엔드·연동 앱 작업

기존 조사에서 확인한 개선 항목입니다. 공유 Firestore 구조·필드 변경은 PRD에 따라 연동 앱과 먼저 합의합니다. 광고주 앱만 트랜잭션으로 전환해도 다른 앱이 배열 전체를 덮어쓰면 메시지 유실 위험이 남으므로, 관련 앱의 쓰기 방식과 배포 순서를 함께 확인해야 합니다. 실시간 수정·삭제·답장은 스펙에 명시된 운영 앱 선행 배포 조건을 따릅니다.

- 실시간 메시지를 "읽고 배열 전체를 update"하는 방식은 유실과 중복 종료 메시지를 낳습니다. 트랜잭션으로 바꿉니다(스펙).
- 업로드 경로 끝의 `undefined`, 검증에 실패해도 나가는 업로드 요청, 실행되지 않는 정리 코드(`beforeUnmount`), `v-html` XSS를 고칩니다.
- 구매자 대화 모달이 내 스레드를 구독하던 문제(v2 `customer.js:438`)를 고칩니다. 구매자 대화는 구매자 `threadUserIdx`를 구독합니다.

### 일반 문의 확정 범위와 연동 보류 (2026-10-19)

- 기타·캠페인 문의의 첫 텍스트 등록 → 해당 대화 이동 → 읽기 전용 조회가 확정 범위다. 일반 문의의 추가 메시지·광고주 종료는 제공하지 않는다. `PUT /v3/help/thread/{threadIdx}`는 기존 종료 동작과 실시간 상담을 조사하기 위한 API이며 v3 일반 문의에서 호출하지 않는다.
- 열린 문의가 답변 대기·답변 완료여도 새 문의를 허용하며 자동 종료하지 않는다. 기존의 1개 제한·운영 앱 개편 후 제한 해제 계획은 최신 정책으로 대체한다.
- v2 병행 사용은 필수이며 실시간 상담 호환에 필요한 v2·운영 앱 수정은 포함한다. 복수 일반 문의의 서버 동작과 미처리 보존은 검증이 필요하다.
- 운영 앱은 sequence 오름차순으로 정렬한 뒤 첫 미종료 문의에 답장·viewing을 적용한다. 전체 대화 표시나 캠페인 선택만으로 같은 캠페인·기타 문의 여러 건의 답변 대상을 구분하지 못한다.
- 운영 X는 일반 문의 창만 닫는다. 별도 `새로운 문의` 버튼은 실제 종료지만 CHECK·client/influencer 조건에서만 보인다. "답변 후 닫기"라는 운영 절차만으로 안전한 복수 처리를 보장하지 않는다.
- Firestore NEW는 계정 단위다. 운영 창 열기·답장, v2 창 열기로 다른 미처리 문의의 신호가 사라질 수 있다. REST 생성 성공과 운영 미처리 목록 보존은 별도로 확인한다.
- 마켓 구매자→빅버드 문의도 운영 ChatModal을 공유한다. 공유 API·상태 계약 변경 시 구매자 영향도 확인한다.

### 백엔드 확인 요청 및 재개 조건

1. 열린 A가 있어도 B를 별도 생성하며 A를 자동 종료·재사용·거절하지 않는가? 같은 캠페인·기타 문의 여러 건도 포함하는가?
2. `/help/client-question`의 `UNIDENTIFIED / CHECK` 판정은 무엇인가? A 열람·답변 및 v2 열람으로 NEW가 지워져도 미답변 B가 운영 목록에 남는가?
3. 기존 운영 앱이 첫 미종료 문의 ID로 답장을 보내는데, A를 닫지 않고 B에 정확히 답하는 방법은 무엇인가? 화면에서 본 문의와 실제 저장 대상이 일치하는가?
4. 기존 앱의 개별 종료·메시지 전송 경합이 다른 문의에 영향을 주지 않는가? REST와 Firestore 상태 갱신의 책임은 어디에 있는가?
5. 기존 API로 가능한 부분과 실제 서버 보완이 필요한 부분을 구분한다. 실시간 상담 호환을 위한 v2·운영 앱 수정은 포함하되 신규 API나 운영 앱 전체 개편을 전제로 삼지 않는다.

호환 방식 합의 후 v2·v3·운영 앱에서 A/B 생성·독립 답변·미처리 보존, v2 재진입·전송·새로운 문의, 운영 X 닫기·재진입을 검증해야 한다. "복수 생성 가능"이라는 답변만으로 연동 완료나 공개 가능으로 판정하지 않는다. 상세 기준은 [고객센터 스펙](../specs/customer-center/customer-center.md#일반-문의-기존-정책과-연동-상태)을 따른다.

### 구현 순서와 임시 동작

현재는 문서 최신화·호환 계약 확인을 우선한다. 기존 목록·대화 조회 연동과 목 데이터 UI 준비는 실제 등록 연동 완료와 구분한다. 복수 문의 등록 연동·공개는 위 재개 조건 충족 전까지 보류하며 1개 제한·자동 종료로 대체하지 않는다. 실시간 상담은 현재 작업 범위이며, 구매자 문의·메시지 편집은 후속이다. 첨부는 서버 지원 확인이 필요하다. Firebase 초기화 기반만으로 문의별 상태·구독·전송이 구현된 것은 아니다.

캠페인별 목록으로 대체하는 기존 방안은 통합 목록 요구를 충족하지 못합니다. 사용자에게 노출할 임시 동작은 기획과 합의한 뒤 스펙에 반영합니다.

## 6. 조사 근거와 검증 범위

2026-10-14 Stage 전체·고객센터 OpenAPI 원본을 직접 조회해 재검토했습니다. Figma·v2 원본 재대조 및 인증된 업무 API 실응답 검증은 수행하지 않았습니다.

- 근거
  - Stage V3 고객센터 Swagger·REST Docs 15장(2026-10-16 조회, 위 V3 절 링크)
  - 광고주 Client 운영 Swagger(`client-prod.json`, OpenAPI 3.0.1, v2.2.4.12)
  - Stage REST Docs(`client-stage.txt`)
  - [고객센터 스펙](../specs/customer-center/customer-center.md), [PRD](./prd.md)
  - [Figma 고객센터 페이지](https://www.figma.com/design/k5VBKeB2apb3wb4l4Af3sZ?node-id=5073-85988) 캐시
- 검증
  - 기존 조사 기록상 Swagger·v2 원본 대조를 수행했습니다. 재현 가능한 근거를 위해 아래 원본 위치·리비전을 보완해야 합니다.
  - 디자인: 실제 Figma 페이지 구조가 캐시와 같음을 확인했습니다(노드 984개, 2026-10-14). 같은 자리에서 문구만 바뀐 것은 이 비교로 잡히지 않습니다. 기존 조사에서 PC 핵심 화면 10장을 문서와 대조했습니다. 태블릿·모바일 화면은 대조하지 않았습니다.
  - Stage OpenAPI 문서는 직접 조회했습니다. 인증된 업무 API의 데이터 조회·생성·전송 응답은 검증하지 않았습니다.
- 문서 상태
  - 과거 운영 Swagger 조사에서는 응답 구조가 부족했으나, 현재 Stage에는 다수의 응답 DTO가 정의돼 있습니다. 부족한 항목은 앞의 Stage 재확인 결과에 한정해 구분합니다.
  - 과거 Stage REST Docs 조사 범위는 고객센터 경로 6개였으며, 현재 Stage OpenAPI의 고객센터 그룹은 17개 경로·19개 작업입니다.

### 원본 위치와 남은 검증

| 근거 | 현재 기록 | 보완할 내용 |
| --- | --- | --- |
| 운영 Swagger | `client-prod.json`, OpenAPI 3.0.1, v2.2.4.12 | 원본 URL 또는 저장 경로, 수집 일시 |
| 과거 Stage REST Docs | `client-stage.txt`, 고객센터 경로 6개 | 원본 URL 또는 저장 경로, 대상 서버 버전 |
| v2 | `bigbird-client-fe/docs/customer-service-handoff.md`, 일부 `customer.js` 줄 번호 | 기준 커밋과 요청별 파일 경로·심볼. 줄 번호만으로는 버전을 특정할 수 없음 |
| Figma | 위 페이지 링크, PC 10장 대조 기록 | 요구사항별 프레임 링크, 캐시 위치·수집 일시, 모바일·태블릿 대조 |
| 실제 업무 API | 인증된 실응답 미검증 | 합의된 계약에 대한 요청·응답 예시와 오류·권한 확인 결과 |

모바일·태블릿은 목록 → 대화 → 상세의 개별 진입과 뒤로가기를 중심으로 확인합니다. 단순 배치 차이는 공통 API로 처리하되, 직접 진입에 필요한 식별자·조회 데이터가 충분한지는 별도로 검증합니다.
