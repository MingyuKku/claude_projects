# 개인 노트 (로컬 전용)

> 커밋되지 않는 개인 메모 (`.git/info/exclude`로 제외)

## 개발 환경

- **IP로 접속**: `pnpm dev --host` → 터미널의 `Network:` IP로 접속. origin이 달라 **다시 로그인** 필요

## Git 단축 명령어 (Oh My Zsh git 플러그인)

자주 쓰는 것만 정리. 전체 목록은 `alias | grep '^g'`.

| 단축 | 실제 명령 | 용도 |
| --- | --- | --- |
| `gst` | `git status` | 상태 확인 |
| `gss` | `git status --short` | 짧게 상태 확인 |
| `gd` | `git diff` | 변경 내용 보기 |
| `gc` | `git commit --verbose` | 커밋 (diff 표시) |
| `gcmsg` | `git commit --message` | 메시지와 함께 커밋 |
| `gca!` | `git commit --verbose --all --amend` | 직전 커밋 수정 |
| `gp` | `git push` | 푸시 |
| `gpsup` | `git push --set-upstream origin <현재 브랜치>` | 새 브랜치 첫 푸시 |
| `gpf` | `git push --force-with-lease --force-if-includes` | 안전한 강제 푸시 |
| `gl` | `git pull` | 풀 |
| `gpr` | `git pull --rebase` | 리베이스 풀 |
| `gf` / `gfa` | `git fetch` / `git fetch --all --tags --prune` | 원격 정보 가져오기 |
| `gb` | `git branch` | 브랜치 목록 |
| `gcb` | `git checkout -b` | 브랜치 생성 후 이동 |
| `gsw` / `gswc` | `git switch` / `git switch --create` | 브랜치 전환 / 생성 |
| `gco` | `git checkout` | 체크아웃 |
| `gbd` | `git branch --delete` | 브랜치 삭제 |
| `gm` | `git merge` | 병합 |
| `grb` / `grbi` | `git rebase` / `git rebase --interactive` | 리베이스 |
| `grbc` / `grba` | `git rebase --continue` / `--abort` | 리베이스 계속 / 중단 |
| `gcp` | `git cherry-pick` | 체리픽 |
| `gsta` / `gstp` / `gstl` | `git stash push` / `pop` / `list` | 스태시 저장 / 복원 / 목록 |
| `grst` | `git restore --staged` | 스테이징 취소 |
| `glog` | `git log --oneline --decorate --graph` | 그래프 로그 |

---

<!-- 아래에 계속 추가 -->
