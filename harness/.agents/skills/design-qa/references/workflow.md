# 일괄 실행 명령과 파일 형식

스크립트는 `scripts/design/`에 있습니다. 모두 레포 루트(현재 워크트리)에서 실행합니다.

| 파일 | 역할 |
|---|---|
| `figma.mjs` | Figma REST로 프레임 지정값·이미지를 받아 파일로 저장(구현 skill도 사용) |
| `figma-design-system.json` | Figma 디자인 시스템 스냅샷: 변수 ID → 이름표(REST 변수 API는 Enterprise 전용이라 Plugin API로 받아 둠)와 `ds-` 토큰 값(`tokens.mjs`가 CSS 생성) |
| `tokens.mjs` | 스냅샷으로 `src/app/styles/ds-tokens.css` 생성(`pnpm ds:tokens`) |
| `compare.mjs` | 시안 지정값과 구현 측정값 대조 |
| `qa.mjs` | `prepare`·`compare`·`report` 일괄 실행 |
| `.claude/skills/design-qa/references/measure.js` | 브라우저 측정 함수(측정 코드 원본은 이 파일 하나) |

## Figma 토큰 준비 (처음 한 번)

1. Figma(팀 공유 계정) → Settings → Security → Personal access tokens → Generate new token
2. 이름은 `figma-read-<본인 이름>`, 만료는 가장 긴 기간, 권한은 **File content · File versions · Current user를 Read**로만 켭니다(나머지 No access). 팀원마다 따로 만듭니다(값을 주고받지 않음, 한도는 계정 기준이라 같음).
3. 메인 폴더 `.env.local`에 `FIGMA_TOKEN=<값>`을 한 줄 넣습니다. `VITE_`를 붙이지 않습니다(붙이면 번들에 들어감). 워크트리는 `scripts/wt.sh`가 메인의 `.env.local`을 링크로 이어 줍니다.
4. 에이전트는 `.env.local`을 읽지 않습니다. 스크립트가 값을 쓰고, 없으면 멈추고 안내합니다.

## 폴더

```
.claude/figma-cache/qa/<페이지>-<YYYY-MM-DD>/   ← 보고서 폴더(git 제외)
├── screens.json     ← 에이전트가 씀(화면 목록)
├── verdicts.json    ← 에이전트가 씀(판정)
├── specs/           ← prepare: 시안 지정값 <node>.json, 시안 PNG
├── compare/         ← compare: 화면별 후보 NN.json
├── view/            ← compare: 판정용 캡처(본문만 잘라 폭 820 이하, macOS sips)
├── img/             ← prepare·report: NN-figma.png, NN-impl.png
├── index.html, data.js  ← report
<세션 작업 폴더>/.playwright-mcp/qa/<페이지>/  ← run.js, impl.json, NN-impl.png
```

Playwright MCP는 세션 작업 폴더와 그 `.playwright-mcp` 안에만 파일을 쓸 수 있어서 측정 결과는 그쪽에 두고, `report`가 보고서 폴더로 복사합니다(워크트리의 `.claude/figma-cache`는 메인 폴더 링크라 바로 못 씀).

## screens.json

```json
{
  "page": "mypage-subscribe",
  "title": "디자인 QA — 마이페이지 > 구독",
  "base": "http://localhost:5174",
  "mcpDir": "<세션 작업 폴더 절대 경로>/.playwright-mcp/qa/mypage-subscribe",
  "screens": [
    {
      "id": "01",
      "title": "구독 탭 · 월간",
      "device": "PC",
      "figma": "11755:96234",
      "url": "/mypage/subscribe?tab=plans",
      "viewport": [1440, 800],
      "root": "main",
      "wait": "상품 선택",
      "actions": [{ "click": "연간 결제" }, { "click": "상세보기", "nth": 1 }, { "wait": "이용 요금" }]
    },
    { "id": "05", "title": "결제 완료", "device": "PC", "figma": "…", "url": "…", "viewport": [1440, 800], "skip": "결제가 실제로 일어나 제외" }
  ]
}
```

