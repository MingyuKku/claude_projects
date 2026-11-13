---
name: figma-to-component
description: Figma URL이나 노드 ID를 받아 React + shadcn/ui + Tailwind 컴포넌트를 구현하거나, 구현에 필요한 디자인 값(토큰, 간격, 상태)을 확인할 때 사용합니다. 프레임 지정값은 scripts/design/figma.mjs(Figma REST)로 받고, 완료 전에 design-qa 의 대조 스크립트로 시안과 같은지 검사합니다. Figma 페이지를 훑어 스펙을 쓰거나 로컬 Figma 캐시(.claude/figma-cache/)를 만들고 읽을 때도 사용합니다. 디자인 시안을 코드로 옮기는 모든 작업에 적용됩니다.
---
<!-- GENERATED FILE: 직접 수정 금지. 원본은 .claude/skills/figma-to-component/SKILL.md 이며, 수정 후 `python ai/scripts/render_agents.py` 를 실행하세요. -->

# Figma 디자인 → 코드

Figma가 디자인의 원본입니다. 프레임 지정값은 `scripts/design/figma.mjs`(Figma REST, `.env.local`의 `FIGMA_TOKEN`)로 받고, 한두 노드의 상세나 스크린샷은 Figma MCP(`figma`)로 봅니다. **토큰이 없거나 연결이 안 되거나 값이 없으면 추측하지 말고 멈춰서 보고합니다.** 디자인이 없는 화면은 만들지 않고, 데이터 레이어(타입, 훅)까지만 만든 뒤 보고합니다.

대상: 사용자가 지정한 Figma URL/노드와 구현할 컴포넌트 (지정이 없으면 질문)

## 로컬 Figma 캐시

페이지 단위 URL을 받았거나, 스펙을 쓰거나, 여러 프레임을 훑어야 할 때는 스캔 결과를 `.claude/figma-cache/`에 문서로 남기고 이후 작업에서 Figma보다 먼저 읽습니다. Figma MCP 호출 수를 줄이기 위해서입니다(원격 MCP는 Dev Mode 좌석 단위 호출 한도가 있습니다). node 1~2개만 보는 작업에는 만들지 않습니다.

- **로컬 전용**입니다(`.gitignore`). 확정된 결정은 캐시가 아니라 `specs/[<그룹>/]<feature>.md`에 적습니다.
- 캐시는 화면 구성·문구·주석을 파악하는 지도입니다. **간격·색·글꼴 같은 지정값은 캐시에서 옮기지 않고 구현할 때마다 Figma에서 새로 받습니다**(`figma.mjs outline`).
- `README.md`가 목차입니다. 페이지마다 파일 키·node ID·스캔일·Figma Change log 버전·문서 목록을 적습니다. 작업을 시작할 때 Figma Change log 버전이 캐시와 다르면 다시 스캔합니다.
- 페이지(또는 구역) 문서에 담는 것: 화면 목록(node ID·기기·상태·쌍을 이루는 긴 스크롤 프레임), 화면별 구조와 **문구 원문**, 다이얼로그(제목·본문·버튼 원문), 디자이너 주석(`Guide Caption` 등) 원문, 반응형 차이, 애매한 점(node ID와 함께, 답은 추측하지 않음).
- 문구 출처를 표시합니다: `[DC]`는 `get_design_context`로 읽은 텍스트, `[SS]`는 스크린샷으로 읽은 텍스트입니다. `[SS]` 문구와 간격·색 같은 정확한 값은 구현 전에 node ID로 다시 확인합니다.
- 화면에 보이지 않는 숨은 레이어·주석 보조 문구는 "(숨김)"으로 따로 적습니다. 다른 화면에서 복사된 잔재가 많아 정책 근거로 쓰지 않습니다.
- 프레임 이름은 실제 내용과 다를 수 있습니다(복붙). 이름이 아니라 내용으로 화면을 분류합니다.
- 프레임 찾기는 `design-qa` skill의 `references/figma-frames.md`(Plugin API 한 번으로 페이지 전체 프레임과 화면 제목)를 씁니다. 사용자에게 node를 하나씩 달라고 하지 않습니다.
- 큰 페이지는 최상위 노드를 구역별로 나누고 서브에이전트에 맡깁니다. 동시에 너무 많이 돌리지 않고(한도 초과 원인), 스크린샷은 레이아웃 확인이 필요한 프레임만 받습니다. 원격 MCP(`figma`)가 한도에 걸리면 데스크톱 MCP(`figma-desktop`)로 이어 받습니다. 이때 Figma 데스크톱 앱에 해당 파일이 열려 있어야 합니다.

## 순서

