# 아이디·비밀번호 찾기 (find-account)

## 목적

광고주(`SERVICE_INDEX=1`, `AUTH_SERVICE_ID=1`)가 로그인 전에 계정을 복구한다. 인증 수단은 이메일(멤버 BE)과 카카오톡(통합 인증 서버) 둘이다. `docs/prd.md`에 이 기능 항목이 없으므로 이 문서와 코드가 기준이다.

- 아이디 찾기: 이름 + (이메일 | 휴대폰) → 인증번호 → "회원님의 아이디는 {id}입니다" + [로그인] / [비밀번호 찾기].
- 비밀번호 찾기(이메일): 아이디 + 이름 + 이메일 → 발송 성공 시 `/find/email-sent`(안내만, 코드 입력 없음). 재설정은 메일 링크로 진행.
- 비밀번호 찾기(카카오톡): 아이디 + 이름 + 휴대폰 → 인증번호 → 성공 시 [비밀번호 변경] → `/changePw`.

## URL 계약

- `/find`: `?type=pw`만 비밀번호 탭, 그 외 전부 아이디 탭. 탭 클릭은 `?type=`만 남기고 `replace`(`service` 등 다른 파라미터는 버려진다).
- 로그인 화면은 `/find?service=client&type=id|pw`로 진입한다.
- `/find/email-sent`: 고정 안내문, [처음으로]와 헤더 뒤로가기 모두 `/login`.
- `/changePw`: 카카오 인증 직후 쿼리 없이 이동한다. 쿠키 세션 인증을 전제하며 이 저장소에서는 검증하지 못했다.
- 탭 전환 시 입력·인증 상태가 모두 사라진다(의도).

## 서버 계약 (코드에서 읽히지 않는 것)

- 이중 백엔드: 이메일은 `VITE_API_MEMBER_URL`(멤버 BE), 카카오는 `VITE_API_AUTH_URL`(통합 인증 서버).
- 이메일 성공은 `result === "success"`. 아이디 찾기는 `id`까지 있어야 성공이며, 없거나 `result`가 success가 아니면 무반응이다.
- 이메일 응답의 `url`(일회용 재설정 링크)과 카카오 `resetPasswordCode`는 파싱만 하고 UI에서 쓰지 않는다. `/changePw`는 쿠키 세션 전제다.
- 카카오: `/lookup`(비밀번호 찾기에서만 `loginId` 전달) → `verificationId` 보관 → `/verification/loginId` 또는 `/verification/password`. `serviceId`는 호출자가 override할 수 없다.
- 통합 인증 서버는 실패를 HTTP 200 + `success:false`로도, 4xx로도 준다. 두 경로를 같은 에러 매핑으로 처리한다. 어느 쪽도 아닌 본문은 기본 문구 팝업.
- 횟수(`MAX_SEND_COUNT`, `AUTH_NUMBER_MAX_TRY` = 3)는 표시용 분모일 뿐이다. 클라이언트는 횟수를 세지 않고 서버 값(`remainVerificationCount`, 재전송 `count`, 불일치 에러 `count`/`remaining count`)만 표시한다. 한도 초과는 서버 에러(AUTH015, `break time`)가 판정한다.
- 카운트다운 60초는 UX 가드이며 실제 만료 판정은 서버 책임이다(통합 인증 서버가 1분 후에도 success를 줄 수 있음). 0이 되어도 입력창은 유지하고, [인증하기] 시 만료면 서버 호출 없이 "입력시간 초과되었습니다".

### 에러 매핑

문구 표는 `lib/find-error.ts`와 테스트가 기준이다. 코드에서 읽히지 않는 규칙만 적는다.

- 이메일: 서버 reason 문자열을 정확 일치로 비교한다(`authNum missmatch` 철자 그대로). 표시 채널(inline/popup)은 reason뿐 아니라 발송/인증 단계에 따라서도 갈린다(`request exists`는 발송이면 재전송 팝업, 인증이면 inline).
- 카카오: AUTH 코드의 서버 측 정의는 코드에서 확인할 수 없다(문구는 클라이언트 매핑). 알 수 없는 코드는 기본 문구 팝업.

