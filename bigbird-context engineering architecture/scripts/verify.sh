#!/bin/sh
# 작업 완료 전 검증: typecheck · lint · i18n:check · test 를 한 번에 실행한다. (`pnpm verify`)
#
# - 통과한 검사는 한 줄만, 실패한 검사는 출력 전체를 보여 준다. 에이전트가 읽는 출력을 줄이기 위해서다.
# - 모두 통과하면 검증 입력의 지문을 .claude/.last-verified 에 남긴다. Claude Code 의 Stop 훅
#   (.claude/hooks/verify-on-stop.sh)은 지문이 같으면 같은 검사를 다시 돌리지 않는다.
# - `--fingerprint`: 검사 없이 지문만 출력한다. Stop 훅이 같은 계산을 쓰도록 여기 한 곳에 둔다.

# 검증 입력이 되는 파일. lockfile 도 포함한다(의존성만 바뀌어도 이전 성공을 재사용하지 않기 위해).
WATCH="src scripts/i18n.mjs tsconfig.json vite.config.ts vitest.config.ts eslint.config.js package.json pnpm-lock.yaml"
VERIFIED=".claude/.last-verified"

# 커밋(HEAD)이 아니라 검증 입력의 내용으로 지문을 만든다. 미커밋 변경이 그대로면 같은 지문이다.
fingerprint() {
  git ls-files -z -co --exclude-standard -- $WATCH 2>/dev/null |
    xargs -0 shasum 2>/dev/null | shasum | cut -d' ' -f1
}

if [ "${1:-}" = "--fingerprint" ]; then
  fingerprint
  exit 0
fi

failed=""
for check in typecheck lint i18n:check test; do
  out=$(pnpm -s "$check" 2>&1)
  rc=$?
  if [ "$rc" -eq 0 ]; then
    echo "✓ pnpm $check"
  else
    echo "✗ pnpm $check (exit $rc)"
    printf '%s\n' "$out"
    failed="$failed $check"
  fi
done

if [ -n "$failed" ]; then
  echo "실패한 검사:$failed"
  exit 1
fi

mkdir -p "$(dirname "$VERIFIED")" && fingerprint > "$VERIFIED"
echo "모든 검사를 통과했습니다."
