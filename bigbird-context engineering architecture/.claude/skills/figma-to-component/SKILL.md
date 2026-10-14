---
name: figma-to-component
description: Figma URL이나 노드 ID를 받아 React + shadcn/ui + Tailwind 컴포넌트를 구현하거나, 구현에 필요한 디자인 값(토큰, 간격, 상태)을 Figma MCP로 확인할 때 사용합니다. 디자인 시안을 코드로 옮기는 모든 작업에 적용됩니다.
---

# Figma 디자인 → 코드

Figma가 디자인의 원본입니다. 값은 Figma MCP 서버(`figma`)의 도구로 읽고, **연결이 안 되거나 값이 없으면 추측하지 말고 멈춰서 보고합니다.** 디자인이 없는 화면은 만들지 않고, 데이터 레이어(타입, 훅)까지만 만든 뒤 보고합니다.

대상: 사용자가 지정한 Figma URL/노드와 구현할 컴포넌트 (지정이 없으면 질문)

## 순서

1. **파악**: URL/노드로 레이아웃 계층과 컴포넌트를 확인합니다(Figma MCP의 `get_metadata`, `get_design_context`). 필요하면 스크린샷으로 시각 기준을 잡습니다.
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
5. **마크업**: `<div>` 대신 의미에 맞는 태그(`header`, `nav`, `main`, `section`, `article`, `button`)를 씁니다.
6. **시각 검증**: `pnpm dev`로 띄운 화면을 브라우저 MCP(`playwright`)로 열어 Figma 프레임과 같은 뷰포트에서 스크린샷을 찍고, Figma 스크린샷과 비교해 차이(간격, 색, 타이포, 상태)를 나열한 뒤 고칩니다. 차이가 없을 때까지 반복하고, 브라우저 MCP를 쓸 수 없으면 비교하지 못했다는 사실을 보고합니다(통과로 간주하지 않습니다).
7. **정적 검증**: `pnpm typecheck`, `pnpm lint`, `pnpm test` 결과를 보고합니다.

스타일 토큰과 임의 값(`w-[347px]`) 규칙은 `.claude/rules/styling.md`, 슬라이스 구조는 `.claude/rules/architecture.md`를 따릅니다.
