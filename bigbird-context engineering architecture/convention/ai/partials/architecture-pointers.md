## 아키텍처 가이드 포인터

- 경로별 상세 규칙은 `.claude/rules/`에 있습니다. Claude Code는 해당 경로를 편집할 때 자동 로드하고, Codex는 영역 작업 전에 직접 읽습니다: `architecture`(FSD), `react-components`, `code-style`(네이밍·상수·훅·타입 스타일), `state-management`(Zustand·SWR), `styling`(shadcn·Tailwind·CVA), `api-integration`(OpenAPI·Zod·트랜스포머), `routing`, `i18n`(다국어 키·번역 파일·포맷), `i18n-translation`(번역 작성 흐름·간결한 번역), `error-handling`, `testing`, `performance`, `dependencies`
- 절차형 skill (필요할 때만 로드): Figma 디자인 → 코드 `.claude/skills/figma-to-component/`, 컴포넌트 스캐폴딩 `.claude/skills/scaffold-component/`, React Router `.claude/skills/react-router/`, 모바일 가상 키보드·iOS Safari 입력 동작 `.claude/skills/mobile-keyboard/`(추측 금지, 공식 문서·버그 트래커 근거와 실기기 측정 필수) (Codex는 `.agents/skills/`의 생성 사본)
- Figma 스캔 결과 로컬 캐시(git 제외): `.claude/figma-cache/`. 작업 전에 먼저 읽고, 만드는 규칙은 `figma-to-component` skill에 있습니다.
- FSD 경계 린트 강제: 루트 `eslint.config.js`
