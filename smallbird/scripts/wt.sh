#!/usr/bin/env bash
# 병렬 작업용 git worktree 생성·정리 도우미.
#   scripts/wt.sh new <브랜치>   origin/stage 에서 분기, 로컬 파일 링크, pnpm install
#   scripts/wt.sh rm  <이름>     머지 확인 후 워크트리·로컬 브랜치 정리 (이름 = 폴더 접미사 또는 브랜치)
#   scripts/wt.sh ls             워크트리 목록
# 폴더는 `../<저장소>-<이름>` 이고 이름은 브랜치에서 `feat/` 같은 앞부분을 떼고 `/` 를 `-` 로 바꾼 것이다.
#   예) chore/worktree-script -> ../bigbird-client-fe-react-worktree-script
# 어느 워크트리에서 실행해도 메인 폴더 기준으로 동작한다.
set -euo pipefail

MAIN="$(cd "$(git rev-parse --git-common-dir)/.." && pwd)"
PREFIX="$(basename "$MAIN")"
# 메인의 gitignore 로컬 파일. 복사하지 않고 링크해서 한 곳에서만 고친다.
LINKS=(.env.local .claude/settings.local.json CLAUDE.local.md NOTES.local.md .claude/figma-cache)

die() { echo "오류: $*" >&2; exit 1; }
name_of() { local n="${1#*/}"; echo "${n//\//-}"; }
dir_of() { echo "$MAIN/../$PREFIX-$(name_of "$1")"; }

cmd_new() {
  [[ $# -eq 1 && "$1" == */* ]] || die "사용법: wt.sh new <type/브랜치>  예) wt.sh new fix/auth-signup"
  local dir; dir="$(dir_of "$1")"
  [[ ! -e "$dir" ]] || die "이미 있음: $dir"
  git -C "$MAIN" fetch origin
  git -C "$MAIN" worktree add -b "$1" "$dir" origin/stage
  git -C "$dir" branch --unset-upstream 2>/dev/null || true # stage 로 push 되지 않게
  # .gitignore 의 `.claude/figma-cache/` 는 디렉터리만 무시해서 링크는 untracked 로 보인다. 로컬에서만 제외한다.
  local exclude="$MAIN/.git/info/exclude"
  grep -qxF '.claude/figma-cache' "$exclude" 2>/dev/null || echo '.claude/figma-cache' >> "$exclude"
  for f in "${LINKS[@]}"; do
    [[ -e "$MAIN/$f" ]] || continue
    mkdir -p "$(dirname "$dir/$f")"
    ln -sfn "$MAIN/$f" "$dir/$f"
  done
  (cd "$dir" && pnpm install --frozen-lockfile)
  echo "완료: $dir ($1)"
}

cmd_rm() {
  [[ $# -eq 1 ]] || die "사용법: wt.sh rm <이름>  예) wt.sh rm auth-signup"
  local dir; dir="$(cd "$(dir_of "$1")" && pwd)" || die "워크트리 없음: $1"
  [[ "$PWD" != "$dir"* ]] || die "지울 워크트리 안에서는 실행할 수 없음. 메인 폴더에서 실행해."
  git -C "$MAIN" fetch origin
  local branch; branch="$(git -C "$dir" branch --show-current)"
  [[ -z "$(git -C "$dir" status --porcelain)" ]] || die "커밋 안 된 변경이 있음: $dir"
  if ! git -C "$MAIN" merge-base --is-ancestor "$branch" origin/stage; then
    die "$branch 가 origin/stage 에 머지되지 않음 (squash 머지면 직접 확인 후 git worktree remove -f)"
  fi
  # 링크 목록 밖의 gitignore 파일은 워크트리와 함께 사라지므로, 아무것도 지우기 전에 중단한다
  local extras=() p skip l
  while IFS= read -r p; do
    p="${p#!! }"; p="${p%/}"
    [[ "$p" =~ ^(node_modules|\.vite|\.playwright-mcp|dist|coverage|\.pnpm-store)$ ]] && continue
    [[ "$p" =~ \.tsbuildinfo$ ]] && continue
    [[ "$p" =~ ^\.claude/(\.last-|\.stop-attempts|\.unverified-edits|hook-log\.tsv) ]] && continue
    skip=0; for l in "${LINKS[@]}"; do [[ "$p" == "$l" ]] && skip=1; done
    [[ $skip -eq 1 ]] || extras+=("$p")
  done < <(git -C "$dir" status --porcelain --ignored | grep '^!!' || true)
  [[ ${#extras[@]} -eq 0 ]] || die "링크 목록 밖의 로컬 파일이 있음. 메인으로 옮기거나 버릴지 정한 뒤 다시 실행해: ${extras[*]}"
  # 복사본(링크 아님)이 메인과 다르면 지우면 사라지므로, 아무것도 지우기 전에 중단한다
  local differs=()
  for f in "${LINKS[@]}"; do
    [[ -e "$dir/$f" && ! -L "$dir/$f" ]] && ! diff -rq "$dir/$f" "$MAIN/$f" >/dev/null 2>&1 \
      && differs+=("$f")
  done
  [[ ${#differs[@]} -eq 0 ]] || die "메인과 다른 로컬 파일이 있음. 메인으로 합친 뒤 다시 실행해: ${differs[*]}"
  for f in "${LINKS[@]}"; do [[ -L "$dir/$f" ]] && rm "$dir/$f"; done
  rm -rf "$dir/node_modules/.vite" "$dir/.vite" 2>/dev/null || true
  git -C "$MAIN" worktree remove "$dir"
  git -C "$MAIN" branch -d "$branch" 2>/dev/null || git -C "$MAIN" branch -D "$branch"
  git -C "$MAIN" worktree prune
  echo "정리 완료: $1 ($branch)"
}

case "${1:-}" in
  new) shift; cmd_new "$@" ;;
  rm) shift; cmd_rm "$@" ;;
  ls) git -C "$MAIN" worktree list ;;
  *) die "사용법: wt.sh new|rm|ls" ;;
esac
