---
description: "Launch frontend-tech-lead subagent to review React & TypeScript code quality and architecture compliance"
---

최근 작성/수정된 React 및 TypeScript 코드에 대해 `frontend-tech-lead` 서브에이전트로 시니어 관점 코드 리뷰를 수행합니다.

다음 항목을 중점 점검하세요:
1. 클린 아키텍처 및 레이어 침범 여부 (Features, Shell, Shared)
2. API 트랜스포머 적용 여부 (UI 컴포넌트가 raw API 타입에 직접 의존하지 않는지)
3. TypeScript 엄격성 (any 및 불안전한 단언 제거)
4. React 19 메커니즘 및 렌더링 성능 최적화
5. 에러/로딩/빈 상태 처리의 완성도
