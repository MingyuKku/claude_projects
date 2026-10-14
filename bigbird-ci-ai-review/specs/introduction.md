# 서비스 소개(랜딩) `/introduction`

## 목적

- 비로그인 방문자에게 서비스를 소개하고 문의·시작으로 유입시키는 공개 랜딩(PRD: "홈의 목적: 서비스 소개, 문의 유입").
- 검색·공유(OG) 노출을 노리는 유일한 공개 페이지(`public/robots.txt`: `Allow: /introduction`, 나머지 `Disallow: /`).
- 시나리오: 히어로 → 섹션 1~6 스크롤 → "서비스 소개서 요청"(PDF 다운로드) / "시작하기" → 하단 "도입 문의" 폼 → 푸터에서 약관 열람.
- 미인증·권한 없는 사용자가 보호 화면에서 튕겨 오는 착지점이기도 하다(`AuthGuard`가 `replace`로 이동).
- 서버 데이터 없음. 문구·자산은 `model/data.ts` 정적 객체이며, 시안·문구 변경은 이 파일만 고치는 것이 원칙이다.

## URL 계약

- 인증 불필요. `RootLayout` 하위 lazy 라우트.
- 나가는 링크
  - 시작하기(헤더·히어로·배너): `/main?login=1`
  - 이용 가이드(헤더): `/clientguide`. **이 앱에 미이관**이라 라우트가 없다. 클릭 시 동작은 미확인.
  - 푸터: `/terms`, `/terms?type=privacy` (같은 탭 이동)
  - PDF: `/media/intro/bigbird-service-intro.pdf`, 저장명 `빅버드 서비스 소개서.pdf`

## 제약 (코드에서 읽히지 않는 것)

- **SEO**: React 19 hoisting으로 `<title>`/`<meta>`를 렌더한다. `VITE_DOMAIN`(끝 슬래시 없는 origin, 형식 검증 없음)이 **있을 때만** `og:url`·`og:image*`·`twitter:card`를 낸다. 비면 절대경로 태그를 통째로 생략한다("undefined/og-image.png"보다 없는 편이 낫다는 결정).
- **프리렌더 소실**: v2는 빌드 시 prerender로 OG 태그를 정적 HTML에 구웠다. 이 앱은 SPA라 `index.html`(`<title>bigbird</title>`만)이 그대로 나가므로, JS를 실행하지 않는 크롤러(카카오톡·슬랙·트위터·페이스북 미리보기)는 OG를 읽지 못한다. 구글봇은 해당 없음. 수용 여부와 대안은 미정이다.
- **`?login=1` 가드 미구현**: `constants.ts` 주석은 main이 이 쿼리면 소개로 돌려보내는 가드를 건너뛴다고 하지만, 실제 `AuthGuard`는 쿼리를 읽지 않는다. 비로그인 방문자가 "시작하기"를 누르면 `/main?login=1` → 세션 실패 → `/introduction`으로 돌아와 **로그인 화면에 가지 못한다**.
- **문의 폼은 전송하지 않는다**: 제출 시 항상 "문의 전송 설정이 없습니다. 관리자에게 문의해 주세요." 에러를 보인다. 성공한 척하지 않는 것이 계약이다. 성공 스타일은 선언만 있고 도달 불가. 필수 필드·동의 체크 전까지 제출 버튼 disabled, 형식 오류는 브라우저 기본 검증에 맡긴다(전화 `[0-9]{9,11}`).
- 스크롤 컨테이너는 window가 아니라 `div.h-dvh.overflow-y-auto`다. 브라우저 기본 앵커·`scrollTo(window)`·스크롤 복원이 적용되지 않는다. 스크롤마다 페이지 전체가 리렌더되므로 하위에 무거운 계산을 넣지 않는다.
- Reveal은 IntersectionObserver 대신 위치 측정을 쓴다(점프 스크롤에서 요소가 영구 숨김되는 문제 회피). 마운트 시점에 `[data-reveal]`을 수집하므로 이후 동적으로 추가된 요소는 등록되지 않는다. 형제 지연은 최대 3단계(120ms 단위). 히어로에는 `data-reveal`을 달지 않는다.
- 헤더는 `fixed`가 아닌 `sticky`(스크롤바 폭 때문에 로고가 7px 어긋나는 문제 회피) + 히어로 `-mt-[72px]`. 이 쌍을 따로 바꾸지 않는다. 히어로 최대 inset/radius는 의도적으로 data가 아닌 Tailwind 클래스가 소유한다.
- 히어로 `h-dvh`: Safari 15.3 이하는 dvh 미지원. 구 SCSS의 100vh 폴백은 순서 보장이 안 되어 제거했다.
- 브레이크포인트: PC > 1240, `introtab`(≤1240) = TAB, `mo`(≤768) = MO. 1240 = 콘텐츠 1200 + 좌우 패딩 20. 값은 `src/app/styles/index.css`에서만 바꾼다. 히어로 축소 효과는 PC 전용이다.
- 키프레임 `intro-s3-left`·`intro-s3-right`·`intro-s1-screen-scroll`은 전역 CSS에 있고 페이지 제거 시 함께 제거해야 한다. `intro-` 접두사를 유지한다.
- 비디오 교체 시 `poster`(`assets/hero-poster.jpg`)를 첫 프레임으로 다시 추출한다.
- 푸터 회사 정보(대표·사업자번호·통신판매업·주소·연락처·Copyright)는 시안 원문 그대로(2칸 공백 포함)이므로 임의로 정리하지 않는다.

