#!/bin/sh
# src/ 아래 .ts/.tsx 를 건드린 직후 실행된다.
#
# 1) 기계적으로 고칠 수 있는 것(import 순서, 포맷)은 조용히 고친다.
# 2) 고칠 수 없는 것(FSD 경계 위반 등 ESLint error)은 additionalContext 로 되먹인다.
#
# Bash 도 매처에 포함한다: sed·perl·python 으로 한 편집이 훅을 우회하지 못하게.
# Bash 는 파일 경로를 안 주므로 "직전 실행 이후 바뀐 파일"을 스탬프로 찾는다.
# eslint/prettier 가 설치되기 전에는 아무것도 하지 않는다.

STAMP=".claude/.last-format-check"
ESLINT="node_modules/.bin/eslint"
PRETTIER="node_modules/.bin/prettier"

[ -x "$ESLINT" ] && [ -x "$PRETTIER" ] || exit 0
if ! command -v jq >/dev/null 2>&1; then
  printf '%s\n' '{"hookSpecificOutput":{"hookEventName":"PostToolUse","additionalContext":"jq 가 설치되어 있지 않아 컨벤션 자동 교정 훅이 동작하지 않습니다. jq 를 설치하세요."}}'
  exit 0
fi

payload=$(cat)
target=$(printf '%s' "$payload" |
  jq -r '.tool_response.filePath // .tool_input.file_path // empty')

if [ -n "$target" ]; then
  files="$target"
elif [ -f "$STAMP" ]; then
  files=$(find src -type f \( -name '*.ts' -o -name '*.tsx' \) -newer "$STAMP" 2>/dev/null)
else
  files=$( { git diff --name-only HEAD -- 'src/*.ts' 'src/*.tsx' 2>/dev/null
             git ls-files --others --exclude-standard -- 'src/*.ts' 'src/*.tsx' 2>/dev/null; } | sort -u)
fi

mkdir -p "$(dirname "$STAMP")" && touch "$STAMP"

# shadcn 원본·생성물은 건드리지 않는다. 경로는 줄 단위로 다뤄 공백이 있어도 쪼개지지 않는다.
is_target() {
  case "$1" in
    */src/shared/ui/* | src/shared/ui/*) return 1 ;;
    */src/shared/api/generated/* | src/shared/api/generated/*) return 1 ;;
    */src/*.ts | */src/*.tsx | src/*.ts | src/*.tsx) return 0 ;;
    *) return 1 ;;
  esac
}

checked=$(printf '%s\n' "$files" | while IFS= read -r f; do
  if is_target "$f" && [ -f "$f" ]; then printf '%s\n' "$f"; fi
done)

[ -n "$checked" ] || exit 0

run_on_checked() { printf '%s\n' "$checked" | tr '\n' '\0' | xargs -0 "$@"; }

run_on_checked "$ESLINT" --fix >/dev/null 2>&1
run_on_checked "$PRETTIER" --write >/dev/null 2>&1
touch "$STAMP"

# ESLint 가 lint 오류 없이 실패(설정·실행 오류, 종료 코드 2 이상)하면 조용히 넘기지 않고 알린다.
report=$(run_on_checked "$ESLINT" --format json 2>/dev/null)
eslint_rc=$?
eslint_failure=""
if ! printf '%s' "$report" | jq -e . >/dev/null 2>&1 || [ "$eslint_rc" -gt 1 ]; then
  eslint_failure="ESLint 가 정상 실행되지 않았습니다(종료 코드 $eslint_rc). eslint.config.js 와 의존성을 확인하세요. 검사 결과를 믿을 수 없습니다."
  report="[]"
fi

remaining=$(printf '%s' "$report" |
  jq -r '.[] | .filePath as $p | .messages[]? | select(.severity == 2)
         | "  \($p | split("/") | last):\(.line):\(.column)  \(.message)  [\(.ruleId)]"' |
  head -8)

# 어떤 규칙이 실제로 걸리는지 남긴다 (gitignore). 안 걸리는 규칙은 지우고,
# 매번 걸리는 규칙은 훅이 대신 고칠 후보다.
printf '%s' "$report" |
  jq -r --arg t "$(date +%Y-%m-%dT%H:%M:%S)" \
    '.[] | .filePath as $p | .messages[]?
     | [$t, (if .severity == 2 then "error" else "warn" end), (.ruleId // "none"),
        ($p | split("/") | last)] | @tsv' \
    >> .claude/hook-log.tsv 2>/dev/null

# 린트·타입 에러를 억제 주석으로 덮는 우회를 되먹인다. 규칙을 끄지 말고 코드를 고쳐야 한다.
# (@ts-expect-error 는 사유를 적는 정당한 용법이 있어 제외한다.)
# 추적 중인 파일은 이번 변경(diff)에서 추가된 줄만, 새 파일은 전체를 본다. 기존 주석으로 매번 경고하지 않기 위해서다.
SUPPRESS_RE='eslint-disable|@ts-ignore|@ts-nocheck'
suppressed=$(printf '%s\n' "$checked" | while IFS= read -r f; do
  if git ls-files --error-unmatch -- "$f" >/dev/null 2>&1; then
    git diff -U0 HEAD -- "$f" 2>/dev/null | grep -E "^\+[^+].*($SUPPRESS_RE)" | head -3 | sed "s|^+|  $f: |"
  else
    grep -nE "$SUPPRESS_RE" "$f" 2>/dev/null | head -3 | sed "s|^|  $f:|"
  fi
done | head -5)

msg=""
[ -n "$eslint_failure" ] && msg="$eslint_failure"
[ -n "$remaining" ] && msg="${msg:+$msg

}자동 교정으로 해결되지 않은 ESLint 오류가 남았습니다. AGENTS.md 와 .claude/rules 의 규약에 맞게 고치세요:
$remaining"
if [ -n "$suppressed" ]; then
  [ -n "$msg" ] && msg="$msg

"
  msg="${msg}린트/타입 억제 주석이 발견되었습니다. 규칙을 끄거나 억제하지 말고 근본 원인을 고치세요. 불가피하면 사유를 사용자에게 먼저 설명하세요:
$suppressed"
fi

if [ -n "$msg" ]; then
  jq -n --arg m "$msg" '{
    hookSpecificOutput: { hookEventName: "PostToolUse", additionalContext: $m }
  }'
fi
