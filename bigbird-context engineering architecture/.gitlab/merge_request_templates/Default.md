## 변경 의도

<!-- 무엇을, 왜 바꿨는지. 스펙이 있으면 링크: specs/<feature>.md -->

## 영향 범위

- 레이어/슬라이스:
- Public API(`index.ts`) 변경 여부:
- `shared/`·`entities/` 변경 시 확인한 소비처:

## 검증

- [ ] CI 통과 (typecheck / lint / format / test / build)
- [ ] 로직이 있으면 테스트 추가 (`.claude/rules/testing.md`)
- [ ] UI 변경이면 Figma와 비교한 스크린샷 첨부
- [ ] 에러·로딩·빈 상태 처리 확인

## 규칙 예외

<!-- eslint-disable, 레이어 규칙 예외, 신규 라이브러리 등이 있으면 사유와 합의 내용. 없으면 "없음" -->

## AI 사용

- [ ] AI가 작성/수정한 코드를 직접 읽고 검토했다
- [ ] AI 설정(`.claude/`, `AGENTS.md` 등) 변경이 있으면 `pnpm ai:check` 통과
