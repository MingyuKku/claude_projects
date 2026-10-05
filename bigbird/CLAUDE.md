# CLAUDE.md

@AGENTS.md

## Claude 전용 가이드

- 본 파일은 극도로 간결하게 유지합니다. 프로젝트 공통 표준은 `AGENTS.md`에 정의되어 있습니다.
- 전문 서브에이전트는 `.claude/agents/`에 위치합니다 (`architect`, `frontend-tech-lead`, `implementation-planner`, `pair-programmer`, `gemini-pair`).
- 파일 경로별 상세 규칙은 Claude Code에 의해 `.claude/rules/*.md`에서 자동으로 로드됩니다.
- 빠른 실행을 위한 커스텀 슬래시 커맨드는 `.claude/commands/`에 등록되어 있습니다 (`/plan`, `/review`, `/component`, `/figma`, `/gemini`).
- 세션별 로컬 작업 메모는 `CLAUDE.local.md` (gitignored)에 작성하십시오.
