# bigbird

React 19 + TypeScript + Feature-Sliced Design(FSD) 웹 애플리케이션입니다.

## 시작하기

필요한 것: Node.js 22 (`.nvmrc` 참고).

pnpm은 Node에 포함된 corepack으로 사용합니다. 프로젝트가 요구하는 버전(`package.json`의 `packageManager`)이 자동으로 쓰이므로, 새 컴퓨터에서 **처음 한 번만** 아래를 실행합니다.

```bash
corepack enable
```

`pnpm: command not found`가 나오면 이 단계를 빠뜨린 것입니다. 권한 오류(EACCES)가 나면 `sudo corepack enable`을 실행하세요.

```bash
pnpm install
pnpm dev
```

## 주요 명령어

| 명령어           | 설명                        |
| :--------------- | :-------------------------- |
| `pnpm dev`       | 개발 서버 실행              |
| `pnpm typecheck` | 타입 검사                   |
| `pnpm lint`      | ESLint (FSD 경계 검사 포함) |
| `pnpm test`      | Vitest 실행                 |
| `pnpm build`     | 타입 검사 후 프로덕션 빌드  |
| `pnpm ai:check`  | AI 설정 생성물 동기화 검증  |

작업을 마치기 전에 `typecheck`, `lint`, `test`, `build`가 모두 통과해야 합니다.

## AI 코딩 도구 설정 (Claude Code, Codex)

규칙과 에이전트 설정의 원본·생성물 구분, 수정 방법은 [convention/ai/README.md](convention/ai/README.md)를 참고하세요. 프로젝트 공통 지침은 [AGENTS.md](AGENTS.md)입니다.

AI 설정을 수정한 뒤에는 `python3 convention/ai/render.py`와 `python3 ai/scripts/render_agents.py`로 생성 파일을 갱신합니다.
