---
description: "Generate pixel-perfect React + shadcn/ui component from Figma design using Figma MCP"
---

Figma MCP 도구를 사용하여 제공된 Figma URL 또는 노드 ID의 디자인 스펙을 분석하고, `bigbird`의 FSD 아키텍처 및 shadcn/ui + Tailwind CSS v4 규격에 맞춰 React 컴포넌트를 구현합니다.

작업 단계:
1. Figma 노드의 레이아웃(Auto Layout), 간격, 색상, 타이포그래피 토큰 추출
2. FSD 적합 레이어(`shared/ui`, `entities/*/ui`, `features/*/ui`, `widgets/*/ui`) 결정
3. shadcn/ui 기반 컴포넌트 마크업 및 CVA 변형 작성
4. 상태 변화(Hover, Active, Focus, Disabled) 및 반응형 레이아웃 적용
