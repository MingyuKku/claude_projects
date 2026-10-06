# 효과적인 CLAUDE.md 및 AI 컨텍스트 문서 작성 가이드 (React 버전)

## 핵심 원칙

LLM은 상태를 유지하지 않습니다(Stateless). `CLAUDE.md`와 `AGENTS.md`는 매 세션마다 코드베이스를 소개하는 핵심 온보딩 문서입니다.
루트 문서는 **WHAT(구조)**과 **WHY(설계 의도)**에 집중하고, 세부 규칙은 경로별 파일(`.claude/rules/*.md`)로, 심층 명세는 `docs/conventions/`로 위임하십시오. `.claude/rules/`는 직접 수정하는 원본이고, `AGENTS.md`/`CLAUDE.md`는 `convention/ai/partials`에서 생성되는 파일입니다 (`convention/ai/README.md` 참조).

## 문서 구조: WHAT, WHY, HOW

| 섹션     | 목적                                                 | 예시                                                        |
| :------- | :--------------------------------------------------- | :---------------------------------------------------------- |
| **WHAT** | 프로젝트 범위, React/TS 기술 스택, 디렉터리 레이아웃 | "React 19 + TypeScript + Tailwind CSS 애플리케이션"         |
| **WHY**  | 아키텍처 경계, 데이터 흐름의 근거                    | "피처는 격리되며, API 응답은 반드시 트랜스포머를 거쳐야 함" |
| **HOW**  | 핵심 개발 명령어                                     | "`pnpm dev`, `pnpm test`, `pnpm build`"                     |

WHY에 집중하십시오. HOW는 코드나 도구로 파악할 수 있지만, WHY(설계 의도)는 스스로 유추하기 어렵습니다.

## 권장 문서 길이 가이드라인

| 파일 종류            | 권장 줄 수 | 최대 줄 수 |
| :------------------- | :--------: | :--------: |
| 루트 `CLAUDE.md`     |   < 50줄   |    80줄    |
| `AGENTS.md` (SSOT)   |  < 100줄   |   150줄    |
| `.claude/rules/*.md` |   < 60줄   |    80줄    |

## 안티패턴 및 권장 사례

### 1. 지양: 대규모 인라인 코드 예시 나열

```tsx
// ❌ 나쁜 예 - 규칙 파일의 절반이 보일러플레이트 코드로 채워짐
export const Button = ({ children, variant, size, ...props }) => {
  // ... 50줄의 컴포넌트 구현 코드 ...
};
```

### 권장: 실제 코드 위치 참조

```markdown
패턴: 명시적 Props 인터페이스를 갖춘 피처 기반 컴포넌트
참조 코드: src/shared/components/ui/Button.tsx:12-45
```

### 2. 지양: 프롬프트에 린팅/포맷팅 규칙 강제

Claude는 지능형 에이전트이며 단순 린터가 아닙니다.

- "항상 작은따옴표 사용", "들여쓰기 2칸" 등의 스타일 규칙을 프롬프트에 넣지 마십시오.
- ESLint, Prettier, Biome 등 전용 도구가 결정론적으로 강제하도록 위임하십시오.

### 3. 지양: 망라적인 모든 명령어 나열

```markdown
// ❌ 나쁜 예 - 모든 스크립트 나열
pnpm run dev
pnpm run build
pnpm run preview
pnpm run test
pnpm run test:watch
pnpm run test:coverage
...

// ✅ 좋은 예 - 핵심 패턴 및 검색 방법 안내
개발 서버: `pnpm dev`
빌드 및 테스트: `pnpm build` / `pnpm test`
전체 스크립트: `package.json` 참조
```

## 점진적 컨텍스트 노출 구조 (Progressive Disclosure)

```
CLAUDE.md                    # 항상 로드됨 (~30줄, AGENTS.md 임포트)
├── AGENTS.md                # 공유 표준 명세 (~80줄)
├── .claude/rules/           # 일치하는 파일 경로 편집 시 자동 로드
│   ├── architecture.md      # 피처 중심 레이어 경계
│   ├── react-components.md  # React 19 / 컴포넌트 설계 패턴
│   ├── state-management.md  # Zustand 및 React Query 규칙
│   ├── styling.md           # Tailwind CSS 및 디자인 토큰
│   ├── api-integration.md   # API 트랜스포머 및 클라이언트 훅
│   └── error-handling.md    # 에러 바운더리 및 tryit 에러 처리
└── docs/conventions/        # 필요 시 온디맨드로 조회
```

## 커밋 전 체크리스트

- [ ] 권장 줄 수 제한을 준수했는가?
- [ ] HOW보다 WHY(설계 의도)가 충분히 설명되었는가?
- [ ] 가상 인라인 코드 대신 실제 코드 위치를 참조했는가?
- [ ] 린터가 처리해야 할 단순 포맷팅 규칙이 배제되었는가?
- [ ] AI 에이전트와 인간 개발자 모두에게 명확한가?
