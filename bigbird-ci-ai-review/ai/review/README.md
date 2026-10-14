# AI 코드 리뷰 운영 가이드

- **MR**: Ready MR은 푸시마다 자동 리뷰, Draft MR은 파이프라인의 ▶ 버튼으로 수동 실행. 머지는 막지 않습니다.
- **로컬**: `pnpm ai:review` (터미널 출력만, 각자의 `claude` 로그인 사용)
- 리뷰 기준: `criteria.md`, `checklist.md` / 실행: `scripts/ai-review.sh`
- **인라인 코멘트**: 필수·권장 수정은 Changes 탭의 해당 줄에 코멘트(discussion)로 달리고, 요약 노트에는 💬 링크만 남습니다. 확인 필요 등 나머지 항목의 `경로:줄번호`는 Changes 탭의 해당 파일 링크가 됩니다.
  - 줄 없는 지적, diff 밖 줄, 한 번에 30개를 넘는 지적, GitLab이 위치를 거부한 지적은 요약 노트에 본문째 남습니다. 리뷰 범위는 항상 MR Changes 탭과 같은 diff(MR 기준 커밋 → 소스 head)이며, merged-results 파이프라인도 소스 head로 바꿔 체크아웃해 리뷰합니다(대상 브랜치와 합친 결과는 그 파이프라인의 빌드·테스트가 검증합니다). 리뷰 중 새 푸시 등으로 Changes 탭의 diff가 바뀌었으면 줄이 어긋날 수 있어 인라인 없이 모두 요약 노트에 적습니다.
  - 푸시 후 재리뷰에서 같은 파일·같은 코드(지적한 줄과 앞뒤 한 줄)의 지적은 새로 달지 않고 기존 코멘트를 씁니다. 사람이 resolve한 코멘트는 다시 열지 않습니다. 더 이상 나오지 않는 지적은 자동으로 resolve하며, 일부 묶음이 미완료이면 건드리지 않습니다. 자동 resolve 뒤 사람이 다시 연 코멘트는 다시 닫지 않습니다.
  - `GITLAB_REVIEW_TOKEN`의 `api` scope로 충분합니다. 로컬 `pnpm ai:review`는 게시하지 않으므로 지적이 터미널에 본문째 출력됩니다.
- **큰 MR**: diff가 8만 자를 넘으면 파일 단위 묶음(각 8만 자 이하, 최대 8개)으로 나눠 4개씩 동시에 리뷰하고 노트 하나로 합칩니다. 묶음이 하나라도 FAIL이면 FAIL, 미완료나 8개를 넘어 못 본 파일이 있으면 INCOMPLETE입니다. 묶음 수만큼 사용량이 늘어납니다.

## 설정 (Maintainer)

1. Settings → Access tokens: `ai-review-bot`, Role `Developer`, Scope `api`
2. 회사 Claude 계정으로 `claude setup-token` 실행해 구독 토큰 발급
3. Settings → CI/CD → Variables에 등록 (Masked, Protect 해제)
   - `GITLAB_REVIEW_TOKEN`: 1의 토큰
   - `CLAUDE_CODE_OAUTH_TOKEN`: 2의 토큰
   - `AI_REVIEW_API_BASE` (선택): 러너에서 GitLab API가 HTTP 503이면 내부 GitLab 주소 (biglink와 같은 값)

## 토큰 갱신

두 토큰 모두 **자동 갱신되지 않습니다.** 만료 전에 다시 발급해 변수 값을 교체합니다. 만료되면 MR 노트가 "검토 미완료"로 표시됩니다.

| 토큰 | 만료일 | 발급자 |
| --- | --- | --- |
| `CLAUDE_CODE_OAUTH_TOKEN` (1년) | | |
| `GITLAB_REVIEW_TOKEN` | | |

## 향후 전환

현재 구독 토큰 방식은 크레딧 승인 전 임시 운영입니다. Anthropic은 팀 공용 CI에 아래 방식을 권장합니다.

- **API 키**: `ANTHROPIC_API_KEY`로 등록하고 `CLAUDE_CODE_OAUTH_TOKEN`을 삭제. 코드 수정 없음. 크레딧 필요.
- **Workload Identity Federation**: 토큰 자동 갱신, 저장할 비밀 값 없음. 크레딧과 스크립트 수정 필요.
