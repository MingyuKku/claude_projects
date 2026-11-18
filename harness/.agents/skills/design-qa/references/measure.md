# 구현 화면 측정 함수

## 목차

- 사용법 (설치 A·B, 구역별 호출)
- 반환값 (좌표·색·글꼴·아이콘·스크롤)
- 측정할 때 참고
- 긴 화면 (스크롤 컨테이너)

## 사용법

**디자인 QA는 `scripts/design/qa.mjs`가 만든 `run.js`가 설치·측정·저장을 모두 합니다**(`workflow.md`). 아래 수동 사용법은 구현 중 한 화면·한 구역만 빠르게 확인할 때(figma-to-component 검증)나 원인을 따로 볼 때 씁니다.

측정 함수 원본은 같은 폴더의 `measure.js`입니다(측정 코드는 이 파일에만 둡니다). 측정은 `() => window.__qaMeasure('<CSS 선택자>')`로 부릅니다(예: `main`, `main section:nth-of-type(2)`). 로그인 등 `<main>`이 없는 화면은 `body`나 화면 최상위 요소를 씁니다. 다이얼로그·시트·드롭다운은 Radix 포털로 `<body>` 끝에 붙으므로 `[role="dialog"]`·`[role="alertdialog"]`·`[role="menu"]`로 잽니다(열림 애니메이션이 끝난 뒤). 설치하면 스크롤바도 숨깁니다(헤드리스 스크롤바 15px는 실기기 overlay 스크롤바에 없는 폭이라 위치·폭이 어긋남).

### 설치 (브라우저를 연 뒤 한 번)

**A. 초기화 스크립트로 등록 (기본)**: 브라우저 컨텍스트에 한 번 등록하면 URL 이동·새로고침 뒤에도 자동으로 다시 들어갑니다. 브라우저를 닫으면 다시 등록합니다.

```js
// playwright:browser_run_code_unsafe 의 code. 경로는 워크트리 절대 경로(Codex는 .agents/skills/...)
async (page) => {
  const p = '<워크트리 절대 경로>/.claude/skills/design-qa/references/measure.js';
  await page.context().addInitScript({ path: p }); // 이후 로드되는 모든 페이지
  await page.addScriptTag({ path: p }); // 지금 열린 페이지
  return page.evaluate(() => typeof window.__qaMeasure);
};
```

`browser_run_code_unsafe`는 Playwright 서버에서 임의 코드를 실행하는 도구라 권한 확인이 뜨거나 막혀 있을 수 있습니다. 위 코드 외의 용도로 쓰지 않습니다.

**B. 직접 설치 (A를 쓸 수 없을 때)**: `measure.js` 내용을 그대로 `playwright:browser_evaluate`의 `function`에 `() => { <파일 내용> }`로 넣습니다. 약 7KB가 보내지고 응답에도 그대로 돌아오며, 페이지가 다시 로드될 때마다(URL 이동·새로고침·개발 서버 재시작) 다시 넣어야 합니다. 그래서 같은 페이지 안에서는 클릭으로 이동합니다.

측정이 `window.__qaMeasure is not a function`으로 실패하면 설치가 풀린 것입니다(A는 브라우저를 닫았을 때, B는 페이지가 다시 로드됐을 때).

## 반환값

구역 기준 좌표(`x`·`y`·`w`·`h`, px)와 디자인 값만 담은 행 배열. 기본값(투명 배경·테두리 없음·radius 0·`gap: normal`·투명 그림자 층)은 생략해 길이를 줄입니다.
색은 모두 Figma와 같은 `#RRGGBB`(투명도가 있으면 `#RRGGBB/40%`)로 바꿔 줍니다. Tailwind v4의 기본 팔레트는 `oklch()`, 투명도 수식어(`bg-muted/40`)는 `oklab()`으로 나오기 때문입니다. 요소 투명도(비활성 버튼 등)는 `opacity`입니다.
아이콘은 대부분 `shared/assets/img`의 SVG를 `<img>`로 씁니다. 파일 이름(`chevron-down.svg`)이 나오고, 4KB 미만 SVG는 Vite가 data URI로 넣어 `inline-svg`로만 나오므로 모양은 캡처로 비교합니다. lucide-react는 `lucide-<이름>`입니다.
`scroll`이 있으면 구역이 스크롤 컨테이너이고 내용이 잘려 있다는 뜻입니다(`보이는 높이/전체 높이`). 아래 "긴 화면"을 따릅니다.
`label`은 시안 요소와 짝을 맞추기 위한 글자(80자까지)입니다. 데이터 값 비교에 쓰지 않습니다.
대조용 필드: `i`(행 번호)·`p`(가장 가까운 측정된 조상의 행 번호)·`slot`(`data-slot`, shadcn 컴포넌트 이름)·`origin`(측정 구역의 화면 위치, 보고서 박스용). 측정 구역 자체는 항상 첫 행으로 남고, 1px 이하 요소(sr-only·Radix 숨김 select)는 뺍니다.

## 측정할 때 참고

- `truncated: true`면 구역을 더 작게 나눠 다시 측정합니다.
- 좌표는 구역 기준이라 스크롤 위치와 무관합니다. `sticky`·`fixed`의 실제 위치가 문제면 스크롤한 뒤 다시 잽니다.
- 결과가 길면 `browser_evaluate`의 `filename`으로 파일에 저장하고 필요한 부분만 읽습니다.

## 긴 화면 (스크롤 컨테이너)

마이페이지 셸은 문서가 아니라 `<main>`이 스크롤합니다(`app/layouts/MypageLayout.tsx`). 이때 캡처하면 보이는 부분만 찍히고, 하단 고정 버튼·sticky 탭도 스크롤 위치에 따라 달라집니다.
측정 결과에 `scroll: "보이는 높이/전체 높이"`가 나오면, 시안의 긴 스크롤 프레임과 맞춰 볼 때만 아래처럼 합니다.

1. `browser_resize`로 폭은 그대로 두고 높이를 `현재 높이 + (전체 높이 − 보이는 높이)`로 늘립니다. `<main>`이 더 이상 스크롤하지 않게 됩니다.
2. 다시 측정하고, `browser_take_screenshot`(fullPage 아님, 해당 요소)으로 찍습니다.
3. 첫 화면(뷰포트 높이 그대로) 비교가 필요한 시안 프레임이면 높이를 되돌려 따로 잽니다.

하단 고정(`fixed`·`sticky bottom`) 요소는 늘린 화면에서 내용 끝에 붙으므로, 위치 비교는 첫 화면 기준으로 합니다.
