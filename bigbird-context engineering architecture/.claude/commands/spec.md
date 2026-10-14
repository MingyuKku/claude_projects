---
description: "Interview the user about a new feature and write a self-contained spec to specs/<feature>.md"
---

다음 기능의 스펙을 작성합니다: $ARGUMENTS

1. 코드를 쓰지 않습니다. 먼저 관련 코드(인접 슬라이스, 기존 패턴)와 Figma/OpenAPI 명세를 읽어 질문거리를 줄입니다.
2. `AskUserQuestion`으로 인터뷰합니다. 뻔한 질문은 건너뛰고 사용자가 놓쳤을 어려운 부분(엣지 케이스, 에러·빈 상태, 레이어/슬라이스 경계, 상태 소유자, 범위 밖 항목)을 묻습니다. 더 물을 것이 없을 때까지 반복합니다.
3. `specs/<feature-slug>.md`에 스펙을 씁니다. 스펙은 그 문서만 읽고 새 세션에서 구현할 수 있어야 합니다:
   - 목적과 사용자 시나리오
   - 관련 파일·슬라이스·Public API(`index.ts`)·인터페이스
   - 데이터 흐름(OpenAPI → Zod → 트랜스포머 → SWR → UI)과 상태 소유자
   - 범위 밖(하지 않을 것)
   - 끝에 **종단 간 검증 단계**: 실행할 명령(`pnpm typecheck`/`lint`/`test`)과 화면에서 확인할 시나리오
4. 스펙 경로를 알려주고 멈춥니다. 구현은 `/clear` 또는 새 세션에서 "specs/<feature-slug>.md를 구현하라"로 시작하도록 안내합니다.
