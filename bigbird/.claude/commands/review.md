---
description: "Launch read-only reviewer subagent to review React & TypeScript changes for FSD compliance"
---

최근 작성/수정된 React 및 TypeScript 코드(`git diff` 기준)를 `reviewer` 서브에이전트(읽기 전용)로 리뷰합니다.

다음 항목을 중점 점검하고, 정확성·요구사항·FSD 규칙에 영향이 없는 취향성 제안은 보고하지 마세요:

1. FSD 레이어 침범 및 슬라이스 간 교차 임포트, Public API(`index.ts`) 우회 여부
2. OpenAPI 응답이 Zod 검증과 트랜스포머를 거치는지 (UI가 raw API 타입에 직접 의존하지 않는지)
3. TypeScript 엄격성 (`any` 및 불안전한 단언 제거)
4. React 19 패턴 및 측정 가능한 렌더링 성능 문제
5. 에러/로딩/빈 상태 처리의 완성도
6. `shared/`·`entities/` 수정 시 소비처 영향도

$ARGUMENTS
