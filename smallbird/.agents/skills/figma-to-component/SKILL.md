---
name: figma-to-component
description: Figma URL이나 노드 ID를 받아 React + shadcn/ui + Tailwind 컴포넌트를 구현하거나, 구현에 필요한 디자인 값(토큰, 간격, 상태)을 Figma MCP로 확인할 때 사용합니다. Figma 페이지를 훑어 스펙을 쓰거나 로컬 Figma 캐시(.claude/figma-cache/)를 만들고 읽을 때도 사용합니다. 디자인 시안을 코드로 옮기는 모든 작업에 적용됩니다.
---
<!-- GENERATED FILE: 직접 수정 금지. 원본은 .claude/skills/figma-to-component/SKILL.md 이며, 수정 후 `python ai/scripts/render_agents.py` 를 실행하세요. -->

# Figma 디자인 → 코드

Figma가 디자인의 원본입니다. 값은 Figma MCP 서버(`figma`)의 도구로 읽고, **연결이 안 되거나 값이 없으면 추측하지 말고 멈춰서 보고합니다.** 디자인이 없는 화면은 만들지 않고, 데이터 레이어(타입, 훅)까지만 만든 뒤 보고합니다.

대상: 사용자가 지정한 Figma URL/노드와 구현할 컴포넌트 (지정이 없으면 질문)

## 로컬 Figma 캐시

페이지 단위 URL을 받았거나, 스펙을 쓰거나, 여러 프레임을 훑어야 할 때는 스캔 결과를 `.claude/figma-cache/`에 문서로 남기고 이후 작업에서 Figma보다 먼저 읽습니다. Figma MCP 호출 수를 줄이기 위해서입니다(원격 MCP는 Dev Mode 좌석 단위 호출 한도가 있습니다). node 1~2개만 보는 작업에는 만들지 않습니다.

- **로컬 전용**입니다(`.gitignore`). 확정된 결정은 캐시가 아니라 `specs/[<그룹>/]<feature>.md`에 적습니다.
- `README.md`가 목차입니다. 페이지마다 파일 키·node ID·스캔일·Figma Change log 버전·문서 목록을 적습니다. 작업을 시작할 때 Figma Change log 버전이 캐시와 다르면 다시 스캔합니다.
- 페이지(또는 구역) 문서에 담는 것: 화면 목록(node ID·기기·상태·쌍을 이루는 긴 스크롤 프레임), 화면별 구조와 **문구 원문**, 다이얼로그(제목·본문·버튼 원문), 디자이너 주석(`Guide Caption` 등) 원문, 반응형 차이, 애매한 점(node ID와 함께, 답은 추측하지 않음).
- 문구 출처를 표시합니다: `[DC]`는 `get_design_context`로 읽은 텍스트, `[SS]`는 스크린샷으로 읽은 텍스트입니다. `[SS]` 문구와 간격·색 같은 정확한 값은 구현 전에 node ID로 다시 확인합니다.
- 화면에 보이지 않는 숨은 레이어·주석 보조 문구는 "(숨김)"으로 따로 적습니다. 다른 화면에서 복사된 잔재가 많아 정책 근거로 쓰지 않습니다.
- 프레임 이름은 실제 내용과 다를 수 있습니다(복붙). 이름이 아니라 내용으로 화면을 분류합니다.
- 큰 페이지는 `get_metadata`로 최상위 노드를 뽑아 구역별로 나누고 서브에이전트에 맡깁니다. 동시에 너무 많이 돌리지 않고(한도 초과 원인), 스크린샷은 레이아웃 확인이 필요한 프레임만 받습니다. 원격 MCP(`figma`)가 한도에 걸리면 데스크톱 MCP(`figma-desktop`)로 이어 받습니다. 이때 Figma 데스크톱 앱에 해당 파일이 열려 있어야 합니다.

## 순서

1. **파악**: 캐시가 있으면 먼저 읽습니다. URL/노드로 레이아웃 계층과 컴포넌트를 확인합니다(Figma MCP의 `get_metadata`, `get_design_context`). 필요하면 스크린샷으로 시각 기준을 잡습니다.
2. **토큰**: 색상, 타이포그래피, 간격, 반경, 그림자를 읽습니다(`get_variable_defs`). 기존 Tailwind/shadcn 토큰으로 표현되는지 먼저 확인하고, 없을 때만 새 토큰을 제안합니다.
3. **배치 결정**: 아래 기준으로 FSD 레이어를 정합니다. 애매하면 `architect` 에이전트(없으면 사용자)에게 묻습니다.
   - 도메인과 무관한 기본 UI(버튼, 입력) → `shared/ui`
   - 도메인 데이터를 보여주는 카드·프로필 → `entities/{domain}/ui`
   - 사용자 동작이 있는 폼·다이얼로그 → `features/{domain}/ui`
   - 여러 요소를 조합한 큰 블록 → `widgets/{domain}/ui`
4. **구현**: 아래 매핑을 기준으로 shadcn/ui 프리미티브를 조합합니다.
   - Auto Layout → `flex`/`grid` + `gap`, Padding → `p-*`, Corner Radius → `rounded-*`
   - Component Variants → `cva`의 `variant`/`size`
   - 상태(Default/Hover/Active/Focus/Disabled)와 반응형을 함께 구현
5. **문구**: Figma 텍스트를 하드코딩하지 않고 슬라이스의 `locales/ko.json`에 키로 옮긴 뒤 `t()`로 연결하고, `en`·`ja`·`zh-CN` 번역도 같은 작업에서 씁니다. 서버 값 표시·미확정 고유 용어·간결한 번역 기준은 `.claude/rules/i18n.md`와 `i18n-translation.md`를 따릅니다.
6. **마크업**: `<div>` 대신 의미에 맞는 태그(`header`, `nav`, `main`, `section`, `article`, `button`)를 씁니다.
7. **시각 검증**: `pnpm dev`로 띄운 화면을 브라우저 MCP(`playwright`)로 열어 Figma 프레임과 같은 뷰포트에서 스크린샷을 찍고(문구가 가장 긴 `en`으로도 넘침을 확인), Figma 스크린샷과 비교해 차이(간격, 색, 타이포, 상태)를 나열한 뒤 고칩니다. 차이가 없을 때까지 반복하고, 브라우저 MCP를 쓸 수 없으면 비교하지 못했다는 사실을 보고합니다(통과로 간주하지 않습니다).
8. **정적 검증**: `pnpm verify` 결과를 보고합니다.

스타일 토큰과 임의 값(`w-[347px]`) 규칙은 `.claude/rules/styling.md`, 슬라이스 구조는 `.claude/rules/architecture.md`를 따릅니다.
