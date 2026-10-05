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
