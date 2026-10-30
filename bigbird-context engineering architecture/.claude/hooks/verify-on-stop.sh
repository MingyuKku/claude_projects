#!/bin/sh
# 턴이 끝날 때 타입체크·번역 검사·테스트를 돌린다. 빨간 채로 "다 했습니다" 하고 끝나는 것을 막는다.
#
# - Claude 가 검증 입력을 바꾼 표시(.claude/.unverified-edits, 편집 직후 훅이 남김)가 없으면 아무것도 안 한다.
#   질문만 한 턴이나 문서만 고친 턴에 사용자의 작업 중 코드 실패로 요청 밖 수정을 시키지 않기 위해서다.
#   표시는 검증이 통과하거나 사람에게 넘길 때 지운다.
# - 검증 입력(소스·설정·lockfile)의 내용 지문이 지난 성공과 같으면 아무것도 안 한다.
#   지문 계산은 scripts/verify.sh 에 있다. 에이전트가 `pnpm verify` 로 이미 통과시켰으면 여기서 다시 돌지 않는다.
# - block 을 내면 Claude 가 다시 돌므로 무한 루프를 카운터로 막는다.
#   MAX_ATTEMPTS 번까지 되돌리고, 그 뒤로는 사람에게 넘긴다.
#   되돌릴 때 테스트를 고쳐 통과시키지 말라고 함께 알린다. 횟수 제한 안에 통과시켜야 하는 압박이 그쪽으로 새지 않게.
# - pnpm typecheck / pnpm i18n:check / pnpm test 스크립트가 없으면 해당 검사는 건너뛴다.
#   lint 는 편집 직후 훅(format-and-check.sh)이 파일 단위로 처리하므로 여기서 돌리지 않는다.

MAX_ATTEMPTS=3
VERIFIED=".claude/.last-verified"
LOG=".claude/.last-verify.log"
UNVERIFIED=".claude/.unverified-edits"

command -v jq >/dev/null 2>&1 || exit 0

payload=$(cat)
resumed=$(printf '%s' "$payload" | jq -r '.stop_hook_active // false')
# 세션마다 재시도 횟수를 따로 센다. 세션 ID 가 없으면 공용 카운터를 쓴다.
sid=$(printf '%s' "$payload" | jq -r '.session_id // empty' | tr -cd 'A-Za-z0-9_-')
COUNTER=".claude/.stop-attempts${sid:+-$sid}"
[ "$resumed" = "true" ] || rm -f "$COUNTER"

[ -f "$UNVERIFIED" ] || exit 0

# 미커밋 변경이 그대로면 재검사하지 않고, lockfile·설정이 바뀌면 다시 검사한다.
fingerprint=""
[ -f scripts/verify.sh ] && fingerprint=$(sh scripts/verify.sh --fingerprint)
if [ -n "$fingerprint" ] && [ "$(cat "$VERIFIED" 2>/dev/null)" = "$fingerprint" ]; then
  rm -f "$UNVERIFIED"
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

if has_script i18n:check; then
  i18n=$($PNPM i18n:check 2>&1); rc=$?
  { printf '== pnpm i18n:check (exit %s)\n%s\n' "$rc" "$i18n"; } >> "$LOG" 2>/dev/null
  if [ "$rc" -ne 0 ]; then
    [ -n "$failures" ] && failures="$failures

"
    failures="${failures}번역 검사 실패 (exit $rc):
$(summarize '^  - ' "$i18n")"
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
  rm -f "$COUNTER" "$UNVERIFIED"
  [ -n "$fingerprint" ] && printf '%s' "$fingerprint" > "$VERIFIED"
  exit 0
fi

failures="$failures

전체 로그: $LOG"

attempts=$(( $(cat "$COUNTER" 2>/dev/null || echo 0) + 1 ))
printf '%s\tstop\tattempt-%s\t%s\n' "$(date +%Y-%m-%dT%H:%M:%S)" "$attempts" \
  "$(printf '%s' "$failures" | sed -n 2p)" >> .claude/hook-log.tsv 2>/dev/null

if [ "$attempts" -gt "$MAX_ATTEMPTS" ]; then
  rm -f "$COUNTER" "$UNVERIFIED"
  jq -n --arg m "⚠ ${MAX_ATTEMPTS}회 자동 수정에도 검증이 통과하지 못했습니다. 직접 확인이 필요합니다.

$failures" '{systemMessage: $m}'
  exit 0
fi

echo "$attempts" > "$COUNTER"
jq -n --arg reason "작업을 끝내기 전에 아래를 고치세요. 고친 뒤 pnpm verify 로 직접 확인하세요. 이번 작업과 무관한 기존 실패(사용자가 작업 중인 코드 등)는 고치지 말고 사용자에게 보고하세요. 테스트를 통과시키려고 기대값을 바꾸거나 테스트를 지우거나 건너뛰게(.skip) 하지 말고 구현을 고치세요. 기획 변경으로 기대값이 달라져야 하면 바꾸기 전에 사유를 사용자에게 먼저 설명하세요.

$failures" '{decision: "block", reason: $reason}'
