#!/usr/bin/env bash
# bigbird-client-fe-react 의 origin/stage(사내 GitLab 에 반영된 내용만)를 claude_projects/smallbird 로 복사하고
# claude_projects 의 main 에 커밋·push 한다. 로컬 체크아웃 브랜치와 무관하다.
#
# 사용법:
#   ./sync-smallbird.sh [원본 프로젝트 경로] [--dry-run]
#   - 원본 경로 기본값: ../bigbird-client-fe-react
#   - --dry-run: smallbird 로 복사만 하고 커밋·push 는 하지 않는다
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC="$HERE/../bigbird-client-fe-react"
DRY_RUN=0

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
    *) SRC="$arg" ;;
  esac
done

SRC="$(cd "$SRC" && git rev-parse --show-toplevel)"
DEST="$HERE/smallbird"

cd "$HERE"
[ "$(git rev-parse --abbrev-ref HEAD)" = "main" ] || { echo "claude_projects 가 main 브랜치가 아니야" >&2; exit 1; }
git pull --ff-only origin main

SRC_BRANCH="stage"
git -C "$SRC" fetch -q origin "$SRC_BRANCH"
SRC_REF="origin/$SRC_BRANCH"
SRC_SHA="$(git -C "$SRC" rev-parse --short "$SRC_REF")"
SRC_SUBJECT="$(git -C "$SRC" log -1 --format=%s "$SRC_REF")"

# 커밋된 파일만 복사하므로 .gitignore 대상(node_modules, dist, .env, 로컬 설정)은 자동 제외된다.
rm -rf "$DEST"
mkdir -p "$DEST"
git -C "$SRC" archive "$SRC_REF" | tar -x -C "$DEST"

git add -A -- smallbird
if git diff --cached --quiet -- smallbird; then
  echo "smallbird 에 변경 없음 ($SRC_BRANCH @ $SRC_SHA)"
  exit 0
fi

if [ "$DRY_RUN" = 1 ]; then
  echo "[dry-run] 복사 완료. 커밋·push 는 건너뜀 ($SRC_BRANCH @ $SRC_SHA)"
  git status --short -- smallbird | head -20
  exit 0
fi

git commit -m "update: smallbird 동기화 ($SRC_BRANCH @ $SRC_SHA)" \
  -m "[개요]
bigbird-client-fe-react 의 $SRC_BRANCH 브랜치를 smallbird 로 동기화

[변경 내용]
- 원본 최신 커밋: $SRC_SHA $SRC_SUBJECT" -- smallbird
git push origin main
