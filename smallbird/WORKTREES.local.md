# 워크트리 운영 메모 (로컬 전용, git 제외)

## 규칙
- 메인 폴더 `bigbird-client-fe-react` 는 `stage` 고정. 여기서 작업하지 않고 fetch·비교·워크트리 생성/정리만 한다.
- 워크트리 1개 = 브랜치 1개 = MR 1개. 머지되면 바로 정리한다.
- 분기 기준은 항상 `origin/stage` (먼저 `git fetch`).
- 폴더는 `../bigbird-client-fe-react-<짧은이름>`, 브랜치는 `feat/`·`fix/` + 영역 + 성격.
- 세션(Claude Code)은 워크트리 폴더마다 따로 연다.
- 지울 때는 `rm -rf` 금지, `git worktree remove` (스크립트가 처리).

## 명령
```bash
scripts/wt.sh new <브랜치>   # 생성: 분기 + 로컬 파일 링크 + pnpm install   예) new fix/auth-signup
scripts/wt.sh rm  <이름>     # 정리: 머지 확인 + 링크 제거 + remove + 브랜치 삭제 (메인 폴더에서 실행)   예) rm auth-signup
scripts/wt.sh ls             # 목록
```
폴더 이름은 브랜치에서 `feat/` 같은 앞부분을 떼고 `/` 를 `-` 로 바꾼 것이다 (`chore/worktree-script` → `../bigbird-client-fe-react-worktree-script`). `rm` 에는 이 이름이나 브랜치 전체를 쓴다.
`new` 는 `.claude/figma-cache` 링크가 untracked 로 보이지 않도록 메인 `.git/info/exclude` 에 제외 규칙을 자동으로 넣는다.

## 로컬 파일은 링크
`.env.local`, `.claude/settings.local.json`, `CLAUDE.local.md`, `NOTES.local.md`, `.claude/figma-cache/` 는 메인 파일로 심볼릭 링크된다.
- 환경변수·설정은 메인에서 한 번만 고치면 모든 워크트리에 반영된다.
- 워크트리만 다른 값이 필요하면 링크를 지우고 그 폴더에 복사본을 둔다 (정리할 때 스크립트가 "메인과 다름" 경고를 낸다).
- 링크 때문에 figma-cache 를 메인으로 옮기는 작업이 필요 없다.

## 정리 후 확인
- 원격 브랜치는 머지 때 자동 삭제된다.
- 원격이 사라진(`gone`) 로컬 브랜치는 `git log stage..<브랜치>` 로 stage 에 없는 커밋이 0개일 때만 `-d` 로 지운다.
- 서버(vite)가 떠 있으면 먼저 종료한다. 내가 띄운 것만 PID 로 종료.

## 현재 워크트리
| 폴더 | 브랜치 | 비고 |
| --- | --- | --- |
| `bigbird-client-fe-react` | `stage` | 기지 |
| `bigbird-client-fe-react-mypage-qa` | `fix/mypage-qa-1106` | 진행 중 (복사본 방식, 링크 아님) |
