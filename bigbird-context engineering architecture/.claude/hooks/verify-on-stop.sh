#!/bin/sh
# 턴이 끝날 때 타입체크와 테스트를 돌린다. 빨간 채로 "다 했습니다" 하고 끝나는 것을 막는다.
#
# - 검증 입력(소스·설정·lockfile)의 내용 지문이 지난 성공과 같으면 아무것도 안 한다.
# - block 을 내면 Claude 가 다시 돌므로 무한 루프를 카운터로 막는다.
#   MAX_ATTEMPTS 번까지 되돌리고, 그 뒤로는 사람에게 넘긴다.
# - pnpm typecheck / pnpm test 스크립트가 없으면 해당 검사는 건너뛴다.

MAX_ATTEMPTS=3
VERIFIED=".claude/.last-verified"
LOG=".claude/.last-verify.log"
# 검증 입력이 되는 파일. lockfile 도 포함한다(의존성만 바뀌어도 이전 성공을 재사용하지 않기 위해).
WATCH="src tsconfig.json vite.config.ts vitest.config.ts package.json pnpm-lock.yaml"

command -v jq >/dev/null 2>&1 || exit 0

payload=$(cat)
resumed=$(printf '%s' "$payload" | jq -r '.stop_hook_active // false')
# 세션마다 재시도 횟수를 따로 센다. 세션 ID 가 없으면 공용 카운터를 쓴다.
sid=$(printf '%s' "$payload" | jq -r '.session_id // empty' | tr -cd 'A-Za-z0-9_-')
COUNTER=".claude/.stop-attempts${sid:+-$sid}"
[ "$resumed" = "true" ] || rm -f "$COUNTER"

# 커밋(HEAD)이 아니라 검증 입력의 내용으로 지문을 만든다.
# 미커밋 변경이 그대로면 재검사하지 않고, lockfile·설정이 바뀌면 다시 검사한다.
fingerprint=$(git ls-files -z -co --exclude-standard -- $WATCH 2>/dev/null |
  xargs -0 shasum 2>/dev/null | shasum | cut -d' ' -f1)
if [ -n "$fingerprint" ] && [ "$(cat "$VERIFIED" 2>/dev/null)" = "$fingerprint" ]; then
  exit 0
fi

[ -d node_modules ] || exit 0
if command -v pnpm >/dev/null 2>&1; then PNPM="pnpm"; else PNPM="corepack pnpm"; fi

has_script() { jq -e --arg s "$1" '.scripts[$s] // empty' package.json >/dev/null 2>&1; }

failures=""
: > "$LOG" 2>/dev/null

# 검사 출력에서 오류 줄만 뽑되, 정규식에 안 잡히면 끝부분을 그대로 보여준다.
summarize() {
  picked=$(printf '%s' "$2" | grep -E "$1" | head -8)
  [ -n "$picked" ] || picked=$(printf '%s' "$2" | tail -8)
  printf '%s' "$picked"
}

if has_script typecheck; then
  typecheck=$($PNPM typecheck 2>&1); rc=$?
  { printf '== pnpm typecheck (exit %s)\n%s\n' "$rc" "$typecheck"; } >> "$LOG" 2>/dev/null
  if [ "$rc" -ne 0 ]; then
    failures="타입 오류 (exit $rc):
$(summarize '^[^ ].*error TS' "$typecheck")"
  fi
fi

if has_script test; then
  tests=$($PNPM test 2>&1); rc=$?
  { printf '== pnpm test (exit %s)\n%s\n' "$rc" "$tests"; } >> "$LOG" 2>/dev/null
  if [ "$rc" -ne 0 ]; then
    [ -n "$failures" ] && failures="$failures

"
    failures="${failures}테스트 실패 (exit $rc):
$(summarize '✕|FAIL|AssertionError' "$tests")"
  fi
fi

if [ -z "$failures" ]; then
  rm -f "$COUNTER"
  [ -n "$fingerprint" ] && printf '%s' "$fingerprint" > "$VERIFIED"
  exit 0
fi

failures="$failures

전체 로그: $LOG"

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
