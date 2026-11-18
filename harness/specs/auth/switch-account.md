# 관리자 아이디 변경

- 경로: `/a/change`. 기존 Vue `UserChange.vue`의 계정 전환 기능을 이관한다.
- ADMIN만 접근한다. 미인증은 로컬 `/login`, 다른 권한은 `/`로 이동하며 목록 API를 요청하지 않는다.
- 진입: 로그인한 ADMIN이 펼친 LNB의 빅버드 로고를 클릭한다. 태블릿·모바일은 전체 메뉴를 열어 로고를 선택한다.
- 화면: 기존 아이디·사용자 번호·회사명·변경 버튼 순서와 열 너비를 유지한다. 테두리·행 간격은 공통 토큰을 쓰고 변경 버튼은 공통 `Button`의 `outline-foreground`·`sm`을 사용한다. 구 화면의 임의 hex·px 값은 이관하지 않는다. 작은 화면에서는 목록을 가로 스크롤한다.
- `GET /super`: `clientList`의 `id`, `user_idx`, `company_name`을 Zod로 검증하고 뷰모델로 변환한다. `bigbird` 계정이 맨 앞에 온다. 실제 Stage 응답에서 `company_name: null`을 확인했으므로 회사명은 null·누락을 허용하고 빈 문자열로 표시한다(OpenAPI에는 string으로만 표기).
- `POST /super/change`: 현재 OpenAPI의 `ChangeUserDetailRequest`에 따라 `{ userIdx }`만 보낸다. 구 Vue가 보내던 `name`은 현재 명세에 없다.
- 응답 `{ result: true }`일 때 현재 앱의 `/`를 재로드한다. 이전 계정의 캐시와 진행 중 요청을 정리하고 변경된 세션으로 헤더를 다시 조회한다.
- 요청 중 모든 변경 버튼을 비활성화한다. 실패·`result: false`·응답 검증 오류에는 화면에 안내하고 이동하지 않는다. 목록 로딩·빈 목록·조회 실패 재시도를 제공한다.
- 서버도 두 API에 `sessionAuthAdmin`을 요구한다. 프런트의 ADMIN 검사는 보안 검증을 대체하지 않는다.

계약 확인: Stage 클라이언트 OpenAPI `/v3/api-docs`의 `super-controller`, `UserListResponse`, `ClientListItemResponse`, `ChangeUserDetailRequest`, `SimpleResultResponse`(2026-10-15).