## 동작 결정

- 이메일 형식은 발송 직전에 `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`로 검사하고, 실패 시 "잘못된 이메일 형식입니다"(서버 미호출). 휴대폰은 클라이언트 검증 없이 그대로 서버로 보낸다.
- 이메일 발송 성공 문구는 `인증번호를 메일로 전송했습니다`이고, 재전송 응답일 때만 `\n(남은횟수 {count}회/3회)`를 붙인다. 카카오는 `카카오톡으로 인증번호를 전송했습니다\n(남은횟수 {n}회/3회)`.
- 재전송은 새 `verificationId`와 새 60초를 만든다. 발송은 `isSending`으로 연타·Enter 동시 요청을 막는다(IME 조합 중 Enter 무시).
- [처음으로]는 수단 선택으로 복귀하고 이름/아이디 입력은 유지한다.
- 카카오 인증 시 `verificationId`가 없으면 "인증번호를 다시 요청한 뒤 확인해 주세요." 팝업.
- 아이디 결과는 단일 `id`/`loginId`만 표시한다. 다건 UI는 없다.
- 알려진 결함 후보: 이메일 재전송 응답에 `count`가 없으면 `(남은횟수 undefined회/3회)`가 된다. 서버가 항상 주는지 미확인.

## v2 대비

- 탭 상태: v2는 최초 `?type=pw`만 초기값으로 쓰고 이후 URL과 분리됐다. 이제 `?type`이 단일 출처(공유·새로고침·뒤로가기에서 탭 유지, 코드 동작에서 도출한 것이며 결정 기록은 아님).
- 이메일 발송 완료 URL: `/find/emailSent` → `/find/email-sent`(kebab-case 통일은 동작 차이에서 추론한 것이며 결정 기록은 아님). 서버가 옛 경로를 참조하는지는 미확인.
- 비밀번호 재설정 코드: v2는 `resetPasswordCode`를 상태로 보관해 버튼 노출 조건으로 썼다. 이제 저장하지 않고 `isVerified`만 둔다(일회용 자격을 메모리에 두지 않음).
- HTTP 에러 형태: axios `error.response.data` → fetch 기반 `ApiError.data`. 에러 코드 추출 후보도 `response` 래핑이 없어 4개 → 3개.
- 응답 파싱: 타입 단언 → Zod `parse` + `discriminatedUnion`.
- 카운트다운: 만료시각 기준이며 `stop()` 후에도 `isExpired()`가 정확하다. 만료 검사는 `canVerify()`로 공통화.

## 범위 밖 · 미해결

범위 밖: `/changePw` 화면, 로그인 화면, 메일 링크 도착 경로, 계정 잠금 안내, 회원가입/본인인증(KMC).

미해결(추측하지 않는다):

- 프록시: `/api-member`, `/api-auth`를 처리할 프록시가 `vite.config.ts`에 아직 없어 실서버 호출이 불가하다.
- 카카오 인증 직후 `/changePw`가 쿠키 세션으로 인증되는지(통합 인증 서버가 `/verification/password`에서 쿠키를 세팅하는지).
- 메일 링크(`url`)가 가리키는 경로, 서버가 v2의 `/find/emailSent`를 참조하는지.
- 재전송 응답 `count` 항상 존재 여부, `remaing time` 철자, `count`가 다건 결과를 뜻하는지.
- 인증 시도 초과 시 서버 응답 형식(별도 처리 없음).
- 계정 존재 여부를 구분해 노출하는 문구의 정책(PRD 미정, 계정 열거 우려).
- 휴대폰 형식 검증, 이름 trim 등 입력 정규화.
- i18n: 이관 완료(`pages/find`, `features/find-account`). 에러·안내 문구는 상태에 문장이 아니라 코드(`FindMessage`)를 두고 렌더할 때 `t("message.{code}")`로 만든다. 이메일 재전송 응답에 `count`가 없으면 `undefined`가 찍히는 대신 일반 발송 문구(`emailSent`)를 보인다.
- 컴포넌트 테스트 부재: `FindPage`/`IdFind`/`PwFind`/`useCertFlow`.
