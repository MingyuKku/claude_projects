## 핵심 명령어

```bash
pnpm dev              # 로컬 개발 서버 실행
pnpm verify           # 완료 전 검증: typecheck · lint · i18n:check · test (통과한 검사는 한 줄, 실패는 전체 출력)
pnpm build            # TypeScript 타입 검사 및 프로덕션 번들 빌드
pnpm test             # Vitest 기반 단위/컴포넌트 테스트 실행
pnpm test:ui          # Vitest 인터랙티브 UI 실행
pnpm lint             # ESLint 린트 검사
pnpm typecheck        # tsc --noEmit 타입 검사
pnpm format           # Prettier 코드 포맷팅
pnpm i18n             # 번역 키 타입(src/app/i18n/resources.gen.d.ts) 생성. ko.json 키를 바꾸면 실행
pnpm i18n:check       # 번역 파일 검사 (언어별 키 구성·빈 값·locales 위치·생성 타입 최신 여부)
pnpm ai:check        # AI 규칙·에이전트·skill 동기화 검증 (생성물 구문 검사 포함)
pnpm ai:review       # MR 을 열기 전 CI 와 같은 기준으로 AI 리뷰 (터미널 출력만, --base <ref> 로 비교 대상 변경)
```
