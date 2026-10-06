# AI 인스트럭션 관리 (Claude Code · Codex)

여러 명이 같이 쓰는 레포이므로 **무엇이 원본이고 무엇이 생성물인지**를 구분합니다.

| 파일                                                                                                                 | 종류                                     | 수정 방법                                                   |
| :------------------------------------------------------------------------------------------------------------------- | :--------------------------------------- | :---------------------------------------------------------- |
| `.claude/rules/*.md`                                                                                                 | **원본**                                 | 직접 수정 후 PR                                             |
| `.claude/settings.json`, `.claude/hooks/`, `.claude/commands/`, `.claude/skills/`, `.mcp.json`, `.codex/config.toml` | **원본**                                 | 직접 수정 후 PR (skill 수정 후에는 `render_agents.py` 실행) |
| `convention/ai/partials/*.md`, `templates/*.tmpl`                                                                    | **원본**                                 | 수정 후 `render.py` 실행                                    |
| `ai/agents/source/*.md`, `ai/adapters/*`                                                                             | **원본**                                 | 수정 후 `render_agents.py` 실행                             |
| `AGENTS.md`, `CLAUDE.md`                                                                                             | 생성물                                   | 직접 수정 금지                                              |
| `.claude/agents/*`, `.codex/agents/*`                                                                                | 생성물                                   | 직접 수정 금지                                              |
| `.agents/skills/*`                                                                                                   | 생성물 (`.claude/skills`의 Codex용 사본) | 직접 수정 금지                                              |

개인 설정은 `CLAUDE.local.md`, `.claude/settings.local.json`에 둡니다 (gitignore 대상). 공용 `settings.json`에는 팀 공통 정책만 넣습니다.

## 사용 방법

```bash
python convention/ai/render.py            # AGENTS.md, CLAUDE.md 생성
python ai/scripts/render_agents.py        # 에이전트 정의(Claude, Codex)와 Codex용 skill 사본 생성
```

생성물이 원본과 일치하는지 검증 (불일치 시 non-zero 종료):

```bash
python convention/ai/render.py --check
python ai/scripts/render_agents.py --check
```

## CI 예시 (GitLab CI)

```yaml
ai-config-sync:
  stage: test
  image: python:3.12-slim
  script:
    - python convention/ai/render.py --check
    - python ai/scripts/render_agents.py --check
  rules:
    - changes:
        [
          AGENTS.md,
          CLAUDE.md,
          .claude/**/*,
          .codex/**/*,
          .agents/**/*,
          ai/**/*,
          convention/ai/**/*,
        ]
```

## 리뷰 규칙

`CODEOWNERS`가 AI 동작을 바꾸는 경로(`.claude/`, `ai/`, `convention/`, `AGENTS.md`, `CLAUDE.md`, `.mcp.json`)를 지정합니다.
레포 호스팅에 맞게 위치(GitLab: 루트 또는 `.gitlab/CODEOWNERS`, GitHub: `.github/CODEOWNERS`)와 소유자 이름을 조정하세요.

## Codex 설정 메모

- Codex는 `.agents/skills/`에서 skill을 찾으므로 `.claude/skills/`를 복사해 둡니다 (심볼릭 링크 대신 복사 + `--check`로 drift 검증).
- Figma MCP는 `.codex/config.toml`에 등록되어 있습니다. 최초 1회 `codex mcp login figma`로 로그인합니다. 프로젝트 범위 설정은 **신뢰된(trusted) 프로젝트**에서만 적용됩니다.
- 훅(편집 직후 ESLint/Prettier, Stop 검증)과 권한 규칙은 Claude Code 전용입니다. Codex 세션에서는 같은 강제가 없으므로 린트·테스트는 직접 실행하고, CI를 최종 판정으로 삼습니다.
