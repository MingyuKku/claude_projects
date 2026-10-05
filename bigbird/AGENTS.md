# AGENTS.md

## 목적

이 파일은 `bigbird` 프로젝트에서 활동하는 AI 코딩 에이전트를 위한 통합 가이드라인이자 단일 진실 공급원(SSOT)입니다.
도구별 설정 파일(예: `CLAUDE.md`, `.github/copilot-instructions.md`, `.gemini/settings.json`)은 템플릿으로부터 자동 컴파일되며 항상 이 문서의 정책과 엄격히 일치해야 합니다.

## 프로젝트 개요

`bigbird`는 React 19, TypeScript, **Feature-Sliced Design(FSD)** 아키텍처를 기반으로 구축된 고성능 모던 웹 애플리케이션입니다.
상태 관리는 **Zustand**, 비동기 데이터 통신은 **SWR**, 런타임 스키마 검증은 **Zod**, UI는 **shadcn/ui + Tailwind CSS**, API는 **OpenAPI** 규격을 따르며, **Figma MCP** 서버와의 연동을 통해 디자인과 코드 간의 무결성을 실시간으로 보장합니다.

## 기술 스택

- **프레임워크**: React 19 + TypeScript (Strict Mode)
- **아키텍처**: Feature-Sliced Design (FSD v2.1: `app` → `pages` → `widgets` → `features` → `entities` → `shared`)
- **패키지 매니저**: pnpm
- **상태 관리**: Zustand (클라이언트 UI 및 글로벌 상태)
- **데이터 패칭 & 캐싱**: SWR (비동기 데이터 패칭, 캐싱, Optimistic UI)
- **런타임 타입 검증**: Zod (OpenAPI 응답 검증, 폼 스키마)
- **UI 라이브러리 & 스타일링**: shadcn/ui (Radix UI), Tailwind CSS v4, Lucide Icons, class-variance-authority (cva)
- **API 통신 규격**: OpenAPI (생성된 TypeScript 타입, 타입 안전한 Fetcher)
- **디자인 연동**: Figma MCP Server (`mcp__figma__*` 도구를 통한 디자인 토큰 및 컴포넌트 추출)
- **테스트 도구**: Vitest, React Testing Library

## 핵심 명령어

```bash
pnpm dev              # 로컬 개발 서버 실행
pnpm build            # TypeScript 타입 검사 및 프로덕션 번들 빌드
pnpm test             # Vitest 기반 단위/컴포넌트 테스트 실행
pnpm test:ui          # Vitest 인터랙티브 UI 실행
pnpm lint             # ESLint / Biome 린트 검사
pnpm format           # Prettier / Biome 코드 포맷팅
python convention/ai/render.py --check  # AI 규칙/템플릿 동기화 검증
```

## 공통 컨벤션 및 개발 규칙

- **FSD 계층 구조**: 상위 레이어는 하위 레이어만 임포트할 수 있습니다 (`app` → `pages` → `widgets` → `features` → `entities` → `shared`). 동일 레이어 내 슬라이스 간 교차 임포트는 엄격히 금지됩니다.
- **의사소통 언어**: 사용자와의 대화 및 설명은 한국어로 진행하며, 코드, 주석, Git 커밋 메시지, 심볼 이름은 영어를 사용합니다.
- **데이터 흐름 & SWR**: OpenAPI 응답 → Zod 검증 → 피처 트랜스포머 → SWR 훅 → UI 컴포넌트 파이프라인을 준수합니다.
- **UI 컴포넌트**: `shadcn/ui` 컴포넌트를 `src/shared/ui/`에 배치하고, 스타일 변형은 CVA(`class-variance-authority`)와 Tailwind CSS로 제어합니다.
- **디자인 추출 (Figma MCP)**: UI 구현 시 Figma MCP를 통해 정확한 노드 스펙, 색상 변수, 간격 토큰을 추출하여 반영합니다.
- **타입 안정성**: `any` 타입 및 무분별한 타입 단언(`as Type`)을 금지하며, Zod 스키마 추론(`z.infer<typeof schema>`)을 적극 활용합니다.
- **패키지 관리 & pnpm**: 모든 의존성 설치 및 실행은 `pnpm`을 사용합니다.
- **회귀 방지 및 사이드이펙트 격리**: A 기능 개발/수정 시 다른 B 기능에 영향이 가지 않도록 FSD 슬라이스를 격리하고, `shared/`나 `entities/` 등 공통 모듈 수정 시 영향받는 모든 소비처(Consumers)의 정상 동작을 사전에 검증합니다.
- **외부 라이브러리 도입 원칙**: 신규 라이브러리 추가 전 기존 라이브러리(Zod, SWR, Zustand, Radash 등)와의 기능 중복 여부를 반드시 확인하고, React 19 호환성이 검증된 안정된 릴리스 버전을 사용하며, `src/shared/lib/`에 래퍼를 두어 의존성을 캡슐화합니다.

## 아키텍처 가이드 포인터

- Feature-Sliced Design (FSD) 계층 및 슬라이스 규칙: `.claude/rules/architecture.md`
- 회귀 방지 및 외부 의존성 관리 규칙: `.claude/rules/dependencies.md`
- React 19 및 컴포넌트 설계 패턴: `.claude/rules/react-components.md`
- 상태 관리 (Zustand) & 데이터 패칭 (SWR): `.claude/rules/state-management.md`
- UI 시스템 (shadcn/ui & Tailwind CSS & CVA): `.claude/rules/styling.md`
- API 통신 (OpenAPI & SWR & Zod & 트랜스포머): `.claude/rules/api-integration.md`
- Figma MCP 디자인 연동 규칙: `.claude/rules/figma-design.md`
- 에러 핸들링 및 에러 바운더리: `.claude/rules/error-handling.md`
- 테스트 작성 가이드라인 (Vitest): `.claude/rules/testing.md`
- 성능 최적화 및 렌더링 가이드: `.claude/rules/performance.md`
