#!/bin/sh
# 턴이 끝날 때 타입체크와 테스트를 돌린다. 빨간 채로 "다 했습니다" 하고 끝나는 것을 막는다.
#
# - 소스가 바뀌지 않았으면 아무것도 안 한다.
# - block 을 내면 Claude 가 다시 돌므로 무한 루프를 카운터로 막는다.
#   MAX_ATTEMPTS 번까지 되돌리고, 그 뒤로는 사람에게 넘긴다.
# - pnpm typecheck / pnpm test 스크립트가 없으면 해당 검사는 건너뛴다.

MAX_ATTEMPTS=3
COUNTER=".claude/.stop-attempts"
VERIFIED=".claude/.last-verified"
WATCH="src tsconfig.json vite.config.ts vitest.config.ts package.json"

command -v jq >/dev/null 2>&1 || exit 0

payload=$(cat)
resumed=$(printf '%s' "$payload" | jq -r '.stop_hook_active // false')
[ "$resumed" = "true" ] || rm -f "$COUNTER"

head=$(git rev-parse HEAD 2>/dev/null)
if git diff --quiet HEAD -- $WATCH 2>/dev/null &&
   [ -z "$(git ls-files --others --exclude-standard -- $WATCH 2>/dev/null)" ] &&
   [ "$(cat "$VERIFIED" 2>/dev/null)" = "$head" ]; then
  exit 0
fi

[ -d node_modules ] || exit 0
if command -v pnpm >/dev/null 2>&1; then PNPM="pnpm"; else PNPM="corepack pnpm"; fi

has_script() { jq -e --arg s "$1" '.scripts[$s] // empty' package.json >/dev/null 2>&1; }

failures=""

if has_script typecheck && ! typecheck=$($PNPM typecheck 2>&1); then
  failures="타입 오류:
$(printf '%s' "$typecheck" | grep -E '^[^ ].*error TS' | head -8)"
fi

if has_script test && ! tests=$($PNPM test 2>&1); then
  [ -n "$failures" ] && failures="$failures

"
  failures="${failures}테스트 실패:
$(printf '%s' "$tests" | grep -E '✕|FAIL|AssertionError' | head -8)"
fi

if [ -z "$failures" ]; then
  rm -f "$COUNTER"
  [ -n "$head" ] && printf '%s' "$head" > "$VERIFIED"
  exit 0
fi

attempts=$(( $(cat "$COUNTER" 2>/dev/null || echo 0) + 1 ))
printf '%s\tstop\tattempt-%s\t%s\n' "$(date +%Y-%m-%dT%H:%M:%S)" "$attempts" \
  "$(printf '%s' "$failures" | sed -n 2p)" >> .claude/hook-log.tsv 2>/dev/null

if [ "$attempts" -gt "$MAX_ATTEMPTS" ]; then
  rm -f "$COUNTER"
  jq -n --arg m "⚠ ${MAX_ATTEMPTS}회 자동 수정에도 검증이 통과하지 못했습니다. 직접 확인이 필요합니다.

$failures" '{systemMessage: $m}'
  exit 0
fi

echo "$attempts" > "$COUNTER"
jq -n --arg reason "작업을 끝내기 전에 아래를 고치세요. 고친 뒤 pnpm typecheck 와 pnpm test 로 직접 확인하세요.

$failures" '{decision: "block", reason: $reason}'