1. **파악**: 캐시가 있으면 먼저 읽어 화면 구성을 파악합니다. 구현할 프레임마다(기기별로) `node scripts/design/figma.mjs outline <node,…>`로 **프레임 전체 지정값**을 받습니다. 한 줄에 요소 하나씩, 자동 레이아웃(방향·gap·padding·정렬)·크기 방식(fixed/hug/fill)·색·테두리·radius·그림자·글자(크기/굵기/행간·자간·색)·컴포넌트 변형이 나오고, 변수가 연결된 값은 코드 클래스 이름(`ds-gap-4`, `ds-text-sm-5-medium`)이 함께 나옵니다. 필요한 노드만 골라 읽지 않고 이 요약 전체를 기준으로 구현합니다(빠진 값이 기본값으로 채워지는 것을 막기 위해). 모양을 눈으로 확인할 때만 `figma.mjs image` 또는 `get_screenshot`을 씁니다.
2. **토큰**: 간격·텍스트 스타일·그림자는 시안 이름 앞에 `ds-`를 붙인 클래스를 씁니다(값이 기기마다 바뀌는 Figma 토큰, `.claude/rules/styling.md`). 색·radius는 shadcn 시맨틱 토큰(`bg-muted`, `rounded-md`)을 씁니다. `outline`에 변수 없이 숫자만 나온 값은 임의 값으로 옮기지 말고, 가까운 토큰이 있는지 확인한 뒤 없으면 "시안 불일치(토큰 밖 값)"로 보고합니다.
3. **배치 결정**: 아래 기준으로 FSD 레이어를 정합니다. 애매하면 `architect` 에이전트(없으면 사용자)에게 묻습니다.
   - 도메인과 무관한 기본 UI(버튼, 입력) → `shared/ui`
   - 도메인 데이터를 보여주는 카드·프로필 → `entities/{domain}/ui`
   - 사용자 동작이 있는 폼·다이얼로그 → `features/{domain}/ui`
   - 여러 요소를 조합한 큰 블록 → `widgets/{domain}/ui`
4. **구현**: 아래 매핑을 기준으로 shadcn/ui 프리미티브를 조합합니다(Figma 값 → CSS 대응의 세부는 `design-qa` skill "비교 기준").
   - Auto Layout → `flex`/`grid` + `ds-gap-*`, Padding → `ds-p-*`, Corner Radius → `rounded-*`, 텍스트 스타일 → `ds-text-*`
   - 크기 방식: hug → 내용 크기, fill → `flex-1`·늘림, fixed → 고정 크기
   - Component Variants → `cva`의 `variant`/`size`
   - 상태(Default/Hover/Active/Focus/Disabled)와 반응형을 함께 구현
5. **문구**: Figma 텍스트를 하드코딩하지 않고 슬라이스의 `locales/ko.json`에 키로 옮긴 뒤 `t()`로 연결하고, `en`·`ja`·`zh-CN` 번역도 같은 작업에서 씁니다. 서버 값 표시·미확정 고유 용어·간결한 번역 기준은 `.claude/rules/i18n.md`와 `i18n-translation.md`를 따릅니다.
6. **마크업**: `<div>` 대신 의미에 맞는 태그(`header`, `nav`, `main`, `section`, `article`, `button`)를 씁니다.
7. **시안 대조(완료 조건)**: 스크린샷 눈 비교로 끝내지 않습니다. `design-qa` skill의 일괄 도구(`references/workflow.md`)로 구현한 화면을 시안 프레임과 대조합니다. `screens.json`에 구현한 화면·기기를 적고 `qa.mjs prepare` → Playwright 측정 → `qa.mjs compare`를 돌려 나온 후보를 고칩니다. 고친 뒤 다시 `compare`까지 돌려 **상·중 차이 후보가 남지 않을 때까지** 반복합니다. 보고서(`report`)는 사용자가 원할 때만 만듭니다.
   - 남은 후보는 오탐(구조만 다르고 화면 결과가 같음, 데이터 차이)·시안 불일치·토큰 밖 값 중 하나여야 하고, 그 판정을 완료 보고에 적습니다.
   - 시안과 맞추려고 임의 값(`p-[18px]`)·인라인 스타일을 쓰지 않습니다. 토큰으로 안 맞는 값은 고치지 않고 보고합니다.
   - 지정값으로 안 잡히는 것(아이콘 모양, 넘침)은 마지막에 `en`으로 한 번 캡처해 확인합니다.
   - 측정(`browser_run_code_unsafe`·`browser_evaluate`)은 메인 세션이 합니다. 구현을 `frontend-tech-lead` 서브에이전트에 맡겼다면 그 에이전트에는 측정 도구가 없으므로, 메인 세션이 측정·`compare`를 돌려 후보를 넘기고 서브에이전트는 그 후보로 고칩니다.
   - FIGMA_TOKEN·브라우저 MCP를 쓸 수 없으면 대조하지 못했다는 사실을 보고합니다(통과로 간주하지 않습니다).
8. **정적 검증**: `pnpm verify` 결과를 보고합니다.

스타일 토큰과 임의 값(`w-[347px]`) 규칙은 `.claude/rules/styling.md`, 슬라이스 구조는 `.claude/rules/architecture.md`를 따릅니다.
