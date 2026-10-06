## 기술 스택

- React 19 + TypeScript (Strict), pnpm
- 구조: Feature-Sliced Design v2.1 (`app` → `pages` → `widgets` → `features` → `entities` → `shared`)
- 라우팅: React Router (data mode, `app` 레이어에서 구성)
- 상태: Zustand (클라이언트 UI), SWR (서버 캐시, Optimistic UI)
- 검증·계약: Zod (OpenAPI 응답, 폼), OpenAPI 생성 타입
- UI: shadcn/ui (Radix), Tailwind CSS v4, CVA, lucide-react
- 디자인 연동: Figma MCP
- 테스트: Vitest, React Testing Library
