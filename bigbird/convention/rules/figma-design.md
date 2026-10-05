---
paths:
  - "src/**/*.tsx"
  - "src/**/*.css"
---

# Figma MCP 연동 및 디자인-코드 변환 규칙

`bigbird`는 **Figma MCP Server**를 연동하여 Figma 디자인 시안과 React 코드 간의 100% 무결성을 유지합니다.

## 1. Figma MCP 도구 활용 워크플로우

1. **디자인 탐색**: Figma URL 또는 노드 ID를 기반으로 레이아웃 계층 및 컴포넌트 메타데이터를 파악합니다.
2. **디자인 토큰 추출**: 색상(Hex/RGBA), 타이포그래피(font size, weight, line height), 간격(Spacing), 반경(Radius), 그림자(Shadow)를 추출합니다.
3. **shadcn/ui 및 Tailwind 매핑**:
   - Figma Auto-Layout (Horizontal/Vertical) ➔ Tailwind `flex flex-row / flex-col`, `gap-{n}`, `items-center`, `justify-between`
   - Figma Padding / Margin ➔ `p-{n}`, `px-{n}`, `py-{n}`
   - Figma Corner Radius ➔ `rounded-{sm|md|lg|xl|2xl|full}`
   - Figma Component Variants ➔ `cva` variants (`variant`, `size`)
4. **FSD 레이어 매핑**:
   - Atomic 디자인 에셋/기본 버튼/인풋 ➔ `src/shared/ui/`
   - 비즈니스 도메인 UI 카드/프로필 ➔ `src/entities/{domain}/ui/`
   - 인터랙티브 폼/다이얼로그 ➔ `src/features/{domain}/ui/`
   - 대형 레이아웃 복합 뷰 ➔ `src/widgets/{domain}/ui/`

## 2. 변환 시 필수 점검 사항

- ❌ **하드코딩 금지**: `w-[347px]` 같은 불필요한 임의 픽셀 고정 대신 `w-full max-w-sm` 등의 반응형 유틸리티 클래스 사용.
- ❌ **인라인 스타일 금지**: `style={{ color: '#333' }}` 대신 Tailwind 시맨틱 토큰(`text-foreground`, `text-muted-foreground`) 활용.
- ✅ **상태 인터랙션 고려**: Figma의 Default/Hover/Active/Disabled 상태를 Tailwind 가상 클래스(`hover:`, `active:`, `disabled:`)로 완전 구현.
- ✅ **시맨틱 태그 준수**: 단순 `<div>` 남발 대신 `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<button>` 등 웹 표준 태그 적용.
