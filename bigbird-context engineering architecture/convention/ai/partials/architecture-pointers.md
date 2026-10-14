## 아키텍처 가이드 포인터

- 경로별 상세 규칙은 `.claude/rules/`에 있습니다. Claude Code는 해당 경로를 편집할 때 자동 로드하고, Codex는 영역 작업 전에 직접 읽습니다: `architecture`(FSD), `react-components`, `code-style`(네이밍·상수·훅·타입 스타일), `state-management`(Zustand·SWR), `styling`(shadcn·Tailwind·CVA), `api-integration`(OpenAPI·Zod·트랜스포머), `routing`, `error-handling`, `testing`, `performance`, `dependencies`
- 절차형 skill (필요할 때만 로드): Figma 디자인 → 코드 `.claude/skills/figma-to-component/`, 컴포넌트 스캐폴딩 `.claude/skills/scaffold-component/`, React Router `.claude/skills/react-router/` (Codex는 `.agents/skills/`의 생성 사본)
- FSD 경계 린트 강제: 루트 `eslint.config.js`