## 동작 결정

- 헤더 로고는 클릭 불가(표시 전용, 제품 결정). 히어로 부제는 시안에 없어 일부러 없다.
- `prefers-reduced-motion`이면 reveal 즉시 표시, S3 로고 스크롤 정지. 히어로 비디오는 reduced-motion 처리가 없다.
- S1 hover 비디오가 없으면 비디오는 숨김 유지하고 목업 이미지를 노출한다.
- iOS 바운스로 `scrollTop`이 음수여도 progress는 0으로 클램프한다.
- 로그인 사용자가 와도 리다이렉트하지 않고 그대로 표시한다.
- `#contact` 앵커로 연결하는 링크는 현재 없다.

## v2 대비

- 구조: v2 `route.tsx` + 평면 파일 → FSD 페이지 슬라이스. 레이어 규칙·Public API 때문이다. 튜닝 상수는 `HERO_SHRINK_DISTANCE`(400)로 분리했다.
- SEO: v2 `meta()` + 빌드 시 prerender → React 19 hoisting. SPA(data mode)라서이며, 대가로 정적 OG가 사라졌다. 태그 내용·조건은 동일.
- 푸터 약관 링크: v2 `/service`·`/term`(구 Vue 라우트명이 제목과 반대) → `/terms`, `/terms?type=privacy`.
- 문의 폼: v2도 미전송(emailjs 미연결 TODO). 이 앱은 연결 TODO 주석이 없다. 연결 시 v2 `IntroContact.tsx` 34~46행(`@emailjs/browser`, `VITE_EMAILJS_SERVICE_ID/TEMPLATE_ID/PUBLIC_KEY`, `emailjs.send`, 전송 중 상태)을 참고한다.
- `/clientguide`: v2는 라우트가 있었고 이 앱은 링크 문자열만 유지한다.
- `?login=1`: v2 소스에서도 이를 읽는 코드를 찾지 못했다. v2의 실제 `/main` 동작은 확인하지 않았다.
- 비디오·PDF는 v2와 같은 경로·파일명(`/media/intro/...`), 이미지·SVG는 번들 import.

## 범위 밖 · 미해결

- 비로그인 "시작하기"의 목적지와 `?login=1` 처리: 미정. `AuthGuard`에서 쿼리를 처리할지, 링크를 `ROUTES.login`으로 바꿀지 결정이 필요하다. 지금은 코드에 손대지 않는다.
- OG 크롤러 대응(프리렌더 복원 여부·방법): 미정.
- 문의 폼 실제 전송 수단과 성공·실패·전송 중 UI: 미정, 범위 밖.
- `/clientguide` 이관, 분석(GA), 쿠키 배너, 다국어, 헤더 로고 링크, `#contact` CTA: 범위 밖/미정.
- 히어로 비디오 reduced-motion 정책, 비디오 용량 최적화: 미정.