- `viewport`: 시안 프레임 크기(폭 1440·768·360, 높이는 프레임 높이). 긴 스크롤 프레임은 그 높이로 줍니다.
- `root`: 측정 구역. 시안 `Main Content`와 같은 영역(마이페이지는 `main`). 다이얼로그·시트는 Radix 포털이라 `[role="dialog"]`.
- `wait`: 화면이 다 그려졌다고 볼 문구(제목·첫 행). `actions`: 시안 상태를 만드는 클릭·hover·대기(문구로 찾음, 같은 문구가 여럿이면 `nth`). URL 쿼리(`?tab=`·`?panel=`)로 만들 수 있으면 그쪽이 낫습니다.
- `skip`: 검사하지 않는 화면과 이유(보고서에 남음).
- `file`(선택): Figma 파일 키. 기본은 `figma-design-system.json`의 파일.

## 명령

```bash
node scripts/design/qa.mjs prepare <폴더>/screens.json
```
시안 지정값·이미지를 받고(REST 2회) `mcpDir/run.js`를 만든 뒤, 다음에 부를 두 호출을 출력합니다.

1. `playwright:browser_run_code_unsafe` `{ filename: "<mcpDir>/run.js" }` → 화면당 한 줄(`ok rows=… ms` / `FAIL …`)
2. `playwright:browser_evaluate` `{ function: <출력된 DUMP>, filename: "<mcpDir>/impl.json" }` → 측정값이 파일로만 저장됨

`browser_run_code_unsafe`는 Playwright 서버에서 코드를 실행하는 도구라 권한 확인이 뜰 수 있습니다. 이 용도 외에 쓰지 않습니다.

```bash
node scripts/design/qa.mjs compare <폴더>/screens.json
```
맨 위에 `[공통]` 공통 후보(`gN [컴포넌트] 항목: 시안 / 구현  N화면(화면-후보 …)`)를, 이어서 화면별로 `[NN] 프레임 ↔ URL  글자 짝 a/b, 컨테이너 짝 c, 후보 n`, 공통에 속한 후보(`공통: c3→g1 …`)와 후보(`cN 항목: 시안 X / 구현 Y ×개수 [요소] 지정값·변수`), 높이 단서, 한쪽에만 있는 글자를 출력합니다. 글자 짝 비율이 낮으면(절반 미만) 화면·상태가 시안과 다른지 먼저 의심합니다.

```bash
node scripts/design/qa.mjs report <폴더>/screens.json
open <폴더>/index.html
```

## verdicts.json

```json
{
  "groups": { "g1": ["하", "표 머리 배경 겹침"], "g2": "x" },
  "summary": ["공용 Tabs 밑줄 두께 2 → 1 (src/shared/ui/tabs.tsx)", "토큰 원본 불일치(하): red/600 #DC2626 → v4 #E7000B"],
  "screens": {
    "01": {
      "viewed": true,
      "c1": ["중", "본문 위 여백"],
      "c2": "x",
      "c3": ["?", "구독 중 계정이라 시안 상태와 다름"],
      "c12": ["중"],
      "extra": [{ "element": "상세보기 아이콘", "prop": "아이콘", "design": "chevron-down", "impl": "chevron-right", "severity": "중", "note": "" }],
      "mismatch": ["TAB 프레임의 같은 카드는 radius 6"],
      "check": ["가격 아래 줄 간격이 데이터 길이에 따라 다름"]
    }
  }
}
```

- 값: `["상"|"중"|"하", "메모"]` = 차이, `"x"` = 오탐, `["?", "메모"]` = 확인 필요. 메모는 한 문장(원인이나 "summary 1과 같은 원인").
- `groups`: `compare` 맨 위 공통 후보(`gN`, `compare/groups.json`) 판정. 값 형식은 화면 후보와 같고, 그 화면의 `cN` 판정이 있으면 화면 판정이 우선입니다.
- `viewed`: 그 화면의 캡처(`view/NN-*.png`)를 보고 판정했으면 `true`. 보고서에 "캡처 확인 / 규칙 판정"으로 표시됩니다.
- 판정하지 않은 후보는 보고서에 "확인 필요 — 미판정"으로 들어갑니다.
- 차이 위치 박스(캡처 위 번호)는 후보의 첫 요소 위치로 자동으로 그려집니다. `extra`에 `box`·`figmaBox`(`{x,y,w,h}`, 캡처 기준)를 주면 그립니다.
