<!-- GENERATED FILE: 직접 수정 금지. 원본은 convention/ai/ 의 partials/templates 이며, 수정 후 `python convention/ai/render.py` 를 실행하세요. -->
# AGENTS.md

## 목적

이 파일은 `bigbird` 프로젝트에서 활동하는 AI 코딩 에이전트(Claude Code, Codex)를 위한 통합 가이드라인입니다.
**생성 파일이므로 직접 수정하지 않습니다.** 원본은 `convention/ai/partials/*.md`이며, 수정 후 `python convention/ai/render.py`를 실행합니다.
`CLAUDE.md`와 에이전트 정의(`.claude/agents/`, `.codex/agents/`)도 같은 방식으로 생성됩니다. 경로별 상세 규칙(`.claude/rules/*.md`)은 생성물이 아닌 원본이며 직접 수정합니다.

## 프로젝트 개요

`bigbird`는 React 19 + TypeScript 웹 애플리케이션입니다. 설계의 핵심 목표는 **한 기능의 변경이 다른 기능으로 번지지 않게 하는 것**이며, 이를 위해 Feature-Sliced Design(FSD)으로 기능 단위를 격리합니다.
디자인의 원본은 Figma, API 계약의 원본은 OpenAPI 명세입니다.

## 기술 스택

- React 19 + TypeScript (Strict), pnpm
- 구조: Feature-Sliced Design v2.1 (`app` → `pages` → `widgets` → `features` → `entities` → `shared`)
- 라우팅: React Router (data mode, `app` 레이어에서 구성)
- 상태: Zustand (클라이언트 UI), SWR (서버 캐시, Optimistic UI)
- 검증·계약: Zod (OpenAPI 응답, 폼), OpenAPI 생성 타입
- UI: shadcn/ui (Radix), Tailwind CSS v4, CVA, lucide-react
- 디자인 연동: Figma MCP
- 테스트: Vitest, React Testing Library

## 핵심 명령어

```bash
pnpm dev              # 로컬 개발 서버 실행
pnpm build            # TypeScript 타입 검사 및 프로덕션 번들 빌드
pnpm test             # Vitest 기반 단위/컴포넌트 테스트 실행
pnpm test:ui          # Vitest 인터랙티브 UI 실행
pnpm lint             # ESLint 린트 검사
pnpm typecheck        # tsc --noEmit 타입 검사
pnpm format           # Prettier 코드 포맷팅
python convention/ai/render.py --check  # AI 규칙/템플릿 동기화 검증
```

## 공통 컨벤션 및 개발 규칙

- **의사소통 언어**: 사용자와의 대화·설명은 한국어, 코드·주석·커밋 메시지·심볼 이름은 영어를 사용합니다.
- **구조와 격리**: 의존 방향은 FSD 단방향이고 슬라이스는 서로 격리됩니다. 규칙은 `.claude/rules/architecture.md`에, 집행은 ESLint에 있습니다. `shared/`·`entities/`를 수정하기 전에는 Grep으로 소비처를 확인합니다.
- **데이터 흐름**: OpenAPI 응답 → Zod 검증 → 트랜스포머 → SWR 훅 → UI. UI는 raw API 타입에 의존하지 않습니다. 타입은 Zod 스키마에서 추론하고 단언으로 맞추지 않습니다.
- **완료 기준**: 작업을 끝내기 전에 `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`를 통과시키고, 실행하지 못한 검사가 있으면 그 사실을 명시합니다. 훅이 일부를 자동 실행하지만 최종 확인 책임은 에이전트에게 있습니다.
- **추측 금지 및 질문**: 스택·아키텍처 결정을 벗어나는 변경(신규 라이브러리, 레이어 규칙 예외 등)과 명세에 없는 API 응답·에러 형태, Figma에 없는 디자인 값은 추측하지 않고 먼저 질문합니다. Figma MCP 연결이 안 되면 멈추고 보고합니다.
- **린트·스타일 처리**: 포맷과 import 정렬은 훅이 ESLint/Prettier로 자동 교정하므로 직접 맞추지 않습니다. 린트·타입 에러는 `eslint-disable`, `@ts-ignore`, 규칙 완화로 덮지 말고 근본 원인을 고칩니다. 린트·Prettier·tsconfig 설정 변경은 사용자 승인이 필요한 팀 결정입니다.

## 아키텍처 가이드 포인터

- 경로별 상세 규칙은 `.claude/rules/`에 있습니다. Claude Code는 해당 경로를 편집할 때 자동 로드하고, Codex는 영역 작업 전에 직접 읽습니다: `architecture`(FSD), `react-components`, `state-management`(Zustand·SWR), `styling`(shadcn·Tailwind·CVA), `api-integration`(OpenAPI·Zod·트랜스포머), `routing`, `error-handling`, `testing`, `performance`, `dependencies`
- 절차형 skill (필요할 때만 로드): Figma 디자인 → 코드 `.claude/skills/figma-to-component/`, 컴포넌트 스캐폴딩 `.claude/skills/scaffold-component/`, React Router `.claude/skills/react-router/` (Codex는 `.agents/skills/`의 생성 사본)
- FSD 경계 린트 강제: 루트 `eslint.config.js`
